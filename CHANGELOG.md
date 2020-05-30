# Changelog

All notable changes to this project will be documented in this file. See
[Conventional Commits](https://conventionalcommits.org) for commit guidelines.

 Type must be one of [build, chore, ci, docs, feat, fix, improvement, perf, refactor, revert, style, test].

# [0.16.0](https://github.com/cob/cob-cli/compare/v0.14.0...v0.15.0) (2020-05-30)


### Features

* add syncronization of changes done while testing ([f49bc88](https://github.com/cob/cob-cli/commit/f49bc887ed092579a7ef9c73c3db388377d9acc1))
* add aditional validation to deploy - no test running ([053c8e6](https://github.com/cob/cob-cli/commit/053c8e65539653db203b86d4c0a1ad98afde2a21))
* add resync option to deploy ([1c9b9b0](https://github.com/cob/cob-cli/commit/1c9b9b06850a645d8f6efa099669ef32707f4c5d))
* add support for /opt/others ([fbc9060](https://github.com/cob/cob-cli/commit/fbc9060a63016c070930bf2b54a49956706cb0e1))
* add support for nginx configurations ([9c2882a](https://github.com/cob/cob-cli/commit/9c2882a7f9d9f45a09fdb0ed3d827a39f77d2efd))
* add undo capabilities to server changed files in begging of test ([6f7e9ee](https://github.com/cob/cob-cli/commit/6f7e9eee7a56043237010b575e9722868dd444b1))
* add user info to the running test file ([26f8a39](https://github.com/cob/cob-cli/commit/26f8a39c3c310c6e792eab1ed667d2976cdf8e54))
* assert no aditional 'cob-cli test' running on the same project ([da207a1](https://github.com/cob/cob-cli/commit/da207a1eba4438b756f117cb1e255b80ed498553))


### Bug Fixes

* correct the skipping of `git stash pop` ([2d55538](https://github.com/cob/cob-cli/commit/2d555388ae504ae3fb93e9fc86620bf17c517add))
* prevent sync of test file flag ([bec734c](https://github.com/cob/cob-cli/commit/bec734c2fef29b71797c0a6112d0be212ba6c99f))
* support empty directories on server ([0639994](https://github.com/cob/cob-cli/commit/06399947a341c76ddbfb5bae98cbbe1196d64992))


## [0.14.0 ](https://github.com/cob/cob-cli/compare/v0.13.1...v0.13.2) (2020-05-23)

### Feature

* **deploy:** correct error throw and fix waitForAnswer ([87caac6](https://github.com/cob/cob-cli/commit/87caac6b52f5e1a04fc685d287f879dab050de29))
* **test:** support for default browser ([4043882](https://github.com/cob/cob-cli/commit/404388210ff8fe3129a1b14027cf223956845e86))
* **test:** watch for file changes other then `customUI` ([9f4ac28](https://github.com/cob/cob-cli/commit/9f4ac28bf1e947949ee40779d3ab91cefb3708c7))

### Bug Fixes

* **test:** correct the webpack.conf file location ([a10cde4](https://github.com/cob/cob-cli/commit/a10cde4468cfa9a0f2d120ffc189587ca8c02b33))


## [0.13.1](https://github.com/cob/cob-cli/compare/v0.13.0...v0.13.1) (2020-05-21)


### Code Refactoring

* major reorganization of files ([b5a28a7](https://github.com/cob/cob-cli/commit/b5a28a753676f68d71052f3254465cdc0f8969ab))


### Documentation

* changelog cleaning ([598a562](https://github.com/cob/cob-cli/commit/598a5629c563c079146bd596725f91ce937200a9))
* README cleanup ([7f5e14b](https://github.com/cob/cob-cli/commit/7f5e14b1f848425af53d31d042a6ad6836a2e0ce))

# [0.13.0](https://github.com/cob/cob-cli/compare/v0.12.0...v0.13.0) (2020-05-20)



### Features

* **deploy**: show diff and confirm deploy ([7e2d61b](https://github.com/cob/cob-cli/commit/7e2d61b1789f52cf2e8a5d9cd04fe995f5cbb323))

### Bug Fixes

* **init --legacy**: corrects when to add time to the commit message ([47d2bec](https://github.com/cob/cob-cli/commit/47d2becc61de9549dd05daee79fe4318ca649bf0))



# [0.12.0](https://github.com/cob/cob-cli/compare/v0.11.0...v0.12.0) (2020-05-20)


### Features

* **init --legacy**: remove all pre-existing git tags ([3411716](https://github.com/cob/cob-cli/commit/3411716c03670327331af370a5410538fc9ae631))
* **deploy**: validate conventional commits msg ([7f88100](https://github.com/cob/cob-cli/commit/7f88100f70429af045d65e371d81d23932deae23))
* **deploy**: add semanti-release automation ([99a468b](https://github.com/cob/cob-cli/commit/99a468b10b54e8a0601ef8dec40d74518c115eeb))

### Documentation

* add info regarding semantic-release references ([ff78feb](https://github.com/cob/cob-cli/commit/ff78febbda4a3195a12a925f1c5f635d7dba88e0))
