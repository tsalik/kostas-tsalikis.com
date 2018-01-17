---
title: "Branch by Abstraction powered by Kotlin"
date: 2018-01-12T20:34:20+02:00
draft: true
description: "A technique for making large-scale changes in software with a Kotlin twist."
tags: ["Refactoring", "Continuous Integration", "Continuous Delivery"]
---

## A case of a large-scale refactoring.

Let's say that one day you senior comes and tells you, "Hi Christine, I've checked out this new cool library X that solves problem Y, can you try to change some calls as a proof of concept and in the meantime provide us with your feedback on how it affects us??"

So you become excited, you get the opportunity to dirt your hands with this new hotness that everyone in the community speaks about, and prove yourself to the team. AWSOME!!

As you go about the documentation, you get the feeling that this library is really a lifesaver, and should indeed be integrated with the rest of the codebase. On the downside, there is big gotcha. Migrating from the current implementation to the new is not going to be easy. Your only choice is to create a new branch with the new feature, and merge it back to the trunk(a.k.a. master). Or is it not? You don't want to be the one to make that huge pull request. You only need to implement that small set of simple calls to the new library and leave the rest be. How do you do it?

## Enter Branch by Abstraction.

Bearing in mind that you do not want to be in a situation of a huge merge, and that the changes need to be published to the rest of the team as soon as possible, with some research you can stumble upon a technique named *"Branch by abstraction"*(BbA for the rest of the post). Originally it was introduced by [Paul Hammant][1] and described by [Jez Humble][3] as well.

But what exactly is BbA and how does it differ from the classic feature branching in version control?

Quoted directly from [Martin Fowler][2]:

> "Branch by Abstraction" is a technique for making a large-scale change to a software system in gradual way that allows you to release the system regularly while the change is still in-progress.

The name of the technique is a little bit misleading, as it contains the term "branch" in its definition, which almost immediately hints that we're speaking about branching as in version control branching. On the contrary, the technique is advocated in trunk based development, which evangelizes  that all developers should push directly in the mainline rather than branching in the version control -- the *"branching"* happens in the code directly.

The steps for BbA are:

1. Add an abstraction over the current old implementation.
2. Replace so all the clients use that abstraction.
3. Add the new implementation under that abstraction and gradually delegate to the new implementation as needed.
4. Once the old implementation is no longer used, the abstraction above can be deleted along with the code to be replaced.

Although Martin Fowler describes some variations, the general idea is that you create an abstraction over the implementation that needs replacement, find the appropriate behavior that the abstraction must implement, change the client code to use that abstraction and incrementally add the new code.

What's more we can use feature toggles, so even if the the new implementation is unfinished, in production we can continue to use the old one.

## Pros and Cons

Every technique has its ups and downs, and BbA is no short of its own:

**Pros**:

 - No merge hell.
 - By continuously integrating we prove that the code is always in a working state, so we can release anytime.
 - Releasing is decoupled from the architectural changes, so it's cheap to pause or cancel the refactoring.

**Cons**:

 - Overhead in the development process, as you need to think carefully and move slow when you make incremental change, especially if the code is purely structured.
 - Cannot do if the code needs external audit.

## Shut up and show me the code

TBD

[1]: https://trunkbaseddevelopment.com/branch-by-abstraction/
[2]: https://martinfowler.com/bliki/BranchByAbstraction.html
[3]: https://continuousdelivery.com/2011/05/make-large-scale-changes-incrementally-with-branch-by-abstraction/
