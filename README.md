# COB-CLI: customizing CoB servers
__cob-cli__ is a command line utility to help Cult of Bits partners develop with higher speed and reusing common code and best practices.

## Installing cob-cli
`npm i -g cob-cli`

## Available commands

There are 4 main commands. The first, `init`, is to be run once in the beginning of customization of each server. The three other should be used sequentially serveral times during development (1.`customize`, 2.`test`, 3.`deploy`).

 * `cob-cli init <servername> [-l,--legacy <folder>] [-a,--repoaccount <git acount url>]`
 * `cob-cli customize`
 * `cob-cli test [-d --dashboard <name>, --localOnly, --servername <servername>]`
 * `cob-cli deploy [-f,--force, --servername <servername>]`

An aditional command is available to get the repo updated with files from server, which shouldn't be necessary unless changes are made directly to the server and outside of the cob-cli process. 
 * `cob-cli updateFromServer [--servername <servername>]`

 Finally you can always get this help with:
 * `cob-cli help [command]`

 Where aplicable the `--servername <servername>` option will alow you to run the command agains a diferent server then the standard production one.

---

### cob-cli init \<servername> [-l,--legacy <folder>] [-a,--repoaccount \<git acount url>]

This command has two diferent behaviors, depending on the circumstances:
 1. If already exists a repo in `https:/gitlab/cob/` (or the specified --repoaccount) for this server just do a `git clone` of that repo.
 2. Otherwise, creates all the infrastucture to suport the server customization. In this last option, if the `--legacy` is used, in addition to creating the infrastructure it will try to rebuild the server customization history, existing on the legacy repo (old ClientConfs).

 By default a new repo will be created in the cob gitlab account, [https://gitlab.com/cob](https://gitlab.com/cob). 
 The `--repoaccount` option allows the use of a different account.

 In adition to setting up the local repository `cob-cli init` also creates the `.git/hooks/commit-msg` file. This will make set mandatory the use of [conventionalcommits](www.conventionalcommits.org) for the commit messages to the project.

---

### cob-cli customize

This is an interactive command. It allows you to browse the diferent customizations possible and select one. Depending on the choice mode additional details might be requested, and so on. Some examples of customizations:

 * General 
 * Totals dashboard
 * Kibana dashboard
 * Calculations
 * Customize the color of a `state` field on search result lists
 * ...

It also helps you manage the correct git workflow and provide help links to relevante trainning of each customization.

---

### cob-cli test [--dashboard <name>, --localOnly, --servername <servername>]
After running the `test` command you'll enter a livereload state were you can instantly see the effect of the changes being made. To stop this state just press any key.

Many of the changes are serverd locally from the development machine and are not propagated to the production server. These are all files that reside inside the diferent `customUI` folders. 

All other files imply a copy to the server. Each of the files copied to the server has a backup of any pre-existing one. Once the `test` command ends all copied files are removed and any existing backups are restored.

While in testing you can press `o` or `O` to open your default browser with the url for the local tests. You can also use `enter` to space your logs, if you want.

If you specify a `-d <name>` the corresponding dashboard will be served from source (instead of built files) and will also provide livereload.

Aditionally you can specify `--localOnly` if you just want to test frontend configurations without changing other files on server during testing.

---

### cob-cli deploy [-f,--force, --servername <servername>]
This last command alows you to deploy your finished developmentto the server, garanting that there are no conflicts with changes made by other.
In adition it promotes the management of adequate and updated documentation.

The --force option allows to bypass the conflict test and deploy the local configuration independently of the existing conditions. It should be used with extreme caution and only to resolve problems not possible to resolve in other ways.

Note: This command might not be available to the whole development team and hence some member might just pre-deploy to git hub and it's up to priveledge member of the this to finalize the deploy process after, typically after review.

---