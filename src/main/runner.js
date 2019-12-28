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
    shell.exec(command, (code, stdout, stderr) => {
      log.info(() => ['exit code', {code}])
      log.info(() => ['output', stdout])
      if (code !== 0) {
        log.info(() => ['Exiting', stderr])
        shell.exit(code)
      }
    })
  })
}

const quit = (code = 0) => shell.exit(code)

export {run, quit, addFunction, addShell}
