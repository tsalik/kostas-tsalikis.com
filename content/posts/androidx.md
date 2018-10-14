---
title: "Jetpack: Migrating to androidx"
date: 2018-10-14T22:56:38+03:00
draft: true
description: "Lessons learned during the androidx migration"
---

With the announcement of Android Pie, Google introduced Jetpack. But what exactly is Jetpack? Quoted directly below, it is:

>A collection of Android software components to make it easier for you to develop great Android apps.

More specifically, all support libraries as well as new features will be shipped under a new package, ```androidx.*```. According to the documentation, the new package will be separate from the platform APIs, so we will be able to have more frequent updates and bug fixes, which will be independent from the updates that the Android platform will receive.

This means that, even if an app does not intend to use some of the new features as [slices](https://developer.android.com/guide/slices/), nevertheless it will need to depend on the libraries under the ```androidx.*``` package, and not the old support libraries, as new fixes and updates will target there. Of course, such a large migration will not be free of pain for apps of adequate size and age.

# Prerequisites

Before starting the migration, your app must target version 28 of the APIs and all the support libraries must target version 28.0.0. What's more, having the Android Studio version 3.2 is a must as we will see below.


# Consequences of androidx migration.
First of all, there will be no breakage in the APIs of the libraries under the ```androidx.*``` package. This means that although the package names on the imports will change, the name of the classes and their method signatures will remain unchanged, so just changing the imports will be enough for refactoring to androidx. That being said, this refactoring will be no small feat.

This refactoring will be all or nothing. You cannot change just a class to the new package and see how it works with the others, it must be done in one go for all the classes, so if your app consists of a lot of classes, brace yourself for a huge merge. Fortunately, there is an extensive [mapping](https://developer.android.com/jetpack/androidx/migrate) between the classes of the old and the new package. Even better, the version 3.2 of the Android Studio comes with a feature that enables you to automatically refactor all the classes. All you have to do is select ```Refactor > Migrate to AndroidX``` and voilà, after a couple of minutes, you will have already migrated to AndroidX.

This will change every class that depends on the old package to the new, with one more catch. The ```gradle.properties``` file will be changed as well, and there will be added to options:

```
android.useAndroidX=true
android.enableJetifier=true
```

The first option enables you to use the AndroidX package and the second migrates any external dependencies the new namespace.

# Lessons learned(?)
Of course, someone would be fooled to think that such a big migration that occurs in one go would be that easy to perform.

## 1. Beware of your dependencies(and the dependencies of your dependencies)
