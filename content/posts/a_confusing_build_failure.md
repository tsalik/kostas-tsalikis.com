---
title: "A confusing build failure"
date: 2019-11-07T01:00:09+02:00
tags: ["testing", "continuous integration"]
publishDate: 2019-11-20T01:00:09+02:00
description: "How can a unit test pass on Android Studio and fail on a Continuous Integration daemon?"
---

{{< figure src="/images/posts/broken_builds/judge-dredd-under-arrest.jpg" title="" >}}

Special and many thanks to *[Kleomenis Tsiligkos](https://twitter.com/ktsiligkos)* and *[Michalis Kolozoff](https://www.linkedin.com/in/michalis-romanos-kolozoff-03b19180/)* for proof reading. 

##### TL;DR
* Do not overuse mock test doubles.
* Check the quality of tests in code reviews as well.
* Validate that the build between Android Studio and CI servers is invoked through the same commands.
* Investigate thoroughly build failures and try to have them fixed as soon as possible, before merging.

## A wild failing build appears

Nowadays, it has become quite a common practice to build and check software on machines other than local workstations, most of the time called CI servers(CI stands for [Continuous Integration](https://martinfowler.com/articles/continuousIntegration.html)). This can be done either manually or automatically, usually triggered by a pull/merge request or a direct push on the main trunk (in git terminology most of the times named *master*).

The point is that there's a single place where binaries are packaged and code is checked for quality and correctness, so we can merge changes safely and with confidence. 

When a failure appears in a build, it should be investigated why it happened. Did a commit actually break functionality? Were static code analysis checks too harsh and maybe they must be relaxed a little bit? Recently, one of the failures that left me most perplexed was a build where the unit tests failed on the CI server but passed locally! How did this happen? Investigating on this confusing build failure unearthed bigger problems than just a breaking unit
test.

## Mockito cannot mock final classes

So why was the build failing? When the unit tests ran, some of them would fail with an error stating that Mockito (more specifically [mockito-kotlin](https://github.com/nhaarman/mockito-kotlin)) - a library commonly used in Java and Android to provide mock test doubles for behavior verification - cannot mock final classes.

In order to understand the error, let's try to understand first how Mockito works. It creates, at runtime, objects that extend interfaces or classes designed to verify that a set of methods were called with the intended parameters. If a class that is attempted to be mocked is declared as `final`, then the error above will be thrown as a final class cannot be extended at compile or run time. In our unit test, a Kotlin class was mocked and as Kotlin classes are by default
`final`, unless explicitly declared `open`, the error above was thrown.

Although the culprit is found, we still have not figured out why the tests passed locally but failed on the CI server. 

## Maybe Mockito can mock final classes after all

If Mockito cannot mock final classes, then why do local tests pass? Well, sure there must be some way to mock a final class, and that's exactly what happens when the `org.mockito:mockito-inline` dependency is added to the gradle build file. 

The problem is that the failing module did not compile with the dependency above. Instead, a submodule did declare mockito-inline on its `build.gradle` but not as a transitive dependency, meaning that final classes could be mocked on that submodule only, not on the top module whose tests were failing. 

This could easily be fixed by either declaring mockito-inline as transitive, or adding it on the top module, but that would not explain why the test resources are compiled differently on the CI server than locally.

Based on gradle files, on the CI server the build failed as expected, but locally mockito-inline was compiled on the top module (where it shouldn't) and it wrongfully passed. This, however, begs the following question: how can the CI server be compiled and tested in a different way than the local build?

It turns out that different commands are employed to compile and test the source code. On the CI server the project is compiled and tested with gradle commands, thus the mockito-inline is not compiled and the test that mocks Kotlin classes fails. On the other hand, the
local builds used the test runner that is natively built into Android Studio, which happens to compile all libraries irrespectively of how they are declared on each module's `build.gradle`.

## But why did mockito-inline was used on the first place?

At last, the mystery has been solved but let's dig a little deeper. Why did a test try to mock an otherwise concrete class? And when/why was the mockito-inline dependency introduced first?

The Kotlin class was mocked just as a filler object for the constructor. No verifications were performed on that mocked object - neither was it used to stub a value. Hence, the concrete class should be used as is or in case of an interface, which cannot be instantiated, a dummy test double. If, however, a concrete class was mocked because it was difficult to instantiate (e.g. it has too many dependencies on its constructor), then this is a moment where one needs to pause and
think twice. As for value(`data`) classes? 

Quoted directly from the book *Growing object-oriented Guided by Tests* [ [^1] ]:

> ***Don’t Mock Values***

On the other hand, mockito-inline was introduced in the submodule in order to verify the behavior of a third-party library. Let's say that we had to test the persistence layer of an app. We could either run an integrated test in order to check if the code we've written works well against the real database, or we could mock the database as below.

```java
    @Test
    public void givenDbIsEmpty_whenInsertData_thenDbSavesTheNewEntry() throws IOException {
        /* DAO: Data Access Object
         * usually referred to an object that fetches 
         * data from a database or other kinds of data source. */
        SomeDAO aDao = new SomeDAO();
        database = mock(ExternalDatabase.class); 
        when(database.select(any())).thenReturn(new SomeDAO());

        database.insert(aDao);

        SomeDAO savedDao = database.select(aDao);
        assertThat(selectedDao, is(equalTo(aDao);
    }
```

First of all, the problem with this test is that it actually tests nothing. The class under test is mocked and its result is stubbed, so it seems all that is tested here is the ability of the mock framework to stub a value. These kinds of tests give us no feedback and no confidence, in other words they provide zero value. We should instead automate the test for the real thing or test it manually.

What's more, we are not listening to the tests. Instead of trying to guess how the library should respond to a request and find ways to mock/stub whatever is required to feed that answer to an assertion, we should add an Adapter layer over the third-party code, test the Adapter with the library and mock callbacks that we may pass to the Adapter layer. 

Perhaps some direct quotes can paint the picture in a better way [ [^2] ]:

> The mess in such tests is telling us that the design isn’t right but, instead of fixing the problem by improving the code, we have to carry the extra complexity in both code and test.

> A second risk is that we have to be sure that the behavior we stub or mock matches what the external library will actually do.

## Mitigate the many faces of the problem 

So far we've seen that there is a build failure that was only caught on the CI server caused by the abuse of mocks on unit tests and the difference in the way CI and local builds are created. Moreover, the failure managed to pass to the main trunk and obstruct other pull requests even though no bugs were introduced. Is there a single root cause in this situation? Multiple layers of safety had to be overridden in order for the failure to reach the mainline.

This is not so much an issue of technical deficiency - all developers on the team are quite competent. In order to understand the problems and their various causes, let's state the facts and try to analyze the situation.

***Mocks are used excessively and on the wrong context***. They are a special case of test doubles that are used for verification testing [ [^3] ]. 

Using mocks as the de facto test double highlights a lack of understanding of the tools used for testing. Quoting again Nat Pryce and Steve Freeman [ [^1] ]:

> our intention in test-driven development is to use mock objects to bring out relationships between objects.

In every test, it should be carefully evaluated what kind of test doubles (if any) are required and try to minimize mocks only for verifying behavior on interfaces. Of course, there are times where every rule needs to be broken, but most of times we can avoid using tools such as mockito-inline and PowerMock.

***The build failed too late and only on the CI server***. The local workstations and the CI server should build with the same commands in order to avoid unpleasant surprises like this one. Unfortunately, it may be a common assumption that Android Studio builds and tests the same way with the setup of a CI server(this surely caught me by surprise as well). 

Maybe we could check once in a while the way Android Studio builds because an update can change how things are built and tested. 

***Broken code passed on the main trunk***. Even though the build failed, eventually the code was merged and made available for others. 

The safety nets here could be more thorough code reviews that check the quality of the tests as well.

## Summing up

Sometimes being in a hurry does not help and if the CI server is erratic and fails often from timeouts, we may think that it's a fault negative. In any case, we should always investigate why builds fail and try to fix them again as soon as possible. Just having tests is not enough - they should provide fast feedback and confidence. They should be fast, deterministic, easy to read and understand, easy to set up and their failures clear to diagnose. These qualities of tests are the weapons that a developer can exploit in order to refactor aggressively and keep the system easy to understand and change. Add
critical thinking to the mix in order to listen to what tests are trying to tell us about our design and we have the ingredients to battle complexity. 

This may sound a little provocative, but we could as well delete tests that do not adhere to the qualities above as we end up with double the burden of maintenance and confusion.

As a personal critique on my part, I could probably say that when I was tasked to provide guidelines to the team about verification testing, I felt that I should have emphasized even more on the dangers of mocking too much. After all one cannot learn just by one example, especially from code that is not created with testing in mind - meaning there will be cut corners and "broken" rules on these examples.

Finally, this can be seen as a further proof that tools by themselves do not solve problems. Having tests and a CI server is not enough. It is critical to have a deep understanding why these set of techniques and tools are used, as well as the right place and way to use them. Fortunately, this level of understanding is not the result of arcane magic but can be acquired through repetitive practice and retrospection. We are bound to fail through inexperience but bound to succeed through
curiosity and will to learn.

[^1]: Nat Pryce - Steve Freeman: Growing object-oriented Guided by Tests, *Chapter 20: Listening to the tests*
[^2]: Nat Pryce - Steve Freeman: Growing object oriented Guided by Tests, *Chapter 8: Building on Third-Party Code*
[^3]: [Martin Fowler: Mocks aren't Stubs](https://martinfowler.com/articles/mocksArentStubs.html)
