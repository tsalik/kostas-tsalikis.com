---
title: "Git tip: cherry-pick with an -x"
date: 2018-09-29T13:23:36+03:00
description: Sometimes a cherry-pick is unavoidable. Add -x to highlight that this is a cherry-picked commit.
tags: [Git]
---

### TL;DR
* ```cherry-pick``` takes a commit and applies its changes to your current branch.
* When working with others, use ```-x``` option in order to highlight on the commit message that this is cherry-picked and not the original commit.
* Use it sparingly, instead of a ```merge```, when you need only one specific commit.
* Overusing it can result in confusing history with duplicate commits, thus ```merge``` is generally preferred.

# What is a cherry-pick?
When cherry-picking you basically take the commit that you're targeting and apply its changes to your current HEAD. This will lead to a brand new commit with a different SHA and the same commit message.

```bash
git cherry-pick <target commit SHA>
```

# Why cherry-pick in the first place?
Let's say that you've drawn yourself into a corner -- you need changes from another branch, but you don't need *all* the changes, just some commits. Here is the only case where ```cherry-pick``` should be applied.

# Main disadvantages
Most times developers choose to ```merge``` instead of performing a ```cherry-pick``` -- but why is that? Well, one must be very careful when applying ```cherry-pick```, especially with the order that different commits are applied. When merging, you can be sure that the commits are applied with the right order, so you just have to resolve appropriately the conflicts. On the contrary, when dealing with a number of cherry-picks, you must manually find the correct order of the commits and apply them one by one according to their date.

What's more, you end up with duplicate commits, since the name of the cherry-picked commit will be the same with the original one.

So, ```cherry-pick``` is bad because:

1. You must manually apply the cherry-picks -- depending on the number of commits that you have to apply it may be difficult to find the right order and this is surely an error prone process.
2. Duplicate commits result in weird looking and ugly history.
3. Let's say someone else needs that fix in another branch, will they pick the right commit or will they ```cherry-pick``` the *cherry-picked* one. After all, the cherry-picked one may have a conflict that you do not need.

# A contrived example of ugly history.

Below follows a contrived example of how a cherry-pick can make the history look ugly. Let's say that
you create two commits on _master_, _A_ and _B_, and at that moment you want to create a new feature branch(named with an extra dose of imagination _feature_) and add a new commit _C_.

At the moment we have something like this.

```
   A --- B     <- (master)
          \
           \
            C     <- (feature)
```

Then we go back again to _master_ and commit _D_. We commit _E_ on _feature_, but before that, we would need to apply fix _D_ from _master_, thus we cherry-pick _D_.

```
   A --- B --- D     <- (master)
          \
           \
            C --- D' --- E     <- (feature)
```

At this point, we would like to merge the _feature_ back to _master_. Now the graph would seem something like this:

```
   A --- B --- D ----- Merge Commit     <- (master)
          \                /
           \              /
            C --- D' --- E     <- (feature)
```

And a ```git log --oneline``` would show us the duplicate commits:

```bash
5b5f739 (HEAD -> master) Merge branch 'feature'
d5c76ad E
52ed367 D
c097b61 D
af599fa C
383a1e1 B
c1fffad A
```

Of course, in this example we could easily use ```rebase``` in order to avoid duplicate commits, but one can think of a scenario where the second branch would be a long lived one and would need for only a hotfix to be applied from the upstream.

# Working with others
So, what do you do in case that you are **not** the only one that needs these precious fixes? Naturally, the other person will try to search, with the commit message, the desired commit. Guess what, you will find more than one commit and you won't know which one to apply. One could of course try to change the commit name so it can hint that it's a ```cherry-pick``` commit and not the original one. This can be done with the following command:

```bash
git cherry-pick <target commit SHA> -e
```  

This will open an editor where you can change the commit message and append something that hints that this is a ```cherry-pick``` commit.

After some digging I found that there is another option which automatically appends *```(cherry picked from commit <original commit's SHA>)```*

```bash
git cherry-pick <target commit SHA> -x
```

At least now you know which commit is cherry-picked or not and what was the original commit as well.
