---
title: "Switching Hugo Versions"
date: 2025-04-05T14:37:40+03:00
description: "Using Hugo Version Manager to install multiple Hugo versions on a single workstation"
tags: ["Hugo"]
draft: true
---

{{< figure src="https://images.unsplash.com/photo-1737737351943-82e01f866e53?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"  title="" >}}

*Photo by [Maik Winnecke](https://unsplash.com/@maik_wi?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash) on [Unsplash](https://unsplash.com/photos/a-laptop-computer-sitting-on-top-of-a-wooden-desk-JQyMJFh59xY?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash>)*


 #### TL;DR

 1. You can't manage different Hugo versions through `brew`.
 2. Reverting to older versions through `brew` is difficult.
 3. You can run different Hugo versions in a few ways. Pick what's best for your case.
 4. Hugo Version Manager offers an easy way of switching between different Hugo versions. 


For quite some time I wanted to build for myself a knowledge base. Most of the times I take manual notes (yes, on an actual physical notepad). It's too difficult though to store and query them when you need a refresher. I also take notes in Notion, but I would like to be able to browse my knowledge base offline. Finally, I decided to build my unified knowledge base as a static site with Hugo. 

As soon as I started building my new Hugo site, I realized that most themes of my liking needed a newer Hugo version. I was skeptical of bumping to the latest version, as I hadn't updated my personal blog in ages. Updating Hugo could mean that I wouldn't be able to publish a new post. 

Nevertheless, I tried to update to the latest Hugo, and to no one's surprise building my blog failed. 

## Reverting to an Older Hugo Version

I originally had installed Hugo through `brew`. I learned the hard way that `brew` only supports the latest Hugo version and not older ones. There was a quick and hacky workaround to downgrade to an older version(thanks to [the Hugo community](https://discourse.gohugo.io/t/switching-hugo-versions/38251/2) ❤️ ).

The steps were:
1. Find the `brew` bottle of the specific Hugo version you want to downgrade to in the [HomeBrew repo](https://github.com/Homebrew/homebrew-core).
2. Download the formula file locally(let's say as `hugo.rb`).
3. Install it by running `brew install hugo.rb`.
4. Verify you installed the appropriate version by running `hugo version`.

## But I Need to Work with Different Hugo Versions

I still needed to work with more than one Hugo version at the same time. here are several ways of doing so, but my personal choice was Hugo Version Manager(a.k.a. `hvm`).

### 1. Installing Hugo via NPM

One way to install Hugo is via NPM with [`hugo-installer`](https://github.com/dominique-mueller/hugo-installer) [^1] . Installing NPM on my local workstation when I do not use `NodeJS` in my daily life was too much for my needs. An extra drawback are that you [cannot use the `hugo` commands](https://www.brycewray.com/posts/2023/02/hugo-via-npm/#any-sour-points).

### 2. Installing via the asdf Version Manager

[`asdf`](https://asdf-vm.com/) is a version manager which supports Hugo among other tools [^2]. Even though this had some potential, I opted in using `hvm` for the reasons stated on [the related section](#6-installing-via-hugo-version-manager).

### 3. Installing via Docker

Another way that you can manage different Hugo versions is using Docker [^3]. Again I felt that this was overkill.

### 4. Building from the Source

I feel this is to much work if the only thing that you need on your day to day is to manage your site. [^4]

### 5. Create a custom tap with the specific Hugo versions of your choice

You can maintain your own Homebrew tap to install any Hugo versions you need. This is a good alternative when you don't want to install a third-party package manager. [^5]

### 6. Installing via Hugo Version Manager

This was the option that I opted in. `hvm` has the following benefits that are perfect for me:
1. Enables to install and work with a different  Hugo versions.
2. Falls back to existing Hugo installations whenever you need to.

You can  install it with `go` and is maintained by one of Hugo's maintainers([Joe Mooring](https://github.com/jmooring)). It suited my needs like a glove. [^6] 

#### Managing Hugo with Hugo Version Manager

First of all, make sure that you have installed the Go programming language. Then proceed following the official instructions:

```bash
$ go install github.com/jmooring/hvm@latest
````

The previous command installs `hvm` on Go's path, under the `bin` directory. To double check that run the following:

```bash
$ ls "$(echo $(go env GOPATH)/bin)"
hvm         # <--- This should be the result for a successful hvm installation

```

Make sure to add the `hvm` installation directory on the `PATH` variable.

`hvm` allows for an easy way to override existing installation:

```bash
$ hvm gen alias zsh # <----- change zsh with the shell you are using
## Output 
# Hugo Version Manager: override path to the hugo executable.
hugo() {
  hvm_show_status=true
  if hugo_bin=$(hvm status --printExecPathCached); then
    if [ "${hvm_show_status}" = "true" ]; then
      >&2 printf "Hugo version management is enabled in this directory.\\n"
      >&2 printf "Run 'hvm status' for details, or 'hvm disable' to disable.\\n\\n"
    fi
  else
    if hugo_bin=$(hvm status --printExecPath); then
      if ! hvm use --useVersionInDotFile; then
        return 1
      fi
    else
      if ! hugo_bin=$(whence -p hugo); then
        >&2 printf "Command not found.\\n"
        return 1
      fi
    fi
  fi
  "${hugo_bin}" "$@"
}
## End of Outpout

```

Copy and paste the output from above on the `.zshrc` file(or the appropriate configuration file of the shell of your choice).

Double check that there are no Hugo installations managed by `hvm`.
```bash
$ hvm status
Version management is disabled in the current directory.
The cache is empty.
```
Then, navigate to the site that you need to install the new Hugo version:
```bash
$ hvm use

  1) v0.145.0              2) v0.144.2              3) v0.144.1            
  4) v0.144.0              5) v0.143.1              6) v0.143.0            
  7) v0.142.0              8) v0.141.0              9) v0.140.2            
 10) v0.140.1             11) v0.140.0             12) v0.139.5            
 13) v0.139.4             14) v0.139.3             15) v0.139.2            
 16) v0.139.1             17) v0.139.0             18) v0.138.0            
 19) v0.137.1             20) v0.137.0             21) v0.136.5            
 22) v0.136.4             23) v0.136.3             24) v0.136.2            
 25) v0.136.1             26) v0.136.0             27) v0.135.0            
 28) v0.134.3             29) v0.134.2             30) v0.134.1            

Select a version to use in the current directory: 
```

Select the version that you need by pressing the appropriate number. The output will change with newer Hugo versions. If you need to install an older one that is not visible, check the appropriate configuration. [^7]


Running `hugo version` should point to the `hvm` managed one.
```bash
$ hugo version
Hugo version management is enabled in this directory.
Run 'hvm status' for details, or 'hvm disable' to disable.

hugo v0.145.0-666444f0a52132f9fec9f71cf25b441cc6a4f355+extended darwin/arm64 BuildDate=2025-02-26T15:41:25Z VendorInfo=gohugoio
```

On the other hand, running `hugo version` on my old blog should point to the `brew` Hugo version
```bash
$ hugo version
hugo v0.104.3+extended darwin/arm64 BuildDate=unknown
```

## Final Outcome

Now I can still build my blog using the old Hugo version and use a newer version to install a modern theme elsewhere.

[^1]: https://www.brycewray.com/posts/2023/02/hugo-via-npm/)
[^2]: https://www.andbible.com/post/hugo/how-to-switch-to-different-version-of-hugo-framework/#4-use-version-managers-like-asdf-flexible-for-multiple-projects
[^3]: https://natenatters.dev/posts/hugo-and-docker/
[^4]: https://gist.github.com/peterwake/2851767e4424d11688d9a6f40149c3da
[^5]: https://github.com/orgs/Homebrew/discussions/2941#discussioncomment-2155711
[^6]: https://github.com/jmooring/hvm
[^7]: https://github.com/jmooring/hvm?tab=readme-ov-file#configuration
