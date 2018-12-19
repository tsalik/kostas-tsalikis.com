---
title: "Git tip: Add a .gitattributes file to deal with line endings"
date: 2018-12-21T15:27:16+02:00
tags: [git]
description: Avoid the headache of dealing with line endings by adding rules for specific files for your entire git repository 
---
Lately, I needed to install Docker in order to setup a server locally on my machine for testing purposes. Despite all my efforts of setting up the server, I failed over and over again and of course I immediately blamed myself. As I am quite a forgetful person, I thought that most probably I forgot to do something from the instructions. After quite a number of tries I noticed that during the installation process some scripts would complain and display an error that `\r\n` is not recognized as a command. This seemed too suspicious so eventually I decided to investigate further. The machine that I was working was Windows while the Docker image was a Linux distribution so I thought that maybe after all it was a line endings problem. I manually changed the script that was `CRLF` to `LF` and behold - the installation stopped complaining about line endings. But alas, it started complaining for another script! So, what should I do in this case? Is it viable to just change the line endings for all the files in my machine manually? And would that solve the problem for the rest of team?

# Enter .gitattributes

After consulting with a colleague, he suggested that I take a look at `.gitattributes`. But what the hell is a `.gitattributes` file? Let's tackle the root of the problem. Since I never changed the default configuration of git, it would try to automatically convert any files to `CRLF` line ending. So I ended up having scripts that ran on the Docker Linux image with Windows' line ending(meaning that at the end of every line the `\r\n` special characters are appended), and since the line endings on Linux are `LF`(appending only `\n` at the end of every line) the scripts would fail. This meant that these specific files needed to have `LF` line ending no matter what operating system the git repository was checked out, as it would eventually be executed on the Docker Linux image.

Specifying a `.gitattributes` file imposes explicit settings for a specific set of files per repository, overriding the local settings of the environment in which a repository is cloned. This means that if you need some files to have a specific line ending regardless of the operating system in which they are checked out, then you need to specify their line ending in `.gitattributes`. In our case, we would like some shell scripts and configuration files to always have `LF` line ending, as they will eventually be executed on the Docker Linux image. What's more, we would like some .bat files to have `CRLF` line ending since they will always be executed in Windows environment and some files like images to be treated like binary so as to prevent git from performing any line endings conversion and computing a diff. A sample `.gitattributes` would be something like this:

```bash
# Auto detect text files and perform LF normalization
* text=auto

# These files should have specific line endings
*.sh	text eol=lf
*.bat	text eol=crlf

# These files are binary and should be left untouched
# (binary is a macro for -text -diff)
*.jpeg	binary	
```

# Refreshing the repository after committing .gitattributes

Just committing a `.gitattributes` file is not enough for the changes on the line endings of the files to take place. It's essential to refresh the files in the repository in order for git to apply the correct line endings. Let's say that we have a repository which contains two files that just echo a message, one `echoes.bat` and one `echoes.sh`. If we happen to develop on a Windows machine both files will have `CRLF` ending and if we develop on Linux or mac they will have `LF` when they will be committed. Then we add a `.gitattributes` file like the one above. Unfortunately, the files would continue to have the original line ending that they had when they were committed. The fastest way to refresh them would be to delete and reset them. That can happen with the commands below.

```bash
rm -rf *
git reset --hard
``` 

Another way to do this without losing files that are not tracked in git is inspired from [stackoverflow](https://stackoverflow.com/questions/17223527/how-do-i-force-git-to-checkout-the-master-branch-and-remove-carriage-returns-aft/17223639r).

```bash
git ls-files -z | xargs -0 rm
git reset --hard
```
The first command will delete all the files that are tracked in git and then will reset them. Now all the files are updated and we can continue development without any pesky line endings errors.
