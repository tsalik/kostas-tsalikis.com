---
title: "Jetpack: Migrating to androidx"
date: 2018-10-30T09:56:38+03:00
description: "Lessons learned during the androidx migration"
tags: [Android]
---

With the announcement of Android Pie, Google introduced Jetpack. But what exactly is Jetpack? Quoted directly below, it is:

>A collection of Android software components to make it easier for you to develop great Android apps.

More specifically, all support libraries as well as new features will be shipped under a new package, ```androidx.*```. According to the documentation, the new package will be separate from the platform APIs, so we will be able to have more frequent updates and bug fixes, which will be independent from the updates that the Android platform will receive.

This means that, even if an app does not intend to use some of the new features as [slices](https://developer.android.com/guide/slices/), nevertheless it will need to depend on the libraries under the ```androidx.*``` package, and not the old support libraries, as new fixes and updates will target there. Of course, such a large migration will not be free of pain for apps of adequate size and age.

# Prerequisites

Before starting the migration, your app must target version 28 of the APIs and all the support libraries must target version 28.0.0. What's more, having the Android Studio version 3.2 is a must as we will see below.


# Consequences of androidx migration.
First of all, there will be no breakage in the APIs of the libraries under the ```androidx.*``` package. This means that even though the package names on the imports will change, the name of the classes and their method signatures will remain unchanged, so just changing the imports will be enough for refactoring to androidx. That being said, this refactoring will be no small feat.

This refactoring will be all or nothing. You cannot change just a class to the new package and see how it works with the others, it must be done in one go for all the classes, so if your app consists of a lot of classes, brace yourself for a huge merge. Fortunately, there is an extensive [mapping](https://developer.android.com/jetpack/androidx/migrate) between the classes of the old and the new package. Even better, the version 3.2 of the Android Studio comes with a feature that enables you to automatically refactor all the classes. All you have to do is select ```Refactor > Migrate to AndroidX``` and voilà, after a couple of minutes, you will have already migrated to AndroidX.

This will change every class that depends on the old package to the new, with one more catch. The ```gradle.properties``` file will be changed with the following options being added:

```bash
android.useAndroidX=true
android.enableJetifier=true
```

The first option enables you to use the AndroidX package and the second migrates any external dependencies to the new namespace.

# Lessons learned(?)
Of course, someone would be fooled to think that such a big migration that occurs in one go would be that easy to perform.

## Beware of your dependencies(and the dependencies of your dependencies)

Every app is guaranteed to have some external dependencies, be it open-source libraries or commercial SDKs. The migration tool usually works, although there will be some sporadic cases where you will have to change an import manually, so the highest danger will come in the form of your dependencies.

First, let's take a look at open-source libraries, since they pose the least threat of them all. Most developers will use a library because it will save them a lot of time for things that are too complex to handle by themselves, such as network libraries, custom user interfaces, maybe ORMs for databases and annotation processors for a wide spectrum of usage(such as dependency injection).

One of the things that we developers should watch out for is if a library is updated frequently and it is widely used and accepted in the community(and of course whether or not is solves our problem with a nice, user-friendly API). This will ensure that the library will be updated quickly enough so we will be able to migrate to ```androidx.*```. One particular cause of pain may be annotation processors. A lot of annotation processors are used for code generation. This one is bad, not only because it can make your build considerably longer, but specifically in our case, if an error happens when transforming the library's API to ```androidx.*``` you cannot change by hand the import of the auto-generated code no matter what.

Now let's look at closed-source SDKs. One could say why on earth would you decide to plant such an SDK on your app. Unfortunately, an open-source library may support a module for a specific device and its SDK. Most commonly, a customer may have already an app that uses a commercial SDK, or your company decides to use such an SDK, for example to incorporate custom geolocation or single-sign on solutions. In the former, there are not a lot of things that you can do, while in the latter case you can at least consult with people that take decisions and choose the most reliable of the solutions. This must be done thoroughly because, unfortunately, closed-source SDKs tend to update very sparsely or even become deprecated with the pass of the time, and once you depend on an external dependency that you cannot change is like being in a bad marriage where you cannot get out. Money have been spent, signatures have been signed and it can even be a legal headache to remove it.

Finally, during the migration you may find that some corrections must be done by hand, and this may be due to an error on the package's transformation phase, or because you may use an internal API class that is not included on the mapping of the package transformer, but this easy to do, as most of the times we avoid using internal APIs(or at least we should).
