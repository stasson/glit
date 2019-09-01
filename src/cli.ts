import cac from 'cac'
import { mergeRequest } from './commands'
import { normalizeOptions } from './options'
import { logger } from './logger'
const prog = cac()

prog
  .option('-H, --host <host>', 'server hostname (default to CI_SERVER_HOST)')
  .option('-T, --token <token>', 'access token (default to CI_ACCESS_TOKEN)')

prog
  .command('mr', 'create or update a merge request')
  .option('-p, --project <project>', 'required project id or path')
  .option('--source <branch>', 'the source branch (required)')
  .option(
    '--target <branch>',
    'the target branch (default to projects default)'
  )
  .option('--title <title>', 'the mr title (default to commit title)')
  .option(
    '--description <description>',
    'the mr description (default to commit description)'
  )
  .option('--label <label>', 'some label')
  .action(async (options: any) => {
    options = await normalizeOptions(options)

    const { token, host, project, source, target, title } = options
    logger.debug('mergeRequest:', {
      host,
      token,
      project,
      source,
      target,
      title
    })
    return mergeRequest(options)
  })

export default prog
