const {Command, flags} = require('@oclif/command')
const {cli} = require('cli-ux')
const {exec} = require('child_process')
const replace = require('replace-in-file')

const checkoutPreviousReleaseBranch = async previous => {
  console.log(`Checkout on previous release branch: release/${previous}`)
  const {error} = await exec(`git checkout release/${previous}`)
  if (error) {
    throw new Error(`error: ${error.message}`)
  }
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
  console.log('Creating release commit (changed version in POMs)')
  const {error} = await exec(`git commit -m "Release ${version}"`)
  if (error) {
    throw new Error(`error: ${error.message}`)
  }
}

const createBranch = async version => {
  console.log(`Creating release branch: release/${version}`)
  const {error} = await exec(`git checkout -b release/${version}`)
  if (error) {
    throw new Error(`error: ${error.message}`)
  }
}

const cherryPick = async () => {
  const commits = await cli.prompt('Enter list of commits (separated by space)')
  if (!commits) {
    throw new Error('you must specify commits that need to be included in release')
  }
  console.log(`Cherry-picking specified commits: git cherry-pick ${commits}`)
  const {error} = await exec(`git cherry-pick ${commits}`)
  if (error) {
    throw new Error(`error: ${error.message}`)
  }
}

const createTag = async version => {
  console.log(`Creating release tag: v${version}`)
  const {error} = await exec(`git tag v${version}`)
  if (error) {
    throw new Error(`error: ${error.message}`)
  }
}

const pushBranch = async version => {
  const {error} = await exec(`git push origin release/${version}`)
  if (error) {
    throw new Error(`error: ${error.message}`)
  }
}

class ReleaserCommand extends Command {
  async run() {
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
      .catch(error => console.log(error))
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
