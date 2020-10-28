# Changelog

All notable changes to this project will be documented in this file. See
[Conventional Commits](https://conventionalcommits.org) for commit guidelines.

 Type must be one of [build, chore, ci, docs, feat, fix, improvement, perf, refactor, revert, style, test].

# [1.0.0](https://github.com/cob/cob-cli/compare/v0.26.0...v1.0.0) (2020-10-28)


### Bug Fixes

* finish correcting dependencies ([cf41ba8](https://github.com/cob/cob-cli/commit/cf41ba81af9bc078a5106a81e9dd5ae9d7e0673c))


### BREAKING CHANGES

* from this point on there will be no validation of the
commit message. It's up to the dev make sure it uses the correct
semantic-versioning prefixes in the commit message

EACH EXISTING PROJECT SHOULD BE DELETED AND REDO THE COMMAND:
cob-cli init <server name>

# [0.26.0](https://github.com/cob/cob-cli/compare/v0.25.0...v0.26.0) (2020-10-28)


### Bug Fixes

* corrects package.json repository url ([f020a95](https://github.com/cob/cob-cli/commit/f020a95a10a499520fd94ad74780bed8922c835c))
* corrigir falha inicial de ficheiros inexistentes ([82a4a05](https://github.com/cob/cob-cli/commit/82a4a05f2e776e0e58aab7bd1667dd34930bb946))
* use git in url instead of https ([c0d28d2](https://github.com/cob/cob-cli/commit/c0d28d2e64bc1495e078af33c7a5987bb2b6e985))


### Chores

* update version ([75d4fd3](https://github.com/cob/cob-cli/commit/75d4fd38fd74c1bd7061fbed51f58816d925ee3c))


### Features

* remove git hook to validate commit message ([37b9c01](https://github.com/cob/cob-cli/commit/37b9c01f53a6eb4329c5bfe4ed61f38dd4bfb736))

# [0.25.0](https://github.com/cob/cob-cli/compare/v0.24.3...v0.25.0) (2020-10-22)


### Bug Fixes

* stop trying to copy non existing dirs ([b6c9f2d](https://github.com/cob/cob-cli/commit/b6c9f2de36515c6e978e4976f12b7b75c748d1cb))
* **deploy:** remove conf do commitlint não usada no commit-analyser ([a386f4f](https://github.com/cob/cob-cli/commit/a386f4f9c0e96b55ec15d97f045bca8041c36e23))
* **init:** corrige hook de pre-commit do git nos projectos ([53cd364](https://github.com/cob/cob-cli/commit/53cd3646b646424588af7a9feaa8e71e326ed5be))
* **test:** fix handling of multiple files in the same directory ([9d551f4](https://github.com/cob/cob-cli/commit/9d551f443fb7604d2e6161c9451a641ddfa6d814))


### Chores

* repõe indentação no init_newProject ([da0b91f](https://github.com/cob/cob-cli/commit/da0b91f903cc5d138593ec9dbb906288add5dfbe))
* repõe indentação no init_newProject II ([c2ba23d](https://github.com/cob/cob-cli/commit/c2ba23d58904e78675114bbd300fed3adb99b405))


### Code Refactoring

* debug flag for troubleshooting ([cd7219d](https://github.com/cob/cob-cli/commit/cd7219d13592f17d369922ad88ee57cc8e8ee20b))
* **test:** add troubleshooting log to enable when necessary ([c7c6940](https://github.com/cob/cob-cli/commit/c7c694046e56cd51f76d776cd59a5961b0d866e0))


### Features

* **init:** adiciona o .commitlintrc.js aos projectos ([da31da4](https://github.com/cob/cob-cli/commit/da31da47ebfcaef5f7822aed495bea30a02bdcd9))


### Miscellaneous

* Merge branch 'fix-commitlint' into master ([2020.10.22  d7d4306](https://github.com/cob/cob-cli/commit/d7d43061d31491a2106a0c333b37f8c141d88493))

## [0.22.2](https://github.com/cob/cob-cli/compare/v0.22.1...v0.22.2) (2020-09-27)


### Build System

* **deps:** bump websocket-extensions from 0.1.3 to 0.1.4 ([53b80d7](https://github.com/cob/cob-cli/commit/53b80d75a6e504dc6184f3abe6c53eef1332c3d5))


### Code Refactoring

* fixes npm audit ([0cb056f](https://github.com/cob/cob-cli/commit/0cb056fdc697d2b34df14874b9003aa04b01520e))


### Miscellaneous

* Merge pull request #1 from cob/dependabot/npm_and_yarn/websocket-extensions-0.1.4 ([2020.9.27  80f28bf](https://github.com/cob/cob-cli/commit/80f28bf736dbb95ab22afc5b31beb124135dfd68)), closes [#1](https://github.com/cob/cob-cli/issues/1)

## [0.22.1](https://github.com/cob/cob-cli/compare/v0.22.0...v0.22.1) (2020-09-27)


### Bug Fixes

* **test:** corrects copying/deleting test files ([41d937e](https://github.com/cob/cob-cli/commit/41d937ee09fe63da42dcd2936fc04349911c7b63))
* **test:** fixes error handling count ([c8c6f0d](https://github.com/cob/cob-cli/commit/c8c6f0d5d60298fadcdb10e3c15e19536247780a))
* **test:** fix handling of rsync failures when copying one by one files ([a42cc68](https://github.com/cob/cob-cli/commit/a42cc6869c9c19309971cfc803431a8aa473232a))
* fixes npm audit warnings ([35a4b29](https://github.com/cob/cob-cli/commit/35a4b29a9d6e9388aa070b7db28ad199fc91b260))
* fixes npm audit errors ([29ae4de](https://github.com/cob/cob-cli/commit/29ae4defa546a37b72ae7ee6b59192bb3b611a2a))
* **test:** fixes bug introduced on handling changes ([f374a19](https://github.com/cob/cob-cli/commit/f374a192353d035ff81b5f2dfd6514a47b8416e5))


### Code Refactoring

* identation ([c5ae0f0](https://github.com/cob/cob-cli/commit/c5ae0f0bbfaca11d7d819db1ac7cf6b958395f0c))
* improve RSYNC_RETRIES use ([174b5d9](https://github.com/cob/cob-cli/commit/174b5d92fbdd6c595105cc41e2b4e09ae402071c))


### Documentation

* npm fix version increase ([715925e](https://github.com/cob/cob-cli/commit/715925e5dffcd5e5bc0d464f4a7f4c4abf948a32))


### Miscellaneous

* update versions ([2020.9.27  fd38da0](https://github.com/cob/cob-cli/commit/fd38da086dea7811659dd6016eb7120cfc268a8a))

# [0.24.0](https://github.com/cob/cob-cli/compare/v0.21.1...v0.22.0) (2020-09-27)


### Bug Fixes

* solves problems with rsync ([ef0241f](https://github.com/cob/cob-cli/commit/ef0241fd1f70fc175ba56d6fb4511af6267c4725))
* **test:** also warn of restart needed in importer files ([acc2436](https://github.com/cob/cob-cli/commit/acc2436168775525caf6ef9f40f9a2cb9e14817d))
* **test:** correct error message not shown ([71036d0](https://github.com/cob/cob-cli/commit/71036d095026988fa1b2cdc2fa822936ad73d97d))
* **test:** correctly restore files and state in case failures ([33575f7](https://github.com/cob/cob-cli/commit/33575f7cd1da7b69b329f5f696d83a0d67ba47c7))
* **test:** corrects destination dir for 'others' products ([ffd8f25](https://github.com/cob/cob-cli/commit/ffd8f252b13f9eaccf8138f25d8e2da6420f7fbb))
* **test:** corrects removing files from server test inventory ([ad62911](https://github.com/cob/cob-cli/commit/ad62911a475af9000431f0d433e690064e5a4bbb))
* **test:** corrige problema com lista de ficheiros em teste no servidor ([ea9b290](https://github.com/cob/cob-cli/commit/ea9b290c9bfb91fa785409e7e6ee8989235939ce))
* **test:** corrige problema com lista de ficheiros em teste no servidor ([eb93d12](https://github.com/cob/cob-cli/commit/eb93d1274c0b2e4200dafae6c8f01c9b1144acb2))
* **test:** only add files not already registered ([8ed2656](https://github.com/cob/cob-cli/commit/8ed26568238c72550e90402d586e835257e7c2d1))
* **test:** recover git state in case of failure of test ([67594da](https://github.com/cob/cob-cli/commit/67594da95d4b3081bcb6c7e28ee4d37b59420382))
* prevent rsync error in slower connections ([c766469](https://github.com/cob/cob-cli/commit/c76646938d5e7ec132cc2d49d7994dc2b3d88916))


### Features

* **test:** add --verbose option to test command ([fff8ba5](https://github.com/cob/cob-cli/commit/fff8ba52977d2a677fdd669589b8d9a79502ef96))


### Miscellaneous

* Merge branch 'update-npm-&-ssh-options' ([2020.9.27  6ff6bf6](https://github.com/cob/cob-cli/commit/6ff6bf6bb445c8e7163635b4b9fdc2d47c018ad3))
* Merge branch 'master' of https://github.com/cob/cob-cli ([2020.9.23  91f01c6](https://github.com/cob/cob-cli/commit/91f01c6278d18fbe1a19312d8038cd33e1cf3fd7))
* Merge branch 'master' of https://github.com/cob/cob-cli ([2020.9.17  acd00a3](https://github.com/cob/cob-cli/commit/acd00a371e1dd9b76861da63bca8ae75ac3c37df))
* running trual ([2020.9.17  261b385](https://github.com/cob/cob-cli/commit/261b3858f8c0c1e606fe4d7deedc2d8de1879e78))

## [0.21.1](https://github.com/cob/cob-cli/compare/v0.21.0...v0.21.1) (2020-09-15)


### Bug Fixes

* **test:** stop stashing ignored files ([c196bcf](https://github.com/cob/cob-cli/commit/c196bcfc697be567768d14fb2a74d570e5201a1d))


### Miscellaneous

* 0.21.0 ([2020.8.21  d4b65b0](https://github.com/cob/cob-cli/commit/d4b65b05abdf68c336e04fb50cb48c4f717370c3))

# [0.21.0](https://github.com/cob/cob-cli/compare/v0.20.0...v0.21.0) (2020-08-21)


### Bug Fixes

* add support for built files ([ad1daac](https://github.com/cob/cob-cli/commit/ad1daac4d2775fd91a39428f2e72b7d063a69803))


### Chores

* git ignore enviroment files ([890335e](https://github.com/cob/cob-cli/commit/890335e7840c8b22046cb9178f40309a8ee4d9c6))


### Features

* **test:** add --localOnly option ([91ba2e4](https://github.com/cob/cob-cli/commit/91ba2e4bfbaf36e41e6890bcfc8f8d98768b643a))

# [0.17.0](https://github.com/cob/cob-cli/compare/v0.16.0...v0.17.0) (2020-07-23)


### Bug Fixes

* add revert of 'git checkout latestbranch' in case of error ([3953e9a](https://github.com/cob/cob-cli/commit/3953e9a88bb21101f265bcfe8ebd59e422b5cea3))
* add specific load of slow scripts ([f08da39](https://github.com/cob/cob-cli/commit/f08da3922699ad5a6d87867473c993635b92d95e))
* create directories, if non existing ([43d6094](https://github.com/cob/cob-cli/commit/43d6094912b8c16b1d446bb32a64ebac63cd0e8b))
* formatRsyncOutput only parses relevant lines ([637c6a0](https://github.com/cob/cob-cli/commit/637c6a0c85c30b6a0a11a740486f23673ff912e1))
* not redine cob.custom if already exists ([90c6956](https://github.com/cob/cob-cli/commit/90c6956352e0fd4412b03c8e1b2de330cfbdb3ed))
* problemas com dirs sem acesso ou inexistentes ([2bb1a04](https://github.com/cob/cob-cli/commit/2bb1a0479de6d41f491ab37efd303647f64090f3))
* **test:** exclude customUI from initial copy to server ([24fcfff](https://github.com/cob/cob-cli/commit/24fcfffd6319161807dccb69d3a466ccccd63ea7))


### Code Refactoring

* change names & extract function ([c60bd53](https://github.com/cob/cob-cli/commit/c60bd538371f67c900ec75b6b1bdf5f83b9e38ba))
* remove checkNoTestRunningLocally  unnecessary argument ([42b4dd4](https://github.com/cob/cob-cli/commit/42b4dd4d03913f1f8281bdcfb67bc355d2dd38d2))
* removed unnecessary function argument ([8de44b6](https://github.com/cob/cob-cli/commit/8de44b6b2deb65e23c82cf193879058a95f7c9bc))


### Documentation

* correct typos ([dd3cfed](https://github.com/cob/cob-cli/commit/dd3cfed9e5f0189557c8e7993cb1be0ab9acf6ce))
* describe tests to perform ([1337a4c](https://github.com/cob/cob-cli/commit/1337a4c54bac2c7f2e7614afdd59ed643f88740d))
* describe teststo perform ([f4acd78](https://github.com/cob/cob-cli/commit/f4acd7814a3913f6f336cc62b2ee570706576a1c))


### Features

* **deploy:** add verbose option for troubleshoot ([910a2a5](https://github.com/cob/cob-cli/commit/910a2a52920e4ac07a516240c0b22870d678c969))
* add 'cob-cli reset' command ([9965956](https://github.com/cob/cob-cli/commit/9965956649d3e4c0f842cec07e16dae84cb5c3fc))
* add validate of conditions to updateFromServer ([812e1e7](https://github.com/cob/cob-cli/commit/812e1e7ccb54cfa35f944cfac33f56b971f0e3f0))


### Miscellaneous

* Merge branch 'master' of https://github.com/cob/cob-cli ([2020.7.07  e6c07e4](https://github.com/cob/cob-cli/commit/e6c07e49420f7a8cc04ab6fd155b73b269ca8957))
* Merge branch 'master' of github.com:cob/cob-cli ([2020.6.12  5abb687](https://github.com/cob/cob-cli/commit/5abb6878b44f9e1b9ea5bd15cc0d573120ad6f70))
* Merge branch 'master' of github.com:cob/cob-cli ([2020.6.02  c2b52cb](https://github.com/cob/cob-cli/commit/c2b52cb4783b56bc67ff612ada8cfa0caff2e8c6))
* Delete CHANGELOG.md ([2020.6.01  899cf97](https://github.com/cob/cob-cli/commit/899cf97dd0e4f9ca19307886a22478f8addaa16e))

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
