const {Command, flags} = require('@oclif/command')
const {cli} = require('cli-ux')
const {exec} = require('child_process')

class ReleaserCommand extends Command {
  async run() {
    const commits = await cli.prompt('Enter commits')
    if (!commits) {
      this.log('you must specify commits that need to be included in release')
      return
    }
    const version = await cli.prompt('Enter release version')
    if (!version) {
      this.log('you must specify release version')
    }
    const result = exec(`git checkout -b v${version}`)
    if (result.error) {
      this.log(result.error)
      return
    }
    if (result.stderr) {
      this.log(result.stderr)
      return
    }
    this.log(result.stdout)
  }
}

ReleaserCommand.description = `Describe the command here
...
Extra documentation goes here
`

ReleaserCommand.flags = {
  version: flags.version({
    char: 'v',
  }),
  help: flags.help({
    char: 'h',
  }),
}

module.exports = ReleaserCommand
