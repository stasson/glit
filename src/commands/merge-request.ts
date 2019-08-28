// import git from 'simple-git/promise'
import { Gitlab } from 'gitlab'
import { GlitOptions } from '../options'
import { logger } from '../logger'
import yaml  from 'js-yaml'

export type MergeRequestOptions = GlitOptions &
  Partial<{
    src: string
    dest: string
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
  const project = (await Projects.show(projectId)) as { defaultBranch: string}
  const { defaultBranch } = project

  const sourceBranch = options.src
  const targetBranch = options.dest || defaultBranch
  if (!sourceBranch) {
    throw Error('source branch is required')
  }

  const branch = (await Branches.show(projectId, sourceBranch)) as {
    title: string
  }

  const mergeRequests = (await MergeRequests.all({ projectId })) as MR[]

  let mr = mergeRequests.find(
    x =>
      x.state == 'opened' &&
      x.sourceBranch == sourceBranch &&
      x.targetBranch == targetBranch
  )

  if (!mr) {
    mr = (await MergeRequests.create(
      projectId,
      sourceBranch,
      targetBranch,
      options.title || branch.title
    )) as MR
  }

  dumpMergeRequests(mr)
}

function dumpMergeRequests(mr:MR) {
 const {title, description, targetBranch, sourceBranch, webUrl} = mr 
 logger.success(webUrl)
 logger.log(yaml.dump({title, description,  sourceBranch, targetBranch}))
}