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
}

export async function mergeRequest(options: MergeRequestOptions) {
  const { host, token } = options
  const { Projects, MergeRequests, Branches } = new Gitlab({
    host,
    token,
    camelize: true
  })

  if (!options.project) throw Error('project is required')
  let projectId = options.project
  const project = (await Projects.show(projectId)) as { defaultBranch: string }
  const { defaultBranch } = project
  const targetBranch = options.target || defaultBranch
  const sourceBranch = options.source
  if (!sourceBranch) throw Error('source branch is required')

  const mergeRequests = (await MergeRequests.all({ projectId })) as MR[]
  let mr = mergeRequests.find(
    x =>
      x.state == 'opened' &&
      x.sourceBranch == sourceBranch &&
      x.targetBranch == targetBranch
  )
  if (!mr) {
    let title = options.title
    if (!title) {
      const branch = (await Branches.show(projectId, sourceBranch)) as {
        title: string
      }
      title = branch.title
    }

    mr = (await MergeRequests.create(
      projectId,
      sourceBranch,
      targetBranch,
      title
    )) as MR
  }

  dumpMergeRequests(mr)
}

function dumpMergeRequests(mr: MR) {
  const { title, description, targetBranch, sourceBranch, webUrl } = mr
  logger.success(webUrl)
  logger.log(
    yaml.dump(pickBy({ title, description, sourceBranch, targetBranch }))
  )
}
