import symbols from 'log-symbols'
import chalk from 'chalk'
import util from 'util'

export type LogType = 'debug' | 'log' | 'info' | 'warn' | 'error' | 'success'
export type LogFunction = { (...args: any): void }

const {env} = process
const {DEBUG} = env
const isDebug = !!JSON.parse(String(DEBUG || 'false'))

export const logger: Record<LogType, LogFunction> = {
  debug: (...args) => {
    const [arg0 ,...argN] = args
    if (isDebug) console.debug(chalk.grey(util.format(arg0, ...argN)))
  },
  log: (...args) => {
    console.log(...args)
  },
  info: (...args) => {
    console.info(symbols.info,  ...args)
  },
  warn: (...args) => {
    const label = chalk.yellow('warning:'.padEnd(8))
    console.warn(symbols.warning, label, ...args)
  },
  error: (...args) => {
    const label = chalk.red('error:'.padEnd(8))
    console.error(symbols.error, label, ...args)
  },
  success: (...args) => {
    const label = chalk.green('success:'.padEnd(8))
    console.info(symbols.success, label, ...args)
  }
}

export default logger
