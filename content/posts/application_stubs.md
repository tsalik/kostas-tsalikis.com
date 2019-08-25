---
title: "Stubbing external services in Espresso tests - Part 1: Bring the code in the right shape"
date: 2019-07-24T01:11:47+03:00
draft: true
tags: ["android", "testing", "refactoring"]
description: "In this post we will explore why we would need to add UI tests with Espresso and how to shape the code in order to write the very first test"
---

### TL;DR

* In these series of posts we are going to investigate how we can begin adding UI tests when we can not add `Junit` tests on Android apps. 
* In the first post we are going to see why sometimes we need to add these tests, which are slower than regular tests that run on the JVM and tend to be more flaky as well. 
* We will provide a simple recipes app with all the code hard coded on an `Activity` and will try to get the code in the right shape just before we write our very first Espresso test.

## The need for test doubles

Sometimes we cannot skip the need to write tests that pass through the UI when writing Android apps. Maybe the app that we are currently working is a legacy app and we do not know the codebase well enough to make a change but alas - no presenters, view models or whatever else exists, which allows to decouple the UI from the business rules and, thus, enable fast testing in `JUnit`. Maybe it is the case where the code is already nicely decoupled, but it is required by a pull/merge request process as a prerequisite to
provide UI tests as well or the server side is not ready to start development but we still need to make some progress based upon an agreed API contract.

Whatever the reason may be, the truth is that since we need to provide these tests we will also need to provide substitutes to the real data sources/external APIs that the app is going to communicate with. This is highly crucial if we need for these tests to be of any value - we would not want the tests to be flaky because of some server timeout or outage. Since UI tests are already too slow(we need to build an `apk`, wait for an emulator or device to be online, upload it on the
test device and then run the tests) we would need to have the most suitable test double(more on test doubles from [this excellent article from Martin Fowler](https://martinfowler.com/articles/mocksArentStubs.html)) which responds with the right data depending on the scenarios we are testing.

How can we achieve the above? This is an answer that highly depends on how the dependencies of the app are provided. In this post we will examine the following scenario: An app that provides its dependencies manually through the `Application` class and UI tests with Espresso.

## The legacy app example

Let's say that we have an app that fetches recipes and that the details screen of the recipe that we want to try is just an `Activity` with all the code and the moving parts hard coded in it. When we started developing the app it supported only portrait mode but later tablets were added and the details screen needed to be converted to a list-details screen. This means that we would need to move a considerable amount of code from the recipes details `Activity` to a `Fragment`,
something that could be more difficult than what it should be because that `Activity` does a bunch of things. Let's add a plot twist in this situation. During that time, our test server faces some issues and we are not able to test this UI change with real data for the following two weeks. What do we do in a situation like this? 

The situation is kinda hard because even though we know what to do and it is relative straightforward, we have to face past decisions and new unknown surprises that hinder our progress. Since there are no changes from the API, ideally we would not want to break anything, but neither do we want to wait two weeks until we know that our changes are safe and work. Instead of moving all the code to a `Fragment` and praying that nothing is broken we can use in the meantime some UI tests as a means to refactor our code and add the new feature. 

So here is the code of our little app:

```kotlin

class RecipeDetailsActivity : AppCompatActivity(), NetworkCallback<Recipe> {

    private val recipesDataSource = NetworkRecipesDataSource
    private val recipesRecyclerView by lazy { findViewById<RecyclerView>(R.id.recipes_recycler_view) }
    private val progress by lazy { findViewById<View>(R.id.progress) }
    private val toolbar by lazy { findViewById<CollapsingToolbarLayout>(R.id.toolbar) }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_recipe_details)
        recipesRecyclerView.layoutManager = LinearLayoutManager(this)
    }

    override fun onResume() {
        super.onResume()
        val recipeId = intent?.getStringExtra("EXTRA_RECIPE_ID") ?: ""
        progress.visibility = View.VISIBLE
        recipesDataSource.recipeDetails(recipeId, this)
    }

    override fun success(response: Recipe) {
        progress.visibility = View.GONE
        recipesRecyclerView.adapter = RecipeDetailsRecyclerViewAdapter(response)
        toolbar.title = response.name
    }

    override fun error(type: Int) {
        TODO("not implemented") //To change body of created functions use File | Settings | File Templates.
    }

}
```

We can already see that it does too much. It unpacks the intent for the specific recipe's details and fetches the details from a data source. The unpacking of the intent is well within the `Activity`'s responsibilities, but creating and holding a reference to the actual data source and doing the actual error handling seems too excessive.

In fact, the data source in this example is a Kotlin `object` singleton which,as we will see later, it will bite us back on our try to add some tests. 

## Espresso to the rescue.

So, before we start moving the code on a `Fragment` and doing any dangerous refactoring, we definitely need to add some safety nets first. Since the code is not written in any way that supports `JUnit` tests we are bound to use UI tests. In Android this means Espresso. What would be the best appropriate name for our first test should then? Let's start with a success case. Given that a user wants to see the recipe details of an
existing recipe, when we fetch that recipe, then the details of the recipe are shown. This seems as a good start and it could work great if we could use Kotlin's backticks in order to have some expressive test names when we look at them executing. Unfortunately, this does not work on Android - when we try to run an empty test with backticks the compiler immediately notifies us with a cryptic message stating the following: *Identifier not allowed in Android projects*. In reality, this is a
grim wake up call that our tests do not run on the JVM of your workstation but on an Android test device or emulator, in case we had forgotten(A nice and more thorough explanation is given [here](https://discuss.kotlinlang.org/t/android-issue-with-backticked-method-names/66/4)). 

Let's pause for a moment before writing any line of code - be it test or implementation - and listen to what the test says. In the *"given"* section it is stated that the user wants to see a recipe that exists. That could mean that nothing was passed on the `Intent` or that the call for that recipe id didn't match any existing recipe. We will create a todo list with items that must be done along the way, and add an item that questions how we react and what we should implement in this
case.

Continuing with our first test, we need to pass a stub as the appropriate test double for the data source in order to change every time, depending on the scenario, the response from the server. Here the first problems start to emerge. 
As said above, the current implementation of the data source is a singleton looking like this.

```kotlin

object NetworkRecipesDataSource {

    fun recipeDetails(id: String, callback: NetworkCallback<Recipe>) {
        Handler().postDelayed({
            callback.success(
                Recipe(
                    "Greek Salad",
                    "10 min.",
                    1,
                    listOf("1 tomato", "1 cucumber", "feta cheese", "olive oil"),
                    listOf("Clean and cut the vegetables", "Add the feta cheese and pour some olive oil then steer")
                )
            )
        }, 2 * 1000)
    }

}
```

This implementation just delays for a couple of seconds and then returns a pre-canned value, but one could imagine that it could be a [Retrofit](https://square.github.io/retrofit/) implementation or any other HTTP library. Since this is a singleton, unfortunately we cannot control its creation or any of its behavior in order to pass the appropriate stub. Even though we do not have any tests ready to catch any errors in our thought process, we must do some minor refactoring sessions in order to bring ourselves in a
position to add our first test. In our toy example, converting the singleton to an interface(by using the `Extract Interface` technique) and an ordinary class is relative straightforward, because it does not have any dependencies that need instantiation and injection - the class acts something like a demo to the stakeholders of the app.

So, we can do the `Extract Interface` either by hand, or with the help of the Android Studio. Let's try with the second option. By right clicking on the singleton's name, we can select `Refactor` → `Extract` → `Interface`, select to extract in a separate file and name our new interface to something more generic like `RecipesDataSource`. We can think of this as a safe refactoring as we are not changing any method signatures that could bring errors during type conversions on
method calls - we just add an interface and let the singleton implement it. Now in the `Activity` we can at least change the declaration of the data source to the new interface, and change the singleton to a regular class - with an empty constructor on this toy example.

### Sidenote on Kotlin

```kotlin
private val recipesDataSource = NetworkRecipesDataSource
```

What do you think is the inferred type from the code above, after letting the `NetworkRecipesDataSource` implement the `RecipesDataSource` interface? It is `NetworkRecipesDataSource` regardless of the interface! Maybe this is why we sometimes should prefer declaring the type of a variable in Kotlin instead of letting the compiler infer it for us. It adds clarity and intention that we want to use a more generic type(so we can change implementation details on demand). 

## Enter Dependency Injection

We are at a point where we can change the singleton to a simple class. In this example it is too easy to do, unfortunately most of the times the singletons that we encounter have dependencies that are created inside them and many times it proves quite difficult to find the appropriate way to create these dependencies and inject them on a new public constructor of the singleton.

Now that we have a more generic interface, we can change the implementation - be it for adding a stub for our UI tests or the real implementation that communicates with a database, HTTP server or whatever else - we need, however, an appropriate technique to pass that implementation. This is where `Dependency Injection` makes its appearance. Dependency Injection means that we just pass the objects that a class needs for its instantiation and communication without letting that class
create them. It can be done through the constructor of the class or by setters - with the constructor being more preferred. Unfortunately, the Android framework does not provide us with a way to create an `Activity` - we must launch an `Intent` for a specific `Activity` and let the system create it for us. For this reason we need to find a way to provide the `RecipesDataSource` and inject it as a field member. This can be done either by hand or with a dependency injection
framework  - [Dagger2](https://github.com/google/dagger) and [Koin](https://insert-koin.io/) being the more popular at the moment. In this example we are going to inject the dependencies by hand through the `Application` class.

In order to provide the dependencies manually through the `Application` class, we will create a `RecipesApplication` class and declare it in the `AndroidManifest.xml`. We will then create an `Injector` interface that provides a `RecipesDataSource` and let the `RecipesApplication` implement it and provide the real implementation.

```kotlin
class RecipesApplication: Application(), Injector {

    private val recipesDataSource: RecipesDataSource by lazy { NetworkRecipesDataSource() }

    override fun recipesDataSource() = recipesDataSource

}
```

```kotlin
class RecipeDetailsActivity : AppCompatActivity(), NetworkCallback<Recipe> {
    
    private val recipesDataSource: RecipesDataSource by lazy { (application as RecipesApplication).recipesDataSource() }

}
```

One can argue that in the example above we are not actually using `Dependency Injection` but the `Service Locator` pattern instead. As there has been a heated disagreement on the usage of the two patterns(with the form of `Dagger` vs `Koin`) we are not going to dig more on their differences. One thing that we should be aware of is that both techniques help us apply Inversion of Control, i.e. not letting an object create its dependencies(more again from [Martin Folwer](https://martinfowler.com/articles/injection.html)).

In the next post we will see how we can subclass the `RecipesApplication` for the Espresso tests and how to pass the `RecipesDataSource` stub in order to have reliable tests.
