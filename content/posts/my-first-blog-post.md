---
title: "My First Blog Post"
date: 2017-12-28T00:34:25+02:00
draft: true
description: "How I created this blog with Hugo"
tags: ["Hugo"]
---

Hi everyone, and welcome to my first ever blogpost! I've been meaning to begin a technical blog about Android development for ages, and at last the time has come. This first post, however, will not be Android related -- instead I will break down why and how I chose Hugo and deployed this site.

## Hugo vs Jekyll
As I needed something easy to setup and customize, a static site made perfect sense -- and there are lots of [static site generators](https://www.staticgen.com/) to choose from. In fact there are too many, so I decided to play with the two highest ranked, [Jekyll](https://jekyllrb.com/) (Ruby) and [Hugo](http://gohugo.io/) (Go), which both have strong communities and offer a plethora of themes.

Both are fun, but with Jekyll you have to deal with Ruby and RubyGems. On the other hand, the only thing that Hugo needs is the Go executable. In the end I chose Hugo, as I wouldn't have to live with the pain of dealing with Ruby again in case of migrating to another environment, and overall I felt that Hugo worked pretty straightforward for me. Installing and tweaking Hugo is pretty easy if you follow the [documentation](http://gohugo.io/getting-started/), so I've left it outside of the scope of this post.

## Hosting on Netlify
As an Android developer, I cannot say that I had prior experience on how to deploy a site. What I can say, however, is that this was one of the biggest hurdles that I faced in the process of setting up this blog. Fortunately, Hugo has a lot of [suggestions on hosting and deployment](https://gohugo.io/hosting-and-deployment/) which saved the day. Among the proposals, that of [Netlify](https://www.netlify.com/) seemed to be the most attractive, with the promise of Continuous Deployment, custom domain name and 1-click HTTPS.

Of course, there was no way that the whole setup would go as planned right away. Firstly, I wasn't even able to deploy the site. Being quite forgetful myself, I had missed to add the wonderful Hugo theme that I had chosen as a git submodule. After that, the site was up, but something in the theming had gone awfully wrong. Once again, I had forgotten to change the baseURL in the *config.toml*, which contains configuration for the Hugo site.

And then, oh joy! The site was live -- but not exactly as I had managed to do locally in my machine. Since everything was a draft, the blog was just empty. The trick was to add a *netlify.toml* file, which configures the Netlify deployment, and edit it to run a different command that builds drafts in Hugo. Then with a pull request in Github, a new preview environment was created in Netlify, and I could verify that the blog was up as intended with the drafts built. This is extremely useful, because we can share drafts with reviewers or make UI changes without affecting the production site.

## Ready, aim, fire!
Finally, with the site live, I'm ready to start my journey in technical blogging. I wish to be a frequent writer and share my ideas (mostly) about Android development with the rest of the community. Hopefully, this blog will be a platform where knowledge will be shared among us, both for me and for you -- the readers -- in an environment of mutual respect and understanding.
