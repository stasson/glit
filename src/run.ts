import path from 'upath'
import readPkg from 'read-pkg'
import logger from './logger'
import cli from './cli'

export default async function(argv?: string[]) {
  const pkg = (await readPkg({
    cwd: path.join(__dirname, '..')
  })) as any
  cli.name = pkg.name
  cli.version(pkg.version)
  cli.help()
  const { args } = cli.parse(argv, { run: false })

  if (cli.matchedCommand) {
    return Promise.resolve(cli.runMatchedCommand())
  } else {
    if (args.length) {
      logger.error(`unkown command ${args[0]}`)
    }
    cli.outputHelp()
  }
}
