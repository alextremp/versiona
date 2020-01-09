<img alt="versiona logo" src="https://repository-images.githubusercontent.com/230541628/a2f2d400-2d09-11ea-8df8-ed5368f5df5c" width="300">

[![NPM Module](https://img.shields.io/npm/v/versiona.svg)](https://www.npmjs.com/package/versiona)
[![Build Status](https://travis-ci.org/alextremp/versiona.svg?branch=master)](https://travis-ci.org/alextremp/versiona)
[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/alextremp/versiona.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/alextremp/versiona/context:javascript)
[![Maintainability](https://api.codeclimate.com/v1/badges/c2ea0ca1472cb7af910f/maintainability)](https://codeclimate.com/github/alextremp/versiona/maintainability)

# versiona 
**Versiona** is an utility for Github NPM projects using Travis CI to automatize:
* Publish a NPM package when a Github tag is created with the vX.Y.Z semver format.
* Update and commit the new package.json version.

For example, with **versiona** activated in your project:

1. When creating new Release Tag in Github, p.ex. **v1.0.2** release:

<img width="512" alt="creating a new release tag" src="https://user-images.githubusercontent.com/20399660/71648589-a46ecd00-2d06-11ea-9ad9-2bd83f6bed4e.png">

2. **versiona** will publish the v1.0.2 release to NPM:

<img width="512" alt="creating a new release tag" src="https://user-images.githubusercontent.com/20399660/71648966-09c4bd00-2d0b-11ea-8705-05c434bb41a9.png">

3. And also, **versiona** will commit the updated package.json back to Github:

<img width="512" alt="creating a new release tag" src="https://user-images.githubusercontent.com/20399660/71648602-d2541180-2d06-11ea-92c8-b011d6b4b9d9.png">


Releasing to NPM this way, your collaborators will be aimed to:
* Control via Github Releases when a new version should be publicly available.
* Know which Release Tag corresponds to each available version of the package in NPM.
* Add documentation to the Github Releases.
* Not publishing from localhost! ;)

## Requirements

**versiona** can be launched from any command line environment, but will require to have these environment variables available:
* **NPM_TOKEN**
  * Will be used to publish the package to NPM.
  * Check [Creating and Viewing Auth Tokens in NPM](https://docs.npmjs.com/creating-and-viewing-authentication-tokens).
  * **Read and Publish** permission is required to publish packages.
* **GH_TOKEN**
  * Will be used to commit a new package.json version to Github.
  * Check [Creating a Personal Access Token in Github](https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line)
  
When used in Travis CI, just add these tokens in the Settings of your repo **with the secured option to avoid showing the tokens content in the Travis logs** 

## Usage


Install **versiona**:

```
npm i versiona --save-dev
``` 

Create a **versiona.js** script into your project's root (can be ignored in .npmignore):

```
const versiona = require('versiona')

versiona({
  repoOrg: 'your_repo_org_or_username',
  repoName: 'your_repo_name'
})
```

> the _versiona_ function will stop the process with a code != 0 if something goes wrong. Otherwise, it will return:
> - true if the publish and commit are done
> - false if it has not run (p.ex. when the release tag is not matching the semver format)

**versiona accepted parameters**:
* repoOrg: Your username or organization
* repoName: The repository name
* host: The Github's host (for enterprise usage, if not, it defaults to 'github.com')
* publish: string. Alternative publish command before committing (defaults to 'npm publish'). Use it only if no NPM publication has to be done, or there are manual steps to do. Set to _false_ to deactivate publication.
* test: boolean. _true_ means that it's only to test the configuration, so no package will be published, and no commit will be done to github. (it defaults to _false_).

**Example** simple usage from [a project using versiona](https://github.com/alextremp/brusc):
```
const versiona = require('versiona')
versiona({
  repoOrg: 'alextremp',
  repoName: 'brusc'
})
```

**Example** usage as an intermediate step from [a project using versiona](https://github.com/alextremp/brusc):
```
const versiona = require('versiona')
const shell = require('shelljs')

versiona({
  repoOrg: 'someorg',
  repoName: 'somerepo',
  publish: 'npm run s3deploy'
})
```


**Add a new script task into your package.json**:

```
"scripts": {
  "versiona": "node versiona.js"
}
```

**Call the versiona task from Travis** editing your .travis.yml:

* In this travis sample:
```
dist: trusty
language: node_js
node_js:
  - "8"
cache:
  directories:
    - node_modules
before_install:
  - npm config set //registry.npmjs.org/:_authToken=$NPM_TOKEN
script:
  - npm run check && TRAVIS_TAG=$TRAVIS_TAG GH_TOKEN=$GH_TOKEN npm run versiona
```

In this sample:
```
before_install:
  - npm config set //registry.npmjs.org/:_authToken=$NPM_TOKEN
```
  * The **NPM_TOKEN** will be required in order to enable the NPM publish command.
  
```
npm run check
```
  * This is a project task that run the **lint** and **test** tasks to validate the build.
  
```
TRAVIS_TAG=$TRAVIS_TAG GH_TOKEN=$GH_TOKEN npm run versiona
```
  * This runs **versiona**
  * **TRAVIS_TAG** is required, **versiona** will check if the TRAVIS_TAG is set and matches the _^v[0-9]+\.[0-9]+\.[0-9]+(-beta\.[0-9]+)?$_ regexp (**semver format**, p.ex.: _v2.3.1_ or _v3.0.0-beta.1_)
  * If that's not the case, it will exit doing nothing
  * If the **semver format** is matched, it will validate the **GH_TOKEN** to be set (as it will be required to commit back to Github in next steps):
    * **For vX.Y.Z format releases**:
      * It will update the package.json to X.Y.Z version and publish the package.
      * It will commit to Github in **master** branch the updated package.json using a Travis User with the GH_TOKEN.
    * **For vX.Y.Z-beta.A format releases**:
      * It will update the package.json to X.Y.Z-beta.A version and publish the package **as a beta version**.
      * It will commit to Github in **develop/vX** branch the updated package.json using a Travis User with the GH_TOKEN.
 
 This library only uses the tokens, does not store / send / ... them to anywhere
  
 
## Troubleshooting

### Failed publishing from a tag

* Ensure that with vX.Y.Z release, the package.json didn't have the X.Y.Z version already (so it won't commit a new version, and so, it won't publish)
* Ensure that the X.Y.Z version does not already exist in NPM 
* In case of creating a tag by mistake:

>Revert a tag locally
>```
>git tag -d vX.Y.Z 
>```
>
>Revert a tag in Github
>```
>git push --delete origin vX.Y.Z
>```

## Maintainers

This library uses itself to publish to NPM, so:

This project uses Travis CI for
* PR validation
* Merge to master validation
* NPM publications on Release tag creation

To create a new Release, take in mind:
* The Release Tag must be named *vX.Y.Z* where X.Y.Z are the _semver_ numbers that will correspond to the published package's version.
* Travis CI will launch [versiona](https://www.npmjs.com/package/versiona) which will:
  * Update the package.json to the X.Y.Z version set in the Release Tag
  * Publish the NPM package with the X.Y.Z version

