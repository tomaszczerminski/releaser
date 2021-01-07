const {Command, flags} = require('@oclif/command')
const {cli} = require('cli-ux')
const util = require('util')
const exec = util.promisify(require('child_process').exec)
const replace = require('replace-in-file')
const fs = require('fs')

const checkoutPreviousReleaseBranch = async previous => {
  const cmd = `git checkout release/${previous}`
  console.log(`checkout on previous release branch -> ${cmd}`)
  const {stdout, stderr} = await exec(cmd)
  console.log(stdout)
  console.log(stderr)
}

const changeVersionInPoms = async (previous, current) => {
  const options = {
    files: './**/pom.xml',
    from: previous,
    to: current,
  }
  const results = await replace(options)
  console.log('Replacement results:', results)
}

const createReleaseCommit = async version => {
  const cmd = `git commit -m "Release ${version}"`
  console.log(`creating release commit -> ${cmd}`)
  const {stdout, stderr} = await exec(cmd)
  console.log(stdout)
  console.log(stderr)
}

const createBranch = async version => {
  const cmd = `git checkout -b release/${version}`
  console.log(`creating release branch -> ${cmd}`)
  const {stdout, stderr} = await exec(cmd)
  console.log(stdout)
  console.log(stderr)
}

const cherryPick = async () => {
  const commits = await cli.prompt('Enter list of commits (separated by space)')
  if (!commits) {
    throw new Error('you must specify commits that need to be included in release')
  }
  const cmd = `git cherry-pick ${commits}`
  console.log(`cherry-picking specified commits -> ${cmd}`)
  const {stdout, stderr} = await exec(cmd)
  console.log(stdout)
  console.log(stderr)
}

const createTag = async version => {
  const cmd = `git tag v${version}`
  console.log(`creating release tag -> ${cmd}`)
  const {stdout, stderr} = await exec(cmd)
  console.log(stdout)
  console.log(stderr)
}

const pushBranch = async version => {
  const cmd = `git push --tags origin release/${version}`
  console.log(`pushing branch to remote -> ${cmd}`)
  const {stdout, stderr} = await exec(cmd)
  console.log(stdout)
  console.log(stderr)
}

class ReleaserCommand extends Command {
  async run() {
    const isRepository = fs.existsSync('.git')
    if (!isRepository) {
      this.log('you can use releaser only from room of git repository')
      return
    }
    const previous = await cli.prompt('Enter previous release version')
    if (!previous) {
      this.log('you must specify previous release version')
      return
    }
    const version = await cli.prompt('Enter release version')
    if (!version) {
      this.log('you must specify release version')
      return
    }
    checkoutPreviousReleaseBranch(previous)
      .then(_ => createBranch(version))
      .then(_ => cherryPick())
      .then(_ => changeVersionInPoms(previous, version))
      .then(_ => createReleaseCommit(version))
      .then(_ => createTag(version))
      .then(_ => pushBranch(version))
      .catch(error => {
        console.log(error.stderr)
        console.log('you must now continue manually...')
      })
  }
}

ReleaserCommand.description = `
Releaser can be used to perform all git-oriented work related to releasing software.
The following steps are performed in specified order:
1. Checkout on previous release branch
2. Create new release branch
3. Cherry-pick specified commits
4. Change version in Maven POMs
5. Create release commit
6. Create release tag
7. Push branch to remote
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
