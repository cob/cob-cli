# cob-cli
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

For more information, please consult [this link](https://learning.cultofbits.com/docs/cob-platform/developers/interacting-with-a-cob-server/)


# Run Docker version:

Linux version:

```
docker run --rm -p 8040:8040 \ 
-v <PATH_TO_DIRECTORY_SSH_KEYS>:~/.ssh/ \ 
-v <PATH_TO_SERVER_WORKING_DIRs>:/work/ \ 
cultofbits/cob-cli
```
