// import git from 'simple-git/promise'
import { ProjectsBundle as Gitlab } from 'gitlab'
import { GlitOptions } from '../options'
import { logger } from '../logger'
import yaml from 'js-yaml'
import pickBy from 'lodash/pickBy'

export type MergeRequestOptions = GlitOptions &
  Partial<{
    source: string
    target: string
    title: string
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
  const { host, token } = options
  const { Projects, MergeRequests, Branches } = new Gitlab({
    host,
    token,
    camelize: true,
    requestTimeout: 3000
  })

  let projectId = options.project
  let targetBranch = options.target
  let sourceBranch = options.source
  let title = options.title
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

      project = ((await Projects.search(projectName)) as {
        id: number
        name: string
        path: string
        pathWithNamespace: string
      }[]).find(p => {
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
        title: string
      }
      title = branch.title
    }

    // create
    mr = (await MergeRequests.create(
      projectId,
      sourceBranch,
      targetBranch,
      title,
      {
        labels: labels && labels.join(','),
        remove_source_branch: true
      }
    )) as MR
  } else {
    // update
    if (labels) {
      await MergeRequests.edit(projectId, mr.iid, {
        labels: labels && labels.join(','),
        remove_source_branch: true
      })
      mr = (await MergeRequests.show(projectId, mr.iid)) as MR
    }
  }
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
