---
title: "My First Blog Post"
date: 2017-12-28T00:34:25+02:00
draft: true
description: "How I created this blog with Hugo"
tags: ["Hugo"]
---

Hi everyone, and welcome to my first ever blogpost! I've been meaning to begin a technical blog about Android development for ages, and at last the time has come. This first post however will not be Android related -- instead I will break down how and why I chose Hugo and how I deployed the blog.

# Hugo vs Jekyll
Since I needed something easy to setup and customize, I decided to go with the solution of [static site generators](https://www.staticgen.com/). I tried to play with the two highest ranked, [Jekyll](https://jekyllrb.com/) (Ruby) and [Hugo](http://gohugo.io/) (Go), which both have a strong community and offer a plethora of themes.

Both are fun, but with Jekyll you have to deal with RubyGems. On the other hand, the only thing that Hugo needs is the Go executable. In the end I chose Hugo, as I wouldn't have to live with the pain of dealing with Ruby in case of migrating, and overall I felt that Hugo worked pretty straightforward for me. You just [download a theme](https://themes.gohugo.io/), make some changes on config.toml, add some content via [Markdown](https://daringfireball.net/projects/markdown/) and you're ready to go!
