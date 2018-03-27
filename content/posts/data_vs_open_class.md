---
title: "Kotlin data vs open class"
date: 2018-03-18T21:45:19+02:00
draft: true
description: "How Kotlin strongly favors composition over inheritance"
tags: ["Kotlin"]
---

## The Kotlin *data* class

One of the many handy features that the Kotlin language offers, is the *data* keyword. When we declare a class with the *data* keyword, the compiler implements the *equals(Object o)*,*hashCode()* and *toString()* methods, thus saving us from the trouble to do it manually. The [documentation](https://kotlinlang.org/docs/reference/data-classes.html) provides comprehensive examples, and nowadays it has become a widely known language feature, so an example can be left outside of the scope of this post.

## All classes in Kotlin are by default *final*

Another thing that Kotlin does behind the scenes, is to compile every class that you declare as *final*, unless you add the *open* keyword to it. We can see how the language is influenc from *Effective Java 2nd Edition*(Edition 3 is out as well!). More specifically in Item 16 and 17, it is stated respectively:

> Item 16: Favor composition over inheritance

> Item 17: Design and document for inheritance or else prohibit it

## A clash between keyword definitions

This is a very nice feature of the language, as it tries to protect us from the various perils of improper use inheritance, as it is described in the book. Unfortunately, things begin to become messy when you try to declare a class both open and data. The compiler will complain that a data class cannot be at the same time open, giving us an error.

Let's stop for a moment and consider why the architects of the language decided to impose such an obstacle. First of all, we will try to remember some wise words from the *Growing object-oriented systems, driven by tests* book from Steve Freeman and Nat Pryce. Chapter 2 presents a distinction between *values* and *objects*. *Objects* communicate between each other by sending messages and have some specific behavior depending on their state. If their state changes, so does their behavior. On the other hand *values* - to paraphrase - are just bags of data, used for computations.

Now that we have remembered the definition and distinction between *objects* and *values* it makes sense that Kotlin imposes such rules when using the *data* and *open* keywords. A *data* class is a *value*, holding only - preferably immutable -  data without behavior. Since it makes sense to extend a class in order to change its behavior and the *data* class has no behavior, why should we be able to extend it?

Although the reasons for this are quite valid, this makes the transition from Java to Koltin difficult. We may have in our codebase a class that's a perfect candidate to become a data class, but if for some reason this class is extended by another class, you cannot make that transition instantly, as you have to fix first the fact that the class is extended. The problem becomes even worse when we have a deep nested hierarchy.

## Final thoughts

One way to deal with this, is to check if the class has any fields or not. If it doesn't have and it just acts as a marker, we could go and delete that class, trace the compiler errors and replace with the parent class. That is true, provided that child class is not used in any *instanceOf* checks. Then the problem becomes much worse, especially if in the nested *instanceOf* checks is the parent class as well. Here we have a behavioural change in the system which we cannot fix just by replacing the check with the parent class, one that is very difficult to change. The sins of the past have finally caught up with us.

Now let's consider the case where the child class extends the parent just to inherit some or all the fields of the parent and adds its own as well. Then we could try to use some kind of composition depending on the case.

Maybe the nastiest of the problems described above is the *instanceOf* checks. If we could find a way to get past these checks problem, then replacing the children with the parent or passing the parent as a dependency becomes less difficult.

Unfortunately, this post does not provide a final solution, but rather tries to reason with Kotlin's implementation decisions and explore some thoughts on how to tackle the problems that arise during a Java to Kotlin migration.
