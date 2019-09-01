// import git from 'simple-git/promise'
import { Gitlab } from 'gitlab'
import { GlitOptions } from '../options'
import { logger } from '../logger'
import yaml from 'js-yaml'
import pickBy from 'lodash/pickBy'

export type MergeRequestOptions = GlitOptions &
  Partial<{
    source: string
    target: string
    title: string
    description: string
    label: string | string[]
  }>

type MR = {
  id: number
  iid: number
  title: string
  description: string
  state: string
  targetBranch: string
  sourceBranch: string
  webUrl: string
  labels: string[]
}

export async function mergeRequest(options: MergeRequestOptions) {
  let { host, token } = options
  if (!token) throw Error('missing token')
  if (!host) throw Error('missing host')
  if (!host.startsWith('https://')) {
    host = `https://${host}`
  }

  const { Projects, MergeRequests, Branches, Version  } = new Gitlab({
    host,
    token,
    camelize: true,
    requestTimeout: 3000
  })

  try {
    const {version, revision} = (await Version.show()) as any
    logger.debug({host, version, revision})
  }
  catch (err) {
    const msg = err.description || err.toString() 
    throw  Error(`unable to connect to server: ${host}, ${msg}`)
  }

  let projectId = options.project
  let targetBranch = options.target
  let sourceBranch = options.source
  let title = options.title
  let description = options.description
  let labels =
    typeof options.label == 'string'
      ? options.label.split(/[, ]/).map(x => x.trim())
      : options.label

  if (!projectId) throw Error('project is required')
  if (!sourceBranch) throw Error('source is required')
  let project
  try {
    project = (await Projects.show(projectId)) as { id: number }
    projectId = project.id.toString()
  } catch (err) {
    try {
      const projectPath = projectId
      const projectName = projectPath.split('/')[-1]
      const matching = (await Projects.search(projectName)) as {
        id: number
        name: string
        path: string
        pathWithNamespace: string
      }[]
      project = matching.find(p => {
        p.pathWithNamespace == projectPath
      })
      if (project) {
        projectId = project.id.toString()
      } else {
        throw Error(`${options.project} is not a valid project id`)
      }
    } catch (err) {
      throw Error(`${options.project} is not a valid project id`)
    }
  }

  if (!targetBranch) {
    const project = (await Projects.show(projectId)) as {
      defaultBranch: string
    }
    const { defaultBranch } = project
    targetBranch = defaultBranch
  }

  const mergeRequests = (await MergeRequests.all({ projectId })) as MR[]
  let mr = mergeRequests.find(
    x =>
      x.state == 'opened' &&
      x.sourceBranch == sourceBranch &&
      x.targetBranch == targetBranch
  )
  if (!mr) {
    if (!title) {
      const branch = (await Branches.show(projectId, sourceBranch)) as {
        name: string
        commit: {
          id: string
          short_id: string
          title: string
          message: string
        }
      }
      title = branch.commit.title

      if (!description) {
        description = branch.commit.message
          .split('\n')
          .splice(1)
          .join('\n')
      }
    }

    if (!title) throw Error('missing title')

    // create
    mr = (await MergeRequests.create(
      projectId,
      sourceBranch,
      targetBranch,
      title,
      {
        description,
        labels: labels && labels.join(','),
        remove_source_branch: true
      }
    )) as MR
  } else {
    // update
    if (labels) {
      await MergeRequests.edit(projectId, mr.iid, {
        description,
        labels: labels && labels.join(','),
        remove_source_branch: true
      })
    }
  }
  mr = (await MergeRequests.show(projectId, mr.iid)) as MR
  dumpMergeRequests(mr)
}

function dumpMergeRequests(mr: MR) {
  const {
    title,
    description,
    targetBranch,
    sourceBranch,
    webUrl,
    labels: labels
  } = mr
  logger.success(webUrl)
  logger.log(
    yaml.dump(
      pickBy({
        title,
        description,
        sourceBranch,
        targetBranch,
        labels: labels.join(', ')
      }),
      {
        condenseFlow: true,
        flowLevel: 2
      }
    )
  )
}
