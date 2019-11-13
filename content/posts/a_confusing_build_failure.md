---
title: "A confusing build failure"
date: 2019-11-07T01:00:09+02:00
draft: true
tags: ["testing", "continuous integration"]
---

{{< figure src="/images/posts/broken_builds/judge-dredd-under-arrest.jpg" title="" >}}

Nowadays it has become quite a common practice to build and check software on machines other than local workstations, most of the time called CI servers(CI stands for [Continuous Integration](https://martinfowler.com/articles/continuousIntegration.html)). This can be done manually or automatically, usually triggered by a pull/merge request or a direct push on the main trunk(in git terminology most of the times named *master*).

The upside is, there's a single point where binaries are packaged and code is checked for quality and correctness, so we can merge changes safely and with confidence. 

When a failure appears in a build it should be investigated, why did it happen? Did a commit break functionality/introduce a bug? Was static code analysis checks too harsh and maybe they must be relaxed a little bit? One of the failures that left me most perplexed was a build that was failing on the CI server unit tests but passed locally! How did this happen? Investigating on this confusing build failure unearthed bigger problems than just a breaking unit test.

## Mockito cannot mock final classes

So why was the build failing? When the unit tests ran some of them would fail with an error stating that Mockito (mockitokotlin](https://github.com/nhaarman/mockito-kotlin)) - a library commonly used in Java and Android to provide mock test doubles and behavior verification - cannot mock final classes.

In order to understand the error, let's try to understand first how Mockito works. It creates objects at runtime, that implement/extend interfaces or classes which can be used to verify that some methods were called with specific parameters. If a class that is attempted to be mocked is declared as `final` then the error above will be thrown, as a final class cannot be extended at compile time and thus at run time. In our case, there was a unit test in which a Kotlin class was mocked and as Kotlin classes are by default `final`, unless explicitly declared `open`, the error above was thrown.

The culprit was found but we still have not figured out why the tests pass locally but fail on the CI. 

## Maybe Mockito can mock final classes after all

If Mockito cannot mock final classes, then why do local tests pass? Well sure there must be some way to mock a final class, and that's exactly what happened. By adding in the gradle build file the `org.mockito:mockito-inline` dependency. 

The problem is that the failing module did not compile with the dependency above, another submodule did. And since the dependency was declared on the latter’s `build.gradle` as `testImplementation`, not `testApi`, final classes could be mocked on that submodule exclusively, and not on the failing one.

On the CI server the build rightly failed, but locally mockito-inline was compiled on the aforementioned module, where it shouldn't, and was wrongfully passed. How can the source code, on the CI server, be compiled and tested in a different way than locally? As it turns out, by running different commands for compiling and testing it. On the CI server the project is compiled and tested with gradle commands, thus the mockito-inline is not compiled and the test that mocks Kotlin classes fails. On the other hand the local builds use the test runner that is built in the Android Studio, which happens to compile all libraries irrespectively of how they are declared on each module's `gradle.build` file.

## But why did mockito-inline was used on the first place?

At last, the mystery has been solved but let's dig a little deeper. Why did a test try to mock an otherwise concrete class? And when/why was the mockito-inline introduced first?

The Kotlin class was mocked just as a filler object for the constructor (i.e. a dummy object). No verifications were performed on that mocked object - neither was it used to stub a value. Meaning, the concrete class should have been used or in case of an interface that could not be instantiated, a dummy test double.

On the contrary, the mockito-inline dependency was introduced in the submodule, for the needs of a previous test which aimed to verify the behavior of a third-party library (!?). Since we don't own the API and implementation of any third-party library, there is no point in testing it. To make matters worse, if we mocked and verified interactions with said library and their implementation changed in future versions, even in subtle ways, our tests wouldn’t pass, and our production code would fail, for no apparent reason.

This kind of tests give us no feedback and no confidence, in other words they provide zero value.

## Summing up

It's quite surprising how a single build failure unearthed multiple cultural and technical shortcomings. 

 * We often push code that we broke - not only tests aren't green but also many times are not compiling. This means that tests are not treated as first class citizens.
* Mocks are used ***too much***. Mocks are a special case of [test doubles] (https://martinfowler.com/articles/mocksArentStubs.html) that are used for verification testing. They are a perfect tool for mimicking real objects, that are hard/costly to use, but should be used in moderation. 
* No review on the test code is performed. This again, means that tests are treated as second class citizens and a nice-to-have.
* Local builds differ from CI builds. This means we're more prone to false positives.
* Broken builds pass on the main trunk. This means that we're in a hurry more of often than we would like.

Broken builds should alert the whole team that something has gone wrong and needs immediate attention. Just having tests is not enough - they should provide fast feedback and confidence. They should be easy to read and understand, easy to create and their failures easy to decode, as well as deterministic. These qualities of tests are the weapons that a developer can use in order to refactor aggressively and keep the system easy to understand and change. Add critical thinking to the mix in order to listen to what tests are trying to tell us about our design, and we have the ingredients to battle complexity. 

This may sound a little provocative, but we could as well delete tests that do not adhere to the qualities above as we end up with double the burden of maintenance and confusion.

As a personal critique, I could probably say, that even though I tried, I should emphasize even more on the dangers of mocking too much. After all one cannot learn just by one example, especially from code that is not created with testing in mind - meaning one will cut corners and break rules on these cases.

Finally, this can be considered as a further proof that tools by themselves do not solve problems. Having tests and a CI server is not enough, we must have a deeper understanding why this set of techniques and tools is used, as well as the right way to use it. Fortunately, the idea of testing is not arcane magic but hands-on knowledge and insight that can be gained through repetitive practice and retrospective. We are bound to fail through inexperience but also, bound to succeed through curiosity and the will to learn.
