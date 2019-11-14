---
title: "A confusing build failure"
date: 2019-11-07T01:00:09+02:00
draft: true
tags: ["testing", "continuous integration"]
---

{{< figure src="/images/posts/broken_builds/judge-dredd-under-arrest.jpg" title="" >}}

Nowadays, it has become quite a common practice to build and check software on machines other than local workstations, most of the time called CI servers(CI stands for [Continuous Integration](https://martinfowler.com/articles/continuousIntegration.html)). This can be done either manually or automatically, usually triggered by a pull/merge request or a direct push on the main trunk (in git terminology most of the times named *master*).

The point is that there's a single place where binaries are packaged and code is checked for quality and correctness, so we can merge changes safely and with confidence. 

When a failure appears in a build it should be investigated why did it happen. Did a commit actually break functionality? Were static code analysis checks too harsh and maybe they must be relaxed a little bit? Recently, one of the failures that left me most perplexed was a build where the unit tests failed on the CI server unit tests but passed locally! How did this happen? Investigating on this confusing build failure unearthed bigger problems than just a breaking unit
test.

## Mockito cannot mock final classes

So why was the build failing? When the unit tests ran, some of them would fail with an error stating that Mockito (more specifically [mockito-kotlin](https://github.com/nhaarman/mockito-kotlin)) - a library commonly used in Java and Android to provide mock test doubles and behavior verification - cannot mock final classes.

In order to understand the error, let's try to understand first how Mockito works. It creates, at runtime, objects that extend interfaces or a classes designed to verify that a set of methods were called with the intended parameters. If a class that is attempted to be mocked is declared as `final`, then the error above will be thrown as a final class cannot be extended at compile or run time. In our unit test, a Kotlin class was mocked and as Kotlin classes are by default
`final`, unless explicitly declared `open`, the error above was thrown.

Although the culprit is found, we still have not figured out why the tests passed locally but failed on the CI server. 

## Maybe Mockito can mock final classes after all

If Mockito cannot mock final classes, then why do local tests pass? Well, sure there must be some way to mock a final class, and that's exactly what happens when the `org.mockito:mockito-inline` dependency is added to the gradle build file. 

The problem is that the failing module did not compile with the dependency above. Instead, a submodule did declare mockito-inline on its `build.gradle` but not as a transitive dependency, meaning that final classes could be mocked on that submodule only, not on the top module whose tests were failing. 

This could easily be fixed by either declaring mockito-inline as transitive, or adding it on the top module, but that would not explain why the test resources are compiled differently on the CI server than locally.

Based on gradle files, on the CI server the build failed as expected, but locally mockito-inline was compiled on the top module (where it shouldn't) and it wrongfully passed. This, however, begs the following question: how can the CI server be compiled and tested in a different way than the local build?

It turns out that different commands are employed to compile and test the source code. On the CI server the project is compiled and tested with gradle commands, thus the mockito-inline is not compiled and the test that mocks Kotlin classes fails. On the other hand the
local builds used the test runner that is natively built into Android Studio, which happens to compile all libraries irrespectively of how they are declared on each module's `gradle.build`.

## But why did mockito-inline was used on the first place?

At last, the mystery has been solved but let's dig a little deeper. Why did a test try to mock an otherwise concrete class? And when/why was the mockito-inline dependency introduced first?

The Kotlin class was mocked just as a filler object for the constructor. No verifications were performed on that mocked object - neither was it used to stub a value. Hence, the concrete class should be used as is or in case of an interface, which cannot be instantiated, a dummy test double.

On the other hand, mockito-inline was introduced in the submodule in order to verify the behavior of a third-party library. Since we don't own the API and implementation of any third-party library, if we mocked and verified interactions with the library future versions of the API and the implementation could change in subtle ways and even though the tests pass the production code
could fail.

These kinds of tests give us no feedback and no confidence, in other words they provide zero value. We should either test the real thing or test it manually.

## Summing up

It's quite surprising how a single build failure unearthed multiple cultural and technical shortcomings. 

 * We often push code that we broke - not only tests aren't green but also many times are not compiling. This means that tests are not treated as first class citizens.
* Mocks are used ***too much***. Mocks are a special case of [test doubles](https://martinfowler.com/articles/mocksArentStubs.html) that are used for verification testing. They are a perfect tool for teasing out collaborators and interfaces, especially when the real objects are hard/costly to use, but should be used with moderation. This highlights a lack of understanding of the tools used for testing as well as when they should be applied. 
* No review on the test code is performed. This, again, means that tests are treated as second class citizens and as a nice to have.
* Local builds differ than CI builds. This means we're more prone to false positives/negatives.
* Broken builds pass on the main trunk. This indicates that we're in a hurry more times than we would like.

Broken builds should alert the whole team that something has gone bad and needs immediate attention and fix. Just having tests is not enough - they should provide fast feedback and confidence. They should be easy to read and understand, easy to create and their failures easy to decode, as well as deterministic. These qualities of tests are the weapons that a developer can exploit in order to refactor aggressively and keep the system easy to understand and change. Add
critical thinking to the mix in order to listen to what tests are trying to tell us about our design and we have the ingredients to battle complexity. 

This may sound a little provocative, but we could as well delete tests that do not adhere to the qualities above as we end up with double the burden of maintenance and confusion.

As a personal critique on my part I could probably say that even though I tried, I should emphasize even more the dangers of mocking too much. After all one cannot learn just by one example, especially from code that is not created with testing in mind - meaning there will be cut corners and "broken" rules on these examples.

Finally, this can be seen as a further proof that tools by themselves do not solve problems. Having tests and a CI server is not enough. It is critical to have a deep understanding why these set of techniques and tools are used, as well as the right place and way to use them. Fortunately, this level of understanding is not the result of arcane magic but can be acquired through repetitive practice and retrospection. We are bound to fail through inexperience but bound to succeed through
curiosity and will to learn.
