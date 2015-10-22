---
layout: post
title: "My GIT configuration on Windows"
description: ""
category:
tags: [environment, git]
permalink: my-git-configuration-on-windows
---
### This is just how I like to setup GIT for my development machines.
I prefer git-bash.  There's nothing like the raw power of a shell, right?

First, here's my `.bash_profile`.  Throw a file named `.bash_profile` into the root of your git-bash (aka `cd ~`) that looks like this:

{% highlight sh %}
[[ -s ~/.bashrc ]] && source ~/.bashrc

export CLICOLOR=1
export LSCOLORS=GxFxCxDxBxegedabagaced

alias ls='ls -GFh'
alias ll='ls -l'
alias cls='clear'

find_git_dirty() {
  local status=$(git status --porcelain 2> /dev/null)
  if [[ "$status" != "" ]]; then
    git_dirty='*'
  else
    git_dirty=''
  fi
}

find_git_branch() {
  # Based on: http://stackoverflow.com/a/13003854/170413
  local branch
  if branch=$(git rev-parse --abbrev-ref HEAD 2> /dev/null); then
    if [[ "$branch" == "HEAD" ]]; then
      branch='detached*'
    fi
    git_branch="($branch)"
  else
    git_branch=""
  fi
}

PROMPT_COMMAND="find_git_branch; find_git_dirty; $PROMPT_COMMAND"

function prompt {
  local BLACK="\[\033[0;30m\]"
  local BLACKBOLD="\[\033[1;30m\]"
  local RED="\[\033[0;31m\]"
  local REDBOLD="\[\033[1;31m\]"
  local GREEN="\[\033[0;32m\]"
  local GREENBOLD="\[\033[1;32m\]"
  local YELLOW="\[\033[0;33m\]"
  local YELLOWBOLD="\[\033[1;33m\]"
  local BLUE="\[\033[0;34m\]"
  local BLUEBOLD="\[\033[1;34m\]"
  local PURPLE="\[\033[0;35m\]"
  local PURPLEBOLD="\[\033[1;35m\]"
  local CYAN="\[\033[0;36m\]"
  local CYANBOLD="\[\033[1;36m\]"
  local WHITE="\[\033[0;37m\]"
  local WHITEBOLD="\[\033[1;37m\]"
  local RESETCOLOR="\[\e[00m\]"
  export PS1="$REDBOLD\u$WHITEBOLD@$CYAN\w$RESETCOLOR$GREEN \$git_branch$RESETCOLOR$REDBOLD\$git_dirty\n$RESETCOLOR > "
}

prompt

export PATH
{% endhighlight %}

Then run `source ~/.bash_profile` to reload bash.

That should get you a prettier bash prompt.  Bonus points: you can use this same profile on your mac (or linuxbox) if you have one.

Next, let's set up an editor.  I don't particularly care for VIM because I don't use it enough to memorize the commands, and emacs is even worse.  In this case, I'm going to set up Notepad++ and alias it to `npp` in my shell, but you could do something similar for another editor like Atom.

Go ahead and install and setup Notepad++ the way you like (I personally like the blackboard color scheme with the Hack font).  After that, navigate to your installation folder and add a file called `npp` (with no extension):

{% highlight sh %}
#!/bin/sh
"c:/Program Files (x86)/Notepad++/notepad++.exe" -multiInst -notabbar -nosession -noPlugin "$*"
{% endhighlight %}

And add `C:\Program Files (x86)\Notepad++` to your PATH.

Now you should be able to open up git-bash and type `npp` to open notepad++.  If you wanted to create a new file in your root called `foo.txt`, you could do...

{% highlight sh %}
cd ~
npp foo.txt
{% endhighlight %}

Ain't that nice?

Now, let's get to the global git config.  Go ahead and navigate to your root and start a new git config (or edit the existing one):

{% highlight sh %}
cd ~
npp .gitconfig
{% endhighlight %}

Add this to the file (change your name, of course):

{% highlight kconfig %}
[user]
	name = Dylan McCurry
	email = email@company.com
[core]
	autocrlf = true
	excludesfile = C:\\path\\to\\gitignore_global.txt
	editor = npp
[help]
	autocorrect = 1
[alias]
	lga = log -- graph --oneline --all --decorate
	conflict = diff --name-only --diff-filter=U
	conflicts = diff --name-only --diff-filter=U
	con = diff --name-only --diff-filter=U
{% endhighlight %}

Hope this helps!
