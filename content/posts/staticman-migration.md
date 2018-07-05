---
title: "Hugo comments with Staticman"
date: 2018-07-05T01:10:19+03:00
tags: [Hugo]
description: "Moving away from Disqus and using Staticman as a commenting system with Hugo."
---

For quite a while I had a dry run without any ideas for posts. Since I have no ideas for an Android related post and I wanted to migrate away from Disqus, here is the opportunity to document this migration.

# Moving away from Disqus

Some drawbacks of using Disqus is that it is not open source, it lacks support of Markdown and also uses cookies. One big advantage of using it is that just by creating a Disqus short name and declaring it in the config.toml of my Hugo site, I instantly have a way to add comments to my blog. That was great for quickly starting this blog, but its drawbacks are too great for me to continue supporting it.

So off to the internet, I went to search for some alternatives that should be open source and support Markdown, ideally with as much less configuration as needed. Upon stumbling at [this](https://notes.peter-baumgartner.net/2017/09/14/alternatives-for-disqus/) post, I decided to give Staticman a try.

# Choosing Staticman

[Staticman](https://staticman.net/) covers all the three prerequisites mentioned above. It is an open-source project, maintained by [Eduardo Bouças](https://eduardoboucas.com/). Basically, Staticman allows you to incorporate comments into your own repository, thus they become part of the content for your blog. The comments can be saved as Markdown, and then rendered appropriately in the blog. What's more, since the comments are stored in your git repository, they are not sent to any external third party services, thus eliminating the use of cookies, that can be a problem when dealing with GDPR issues.

Staticman was created with Jekyll - another very popular static site generator - in mind, but fortunately, Eduardo Bouças created a [Hugo example](https://github.com/eduardoboucas/hugo-plus-staticman) as well, which provides as a fine guide on how to configure your Hugo site with Staticman.

What's more, Staticman can be configured to provide reply functionality for comments, as well mail subscription for replies. A very thorough article can be found [here](https://networkhobo.com/2017/12/30/hugo---staticman-nested-replies-and-e-mail-notifications/) on how to configure the reply feature.

# Configuring Staticman

Setting up your Hugo blog with Staticman is relatively easy, just by following the [documentation](https://staticman.net/docs/). After that, you must register your git repo and the appropriate git branch in the Staticman API. In order to do this just open your favorite browser and enter the following:

```
https://api.staticman.net/v2/connect/{your GitHub username}/{your repository name}
```

If an *"OK"* message shows up, congratulations, you just registered your blog with Staticman. Unfortunately, you are not yet ready to give your readers the chance to comment your posts.

Finally, you must provide an appropriate ***staticman.yml*** configuration file, which Staticman parses, along with the required HTML form that posts the comments to the API and presents the comments of the post. A staticman.yml sample can be found [here](https://github.com/eduardoboucas/hugo-plus-staticman/blob/master/staticman.yml).

A sample form is shown below:

```html
<form class="post-new-comment" method="POST" action="https://api.staticman.net/v2/entry/{your github name}/{your blog repo}/staticman/comments">
  <input type="hidden" name="options[redirect]" value="{{ .Permalink }}#comment-submitted">
  <input type="hidden" name="options[entryId]" value="{{ .UniqueID }}">
  <input type="hidden" name="options[redirectError]" value="{{ .Permalink }}#comment-submitted">
  <input name="fields[name]" type="text" class="post-comment-field" placeholder="Your name">
  <input name="fields[email]" type="email" class="post-comment-field" placeholder="Your email address">
  <textarea name="fields[body]" class="post-comment-field" placeholder="Your message. Feel free to use Markdown." rows="10"></textarea>
  <input type="submit" class="post-comment-field btn" value="Submit">
</form>
```

Your comments will be saved in a comments folder, below the data folder of Hugo. You can then create a Hugo *partial* which traverses the comments folder and renders the comments(which can be configured to be saved as json files as well).

# Pitfalls to avoid

As you add Staticman, you may have no comments added on your posts. In that case, no comments folder will be available, and you will not be able to build your site. Just adding a *.keep* file in the comments folder and pushing it to your repo is enough to avoid this situation.

Another problem that I faced as I tried to add Staticman is that I tried to test it locally on my machine, without first pushing the ***staticman.yml*** configuration file. In that case posting a test comment results in an error from Staticman. The reason is that Staticman needs to find that file on your repo in order to figure out your configuration.

So, all in all, add a *.keep* file in /data/comments and add the *staticman.yml* at the top of your repo, but do not forget to push them in order to test your site in a staging or production environment.

# Some drawbacks
As far as I know, Staticman can be used only with GitHub, since it works as a GitHub bot. Obviously, not all static sites are saved in GitHub, and this may be a showstopper for someone using another service. What's more, at the time of the post's writing, GitHub was acquired by Microsoft, and a lot of people have expressed their concerns on the fact, so not everyone will be willing to migrate to GitHub just in order to add comments with Staticman.

Another drawback is the migration of already written comments from whatever service were saved, and exporting them to the Staticman format. This is not exactly a drawback of Staticman, but more likely an obstacle that everyone would have to face when migrating from a commenting system to another. I do not know if there exists any automated way to do this.

Fortunately, I did not have to face those drawbacks, as this blog already uses GitHub(with no intention of moving away), and it is not popular enough yet to have comments to migrate to Staticman :stuck_out_tongue:.

# Final Thoughts

Finally, working with Staticman appeared to be relatively straightforward and a pleasant process. I've decided to keep the commenting system as simple as possible, without replies and comment subscription. As the blog may grow, I may consider adding these features as well. Don't be shy, leave your comments and thoughts!
