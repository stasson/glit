#!/usr/bin/env node
const loudRejection = require('loud-rejection')
const {logger, run} = require('../lib')
loudRejection(() => logger.error('unexpected error'))
run().catch(err=> {
  logger.error(err.message || err)
  logger.debug(err)
  process.exitCode = -1
})
