import cac from 'cac'
import { mergeRequest } from './commands'
import { normalizeOptions } from './options'
import { logger } from './logger';
const prog = cac()

prog
  .option('-H, --host <host>', 'server hostname: ex: gitlab.example.com')
  .option('-T, --token <token>', 'access token')
  .option('--ci', 'run in ci env')

prog
  .command('mr', 'create a merge request')
  .option('-p, --project <project>', 'project id or url')
  .option('--source <branch>', 'the source branch')
  .option('--target <branch>', 'the target branch')
  .option('--title <title>', 'the destination branch')
  .action(async (options: any) => {
    options = await normalizeOptions(options)
    const { token, host, project, source, target, title } = options
    logger.debug('mergeRequest:', { host, token, project, source, target, title })
    return mergeRequest(options)
  })

export default prog
