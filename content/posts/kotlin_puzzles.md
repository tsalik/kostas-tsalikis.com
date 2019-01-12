---
title: "Kotlin puzzles"
date: 2019-01-27T22:55:38+02:00
tags: [Kotlin]
description: "Kotlin's API does not always have the same implementation with Java and hasty use of idioms can result in unpleasant surprises"

---
# Some context before the puzzles

One of the books that I've be meaning to finish is _Growing Object-Oriented Guided by Tests_ written by Steve Freeman and Nat Pryce. In their excellent book the authors not only describe how to use tests in order to drive the design of a system but also provide a comprehensive example where they showcase in practice what they preach.

The example is a Swing application which receives and sends events to a XMPP(a publish/subscribe protocol) server and uses some dated testing libraries(Windowlicker for testing the Swing GUI and JMock for testing with mocks). Even though all code is in Java, I decided to minimize the use of Kotlin in order to focus on the techniques the authors provide and added Mockito instead of JMock for testing mocks. Finally, I ended up with a mixed codebase with most parts written in Java, adding some minimal Kotlin flavor in four cases:

1. `data` classes to replace the use of Apache's commons equals/hashcode for creating immutable objects.
2. `sealed` classes instead of `enums`
3. more idiomatic Kotlin features like `map` to replace `for` loops. 
4. computed properties instead of functions inside some Kotlin code.

In general I wanted to avoid extensive use of Kotlin in order to avoid unpleasant surprises and yet surprises happened, particularly in numbers 3 and 4 from the list above.

# Puzzle Number 1: a problem with split

In their example, the authors have a class which parses a CSV like response from the network. The response looks something like this:

```
"Event: PRICE; Price: 100; Increment: 20; Bidder: Someone;"
```

and they parse the response with the snippet of code below:
```Java
    private Map<String, String> unpackEventFrom(Message message) {
        Map<String, String> event = new HashMap<>();
        for (String element : message.getBody().split(";")) {
            String[] pair = element.split(":");
            event.put(pair[0].trim(), pair[1].trim());
        }
        return event;
    }
```

In this snippet, they just split the string first on `;` and then create pairs with splitting `:` finally they put keys and values in a map, pretty straightforward. This kind of code is something that could use some Kotlin flavor, so lets rephrase it:

```Kotlin
    messageBody.split(";")
        .associateTo(auctionEvent.fields) {
                val pair = it.split(":")
                pair[0].trim() to pair[1].trim()
        }
```

The Kotlin snippet splits the message on `;` then creates a pair by splitting on `:` and associates the pair to an empty map(the `auctions.fields` val that is omitted for brevity). The code was written in Java first, the tests passed but a surprise was there when I converter it to Kotlin, and specifically an `IndexOutOfBounds` one! How oh how did this happen? It seems that Kotlin's `split` function has a different implementation than Java. Something that I was not aware of is that
Java's split also has a `limit` parameter, and when calling `split(;)` this actually calls `split(;, 0)`. Koltin does also the same but the difference is how **zero** is interpreted on the two languages.

Quoted directly from Java's documentation:

> If limit is zero then the pattern will be applied as many times as possible, the array can have any length, **and trailing empty strings will be discarded**.

We can see that Java applies an extra meaning to the `limit` parameter. On the contrary, Kotlin let's the user apply only non-negative limits and does not discard the trailing empty spaces, unless you explicitely tell it to do.

The exact equivalent in Kotlin would be something like this:

```Kotlin
    messageBody.split(";")
        .dropLastWhile { it.isEmpty() }
```

Why would Kotlin's creators do something like this? One could argue that Java is the one which is wrong here, since the limit parameter is not only specifying the number of times that a delimiter should apply, but also adds a different meaning that is completely irrelevant and treats zero like a special value. Another nice explanation of why Kotlin's `split` is different from the Java one can be found on [this stackoverflow
answer](https://stackoverflow.com/questions/48697300/difference-between-kotlin-and-java-string-split-with-regex).

# Puzzle Number 2: This is not the (computed) property you're looking for

The snippet with the parsing was from an Event class. The authors of the example decided not to expose the map but instead create methods in order to expose the values of an Event.The `unpack` method from above acted as a Factory Method and initialized the map and the various methods exposed the values of the event. In my Kotlin flavored Event I created a companion object and private constructor to emulate the Factory method and decided to use computed properties. At first I tried something like this:

```Kotlin
    class Event private constructor() {
        
        private val fields = mutableMapOf<String, String>()

        val type = parse("Event")

        private fun parse(key: String) = fields.get(key)!!

        companion object {
            fun from(message: Message): Event {
                val auctionEvent = Event()
                messageBody.split(";")
                    .dropLastWhile { it.isEmpty() }
                    .associateTo(auctionEvent.fields) {
                        val pair = it.split(":")
                        pair[0].trim() to pair[1].trim()
                    }
                return auctionEvent
            }
        }
    }
```

Alas, I could not be more wrong on thinking that the property `type` would actually parse the key from the map after the map was populated with values on the `from` function. Since the Event is created before populating the map, the `type` property will parse immediately the key from the map, and since the map will be empty on construction time, the value will be null and a glorious `kotlin.KotlinNullPointerException` will be thrown, as the parse method gets the key with the not null
`!!` operator. The `type` field seems as a computed property, but it actually is not, it should obviously be declared as below:

```Kotlin
    val type
        get() = parse("Event")
```

Even though this surprise was entirely my own fault it got me thinking that maybe it would be better to eventually declare a function instead of a computed property. The use of computed properties surely is a more idiomatic use of Kotlin, but on the other hand I feel like a property should act as the state of the object and in this example the state of the object is the map and we just expose its values on transformations of the values of
the map, which should be exposed functions. Of course I'm not advocating against the use of computed properties, this is just a rant from a personal failure.

# Final thoughts

As we can see, even when we try to minimize the use of idiomatic Kotlin or just try to port Java code to Kotlin, easy mistakes can be made. Of course this can happen whenever we're trying to learn a new language but porting Java to Kotlin is more devious, as even though the two languages seem to have similar API they can actually differ on their implementation. Caution is needed, but in the example that I presented I happened to be lucky as the use of TDD provided a nice regression
suite that caught my faults immediately - and indeed they were my own faults as I made assumptions on the APIs and idioms without checking Kotlin's documentation first! 
