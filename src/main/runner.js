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
      quit()
    }
  })
  log.info(() => 'Finished')
}

const addFunction = f => queue.push(() => f())

const addShell = command => {
  queue.push(() => {
    log.info(() => ['command', {command}])
    const result = shell.exec(command)
    if (result.code !== 0) {
      log.error(() => ['Error running command', {code: result.code}])
      quit(result.code)
    }
  })
}

const quit = (code = 1) => shell.exit(code)

export {run, quit, addFunction, addShell}
