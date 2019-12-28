/* eslint-disable no-console */
import shell from 'shelljs'
import {log} from './logger'

const queue = []

const run = () => {
  queue.forEach(command => {
    try {
      command()
    } catch (error) {
      log.error(() => [
        'Error running command',
        {
          command,
          error
        }
      ])
    }
  })
  log.info(() => 'Finished')
}

const addFunction = f => queue.push(() => f())

const addShell = command => {
  queue.push(() => {
    log.info(() => ['command', {command}])
    if (shell.exec(command).code !== 0) {
      log.info(() => ['Error running command'])
      shell.exit(1)
    }
  })
}

const quit = (code = 0) => shell.exit(code)

export {run, quit, addFunction, addShell}
