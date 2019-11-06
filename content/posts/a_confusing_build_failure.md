---
title: "A confusing build failure"
date: 2019-11-07T01:00:09+02:00
draft: true
tags: ["testing", "continuous integration"]
---

{{< figure src="/images/posts/broken_builds/judge-dredd-under-arrest.jpg" title="" >}}

Nowadays it has become quite a common practice to build and check software on machines other than local workstations, most of the time called CI servers(CI stands for [Continuous Integration](https://martinfowler.com/articles/continuousIntegration.html)). This can be done manually or automatically, usually triggered by a pull/merge request or a direct push on the main trunk(in git terminology most of the times named *master*).

The point is that there's a single point where binaries are packaged and code is checked for quality and correctness, so we can merge changes safely and with confidence. 

When a failure appears in a build it should be investigated why did it happen. Did a commit actually break functionality/introduce a bug? Was static code analysis checks too harsh and maybe they must be relaxed a little bit? One of the failures that left me most perplexed was a build that was failing on the CI server unit tests but passed locally! How did this happen? Investigating on this confusing build failure unearthed bigger problems than just a breaking unit
test.

## Mockito cannot mock final classes

So why was the build failing? When the unit tests ran some of them would fail with an error stating that Mockito(more specifically [mockito-kotlin](https://github.com/nhaarman/mockito-kotlin)) - a library commonly used in Java and Android to provide mock test doubles and for behavior verification - cannot mock final classes.

In order to understand the error let's try to understand first how Mockito works. It creates at runtime objects that extend interfaces or a classes which can be used to verify that some methods were called with specific parameters. If a class that is attempted to be mocked is declared as `final` then the error above will be thrown, as a final class cannot be extended at compile or run time. In a unit test a Kotlin class was mocked and as Kotlin classes are by default
`final` unless explicitly declared `open`, the error above was thrown.

The culprit was found but we still have not figured out why the tests pass locally but fail on the CI. 

## Maybe Mockito can mock final classes after all

If Mockito cannot mock final classes then why do local tests pass? Well sure there must be some way to mock a final class, and that's exactly what happened by adding in the gradle build file the `org.mockito:mockito-inline` dependency. 

The problem is that the failing module did not compile with the dependency above. Another submodule did compile it, but it was declared on its `build.gradle` as `testImplementation` not `testApi`, meaning that final classes could be mocked on that submodule only, not on the failing module.

On the CI server the build rightly failed, but locally mockito-inline was compiled on the module above(where it shouldn't) and it wrongfully passed. How can the CI server be compiled and tested in a different way than locally? It turns out by running different commands that compile and test the source code. On the CI server the project is compiled and tested with gradle commands, thus the mockito-inline is not compiled and the test that mocks Kotlin classes fails. On the other hand the
local builds used the test runner that is built in the Android Studio, which happens to compile all libraries irrespectively of how they are declared on each module's `gradle.build`.

## But why did mockito-inline was used on the first place?

The mystery has at last been solved but let's dig a little bit more. Why did a test try to mock an otherwise concrete class? And when/why was the mockito-inline introduced first?

The Kotlin class was mocked just as a filler object for the constructor(i.e. a dummy object). No verifications were performed on that mocked object - neither was it used to stub a value. The concrete class should be used or in case it was an interface and it could not be instantiated, a dummy test double.

On the other hand, mockito-inline was introduced in the submodule in order to verify the behavior of a third-party library. Since we don't own the API and implementation of any third-party library, if we mocked and verified interactions with the library future versions of the API and the implementation could change in subtle ways and even though the tests pass the production code
could fail.

These kind of tests give us no feedback and no confidence, in other words they provide zero value. We should either test the real thing or test it manually.

## Summing up

It's quite surprising how a single build failure unearthed multiple cultural and technical shortcomings. 

 * We often push code that we broke - not only tests aren't green but also many times are not compiling. This means that tests are not treated as first class citizens.
* Mocks are used ***too much***. Mocks are a special case of [test doubles](https://martinfowler.com/articles/mocksArentStubs.html) that are used for verification testing. They are a perfect tool for teasing out collaborators and interfaces, especially when the real objects are hard/costly to use, but should be used with moderation. This means a lack of understanding of the tools used for testing as well when they should be applied. 
* No review on the test code is performed. This again means that tests are treated as second class citizens and a nice to have.
* Local builds differ than CI builds. This means we're more prone to false positives/negatives.
* Broken builds pass on the main trunk. This means that we're in a hurry more times than we would like.

Broken builds should alert the whole team that something has gone bad and needs immediate attention and fix. Just having tests is not enough - they should provide fast feedback and confidence. They should be easy to read and understand, easy to create and their failures easy to decode, as well as deterministic. These qualities of tests are the weapons that a developer can use in order to refactor aggressively and keep the system easy to understand and change. Add
critical thinking to the mix in order to listen to what tests are trying to tell us about our design and we have the ingredients to battle complexity. 

This may sound a little provocative, but we could as well delete tests that do not adhere to the qualities above as we end up with double the burden of maintenance and confusion.

As a personal critique on my part I could probably say that even though I tried, I should emphasize even more the dangers of mocking too much. After all one cannot learn just by one example, especially from code that is not created with testing in mind - meaning there will be cut corners and "broken" rules on these examples.

Finally, this can be seen as a further proof that tools by themselves do not solve problems. Having tests and a CI server is not enough, it is needed to have a deep understanding why these set of techniques and tools are used, as well as the right place and way to use them. Fortunately these are not arcane magic but knowledge and insight that can be learned through repetitive practice and retrospective. We are bound to fail through inexperience but bound to succeed through
curiosity and will to learn.
