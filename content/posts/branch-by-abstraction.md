---
title: "Branch by Abstraction powered by Kotlin"
date: 2018-01-21T20:34:20+02:00
description: "A technique for making large-scale changes in software with a Kotlin twist."
tags: ["Refactoring", "Continuous Integration", "Continuous Delivery"]
---

## A case of a large-scale refactoring.

Let's say that one day your senior comes and tells you, "Hi Christine, I've checked out this new cool library X that solves problem Y, can you try to change some calls as a proof of concept and in the meantime provide us with your feedback on how it affects us?"

So you become excited, you get the opportunity to dirt your hands with this new hotness that everyone in the community speaks about, and prove yourself to the team. AWESOME!

As you go about the documentation, you get the feeling that this library is really a lifesaver, and should indeed be integrated with the rest of the codebase. On the downside, there is big gotcha. Migrating from the current implementation to the new is not going to be easy. Your only choice is to create a new branch with the new feature, and merge it back to the trunk(a.k.a. master). Or is it not? You don't want to be the one to make that huge pull request. You only need to implement that small set of simple calls to the new library and leave the rest be. How do you do it?

## Enter Branch by Abstraction.

Bearing in mind that you do not want to be in a situation of a huge merge, and that the changes need to be published to the rest of the team as soon as possible, with some research you can stumble upon a technique named *"Branch by abstraction"*(BbA for the rest of the post). Originally it was introduced by [Paul Hammant][1] and described by [Jez Humble][3] as well.

But what exactly is BbA and how does it differ from the classic feature branching in version control?

Quoted directly from [Martin Fowler][2]:

> "Branch by Abstraction" is a technique for making a large-scale change to a software system in gradual way that allows you to release the system regularly while the change is still in-progress.

The name of the technique is a little bit misleading, as it contains the term "branch" in its definition, which almost immediately hints that we're speaking about branching as in creating a new branch in source control. On the contrary, the technique is advocated by [trunk based development](https://trunkbaseddevelopment.com/), a source control branching model where all developers push directly in the mainline. Rather than branching in source control, the *"branching"* happens in the code directly.

Let's say the initial structure of your code is something like this:

{{< caption image="/images/posts/bba/initial_structure.png" alt="Initial structure" caption="Initial Structure." margin="10px 50px 50px 50px">}}

The steps for BbA are:

1. Add an abstraction over the current old implementation.
2. Refactor so all the clients use the abstraction above instead of the old implementation directly.
   {{< caption image="/images/posts/bba/step1-2.png" alt="Steps 1 & 2" caption="Steps 1 & 2." margin="10px 50px 50px 50px" >}}
3. Add the new implementation under that abstraction and gradually delegate to the new implementation as needed.
   {{< caption image="/images/posts/bba/step3.png" alt="Step 3" caption="Step 3." margin="10px 50px 50px 50px" >}}
4. Once the old implementation is no longer used, it can be deleted.
   {{< caption image="/images/posts/bba/step4.png" alt="Step 4" caption="Step 4." margin="10px 50px 50px 50px" >}}
5. Once the refactoring is over, delete the abstraction layer.
   {{< caption image="/images/posts/bba/step5.png" alt="Step 4" caption="Step 4." margin="10px 50px 50px 50px" >}}

Although Martin Fowler describes some variations, the general idea is that you create an abstraction over the implementation that needs replacement, find the appropriate behaviour that the abstraction must implement, change the client code to use that abstraction and incrementally add the new code.

What's more you can use [feature toggles](https://martinfowler.com/articles/feature-toggles.html), so you continue to deliver software, even if the the new implementation is unfinished.

## Pros and Cons

Every technique has its ups and downs, and BbA is no short of its own:

**Pros**:

 - No merge hell.
 - It is possible to extract behaviour that the old implementation should't have, thus making the system more cohesive.
 - Code is continuously integrated, thus always on a working state.
 - You can deliver anytime, even with the feature unfinished.

**Cons**:

 - Development process may slow down, as it is not always easy to introduce the required abstraction, or to make the two implementations co-exist during the refactoring.
 - Difficult to apply if the code needs external audit.

## Show me the code

Of course, talk is cheap and a simple but non trivial example is worth a thousand words. Let's create a simple app which saves quotes and then lists them(named with an extra dose of imagination "QuotesApp").

For QuotesApp we will use a MVP pattern. The Presenters will hold a QuotesRepository directly instead of UseCases and the QuotesRepository will have a QuotesDataSource for storing the quotes locally. In the role of our legacy library we will use SqlBrite2 and we will try to replace it gradually with the new Room library. The full code of the example is [here](https://github.com/tsalik/BranchByAbstractionExample).

{{< gist tsalik a198ab7e39f45c2bf8f14dd904961e42 "QuotesDataSource.java" >}}

{{< gist tsalik a198ab7e39f45c2bf8f14dd904961e42 "SqlBriteQuotesDataSource.java" >}}

We will use the QuotesDataSource interface to introduce the abstraction needed for our BbA powered refactoring. In Java this would look something like below. We would make the abstraction implement the QuotesDataSource and then manually delegate all method calls to the old implementation. Then in our dependency injector we would wrap the Sqlite implementation with the new mixed data source.

{{< gist tsalik a198ab7e39f45c2bf8f14dd904961e42 "MixedSqliBriteRoomDataSource.java" >}}

## Excuse me, where is my Kotlin twist?

In this example we only have two methods, but one can imagine a huge api with a hundred or more methods. Wouldn't it be tedious and error prone to manually delegate to the old implementation? So far, Kotlin has not shown up in the post, and now is the time to make its magical appearance. We could use the power of Kotlin's built in delegation and make the abstraction delegate by default to the old implementation:

{{< gist tsalik a198ab7e39f45c2bf8f14dd904961e42 "MixedSqliteRoomDataSource.kt" >}}

This is not only terse and concise, but also saves you from the errors that anyone can easily do during manual delegation.

## Back to Refactoring

Continuing with the refactoring, we would introduce the new implementation, and pass it as a second argument to our abstraction. Then finally, we would override only some of the methods in our abstraction to delegate to the new implementation.

{{< gist tsalik a198ab7e39f45c2bf8f14dd904961e42 "MixedSqliBriteRoomDataSource2.kt" >}}

This is much easier to push directly to the mainline, or if you're in favour of code reviews, make a short lived version control branch and open a pull request from there.

As you add more and more methods in your new implementation, the old one and the abstraction will become obsolete, and finally you will be able to delete them.

## Final Thoughts

So far, BbA seems to be quite a sane way for making large-scale changes in your codebase. It may not be always easy to make the old and new implementations coexist, but all in all, it seems to be worth the effort. What's more, we can use the power of Kotlin's delegation to quickly implement only a set of behaviours in order to provide a proof of concept, and then continue with the rest of the refactoring.

[1]: https://paulhammant.com/2013/04/05/what-is-trunk-based-development/
[2]: https://martinfowler.com/bliki/BranchByAbstraction.html
[3]: https://continuousdelivery.com/2011/05/make-large-scale-changes-incrementally-with-branch-by-abstraction/
