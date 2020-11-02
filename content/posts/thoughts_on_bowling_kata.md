---
title: "Thoughts on the Bowling Kata"
date: 2020-11-02T22:47:24+02:00
tags: ["TDD"]
draft: true
description: "Practicing TDD and incremental design through the Bowling Kata"
---

{{< figure src="https://images.unsplash.com/photo-1553190920-a9c7432283e6?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1444&q=80"  title="" >}}
Photo by [Jorik Kleen](https://unsplash.com/@jorikkleen?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText) on [Unsplash](https://unsplash.com/s/photos/bowling?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText)


#### TL;DR
Key takeaways from the kata:

1. Every code kata is designed with a specific technique/goal in mind. Keep your focus on the techniques and don't rush.
2. Think before you act and don't be afraid to change your course of actions if the design isn't comfortable to work with.
3. Keep a physical to-do list and pick items from first to last.
4. If a refactoring step feels too large, then it is. Try the simplest thing possible and then refactor in order to achieve incremental design. This is the hard part of the practice. 

## What are code katas?

Code katas are programming exercises where a problem and a set of constraints are described and you have to tackle it by focusing on specific techniques that you need to practice.

There are a lot of resources providing katas like the [Coding Dojo](https://codingdojo.org/) and the [kata-logs](https://kata-log.rocks/index.html). Since I didn't know where to start and didn't have in mind a specific technique other than TDD on my mind, I selected the starter level from kata-logs and started the fist kata - which happened to be the bowling kata. 

## The Bowling Kata

The bowling kata describes the requirements for the 10 pin Bowling game, which are the following(taken from [Ron Jeffries' take on the kata](https://ronjeffries.com/xprog/articles/acsbowling/)):

* Each game has ten turns or "frames"
* In each frame bowlers try to knock down all the pins
* If in two tries they fail the score is the total of the pins they knocked down
* If they knock them all in two tries, it's a "spare", and the next throw is added as bonus on the ten pins
* If they knock them all in one try, it's a "strike", and the next two throws are added as bonus on the ten pins.
* At the last(tenth) frame the bowlers may get one ore two bonus throws in case of strike or spare respectively. The bonus throws are only used to calculate the score of the final frame.

The twist from kata-logs is an added requirement that there must be a `Game` class with two methods, a `roll(int)` and a `score()`.

### Spoiler Alert!

If you intend to practice this kata stop reading and come back to compare approaches and techniques!


## My line of thought

It is important to highlight that the line of thought is very important, possibly more so than the final implementation. What we try to achieve in this kata is the use of TDD with incremental development. We need to articulate in every step what is the direction we think we might go, write the right test and implement the least amount of code possible.

I started by adding the simple case of an "open" frame, meaning that the bowler didn't manage to knock all pins:

```kotlin

class GameTest {

    @Test
    fun `the score is the sum of the rolled pins`() {
        val game = Game()

        game.roll(4)
        game.roll(3)

        assertThat(game.score()).isEqualTo(7)
    }

}
```

and added the implementation by using "Fake it":

```kotlin
class Game {

    fun roll(pins: Int) {

    }

    fun score(): Int {
        return 7
    }

}
```

At that time I thought that the most straightforward would be to keep a sum of the pins as a field, and add every time through the roll method, then return the score on the score method:


```kotlin
class Game {

    private var pins = 0

    fun roll(pins: Int) {
        this.pins += pins
    }

    fun score(): Int {
        return pins
    }

}
```
Next I decided to test and implement the spare:

```kotlin
    @Test
    fun `the score of a spare is the sum of the rolled pins plus the next roll as a bonus`() {
        val game = Game()

        game.roll(6)
        game.roll(4)

        game.roll(8)
        game.roll(1)

        assertThat(game.score()).isEqualTo(27)
    }
```
Here the things started to look interesting. I needed to apply a bonus of 8 on the first frame, so how would I do it? From my post mortem, evidently I didn't choose the simplest thing that would work, comparing with implementation from other people. I decided to add three fields, a `bonus` which would accumulate the bonuses from strikes and spares, a `lastRoll` so I can know if the sum of the last roll and the current gives a spare, and a `spare` so I can know if a spare happened in order to apply the bonus. If this sounds complicated, it's because it is:

```kotlin
class Game {

    private var pins = 0
    var bonus = 0
    private var lastRoll = 0
    private var spare = false

    fun roll(pins: Int) {
        if (spare) {
            bonus += pins
            spare = false
        }
        if (lastRoll + pins == 10) {
            spare = true
        }
        this.lastRoll = pins
        this.pins += pins
    }

    fun score(): Int {
        return pins + bonus
    }

}
```

Instead of discarding the idea of holding a sum or a single field that would know about the spares, strikes and bonuses I decided to push on. In retrospect, I don't think this is a good idea. So, bracing myself to stick to my original thoughts, I introduced a `Frame`, because it felt too much for a Game to hold all the information about spares and strikes.

```kotlin
class Game {

    private var pins = 0
    var bonus = 0
    private var frame = Frame()

    fun roll(pins: Int) {
        bonus += frame.bonus(pins)
        frame.roll(pins)
        this.pins += pins
    }

    fun score(): Int {
        return pins + bonus
    }

    inner class Frame {

        private var lastRoll = 0
        private var spare = false

        fun roll(pins: Int) {
            if (lastRoll + pins == 10) {
                spare = true
            }
            this.lastRoll = pins
        }

        fun bonus(pins: Int): Int {
            if (spare) {
                spare = false
                return pins
            }
            return 0
        }
    }
}
```

If this sounds too much for a single refactoring session, it's because it is and also I left out a step, but even if I included that step, that refactoring would still be too much. It was more because that I knew I was going to need a `Frame` class than the class emerging from the code.

## It only goes worse from here.

Next was the test for the strike:

```kotlin
    @Test
    fun `the score of a strike is the sum of the rolled pins plus the next two rolls as a bonus`() {
        val game = Game()

        game.roll(10)

        game.roll(7)
        game.roll(1)

        assertThat(game.bonus).isEqualTo(8)
        assertThat(game.score()).isEqualTo(26)
    }
```

and it's implementation, at which point the Frame was a standalone class(there was no need to be declared `inner` in the first place:

```kotlin
class Frame {

    private var lastRoll = 0
    private var spare = false
    private var strike = false
    private var strikeBonusAdded = 0

    fun roll(pins: Int) {
        if (pins == 10) {
            strike = true
        } else if (lastRoll + pins == 10) {
            spare = true
        }
        this.lastRoll = pins
    }

    fun bonus(pins: Int): Int {
        if (strike && strikeBonusAdded <= 2) {
            ++strikeBonusAdded
            resetStrike()
            return pins
        } else if (spare) {
            spare = false
            return pins
        }
        return 0
    }

    private fun resetStrike() {
        if (strikeBonusAdded == 2) {
            strike = false
            strikeBonusAdded = 0
        }
    }
}
```

the `Game` class didn't need any change as the bonus was computed by the `Frame`. This worked, until the next tests written for a complete game of 10 frames with edge cases all strikes and all spares:

```kotlin
    @Test
    fun `10 frames of spares of 5 and last 5 has score of 150`() {
        val game = Game()

        for (x in 0..9) {
            game.roll(5)
            game.roll(5)
        }
        game.roll(5)

        assertThat(game.score()).isEqualTo(150)
    }

    @Test
    fun `10 frames of strike has score of 300`() {
        val game = Game()

        for (x in 0..11) {
            game.roll(10)
        }

        assertThat(game.score()).isEqualTo(300)
    }
```
To be fair, these tests were hints from the Coding Dojo description of the kata, so I don't know if I would have added them to begin with. Also, after comparing with Ron Jeffries' implementation, maybe it would be good to add these tests earlier - if not from the start - but I wanted to move from two consecutive frames to a complete game more organically.

Here is were my solution fell completely apart. I didn't think that we would have to compute the bonus for two frames behind(this happens in case of three or more consecutive strikes), so strikes were undervalued, and I didn't know when a frame had finished, so spares where overvalued.

At that time I knew I was in trouble and I didn't know what to do. For starters, I ignored the test, which I would reintroduce until the design was fixed. I knew that I was going to hold multiple frames for the consecutive strikes case, and I would also need to know when a Frame is finished, so I can add a new one on, then probably move all score calculation to the score method. One could think that this was going to give an immediate alert - why are we adding pins and bonuses on the roll when we have a score method.

## Clearing the mess.

First of all, I decided to leave `Game` alone, and see how I can add a way to tell if a `Frame` is finished. If I knew if two throws have been made, or a strike I knew that a frame finished, so I added two extra fields with the throws:

```kotlin
class FrameTest {

    private val frame = Frame()

    @Test
    fun `a frame finishes in two rolls`() {
        val twoRollsFrame = frame.roll(2).roll(3)

        assertThat(twoRollsFrame.finished()).isTrue()
    }

    @Test
    fun `a spare finishes in two rolls`() {
        val spareFrame = frame.roll(4).roll(6)

        assertThat(spareFrame.finished()).isTrue()
    }

    @Test
    fun `a strike finished in one roll`() {
        val strike = frame.roll(10)

        assertThat(strike.finished()).isTrue()
    }

}
```

```kotlin
data class Frame(
    private val firstThrow: Int? = null,
    private val secondThrow: Int? = null
) {

    private var lastRoll = 0
    private var spare = false
    private var strike = false
    private var strikeBonusAdded = 0

    fun roll(pins: Int): Frame {
        if (pins == 10) {
            strike = true
        } else if (lastRoll + pins == 10) {
            spare = true
        }
        this.lastRoll = pins

        return if (firstThrow == null) {
            Frame(firstThrow = pins)
        } else {
            Frame(firstThrow, secondThrow = pins)
        }
    }

    fun bonus(pins: Int): Int {
        if (strike && strikeBonusAdded <= 2) {
            ++strikeBonusAdded
            resetStrike()
            return pins
        } else if (spare) {
            spare = false
            return pins
        }
        return 0
    }

    private fun resetStrike() {
        if (strikeBonusAdded == 2) {
            strike = false
            strikeBonusAdded = 0
        }
    }

    fun finished(): Boolean {
        return if (!strike()) {
            firstThrow != null && secondThrow != null
        } else {
            firstThrow != null
        }
    }

    private fun strike(): Boolean {
        return firstThrow != null && firstThrow == 10
    }

}
```

This change has the added bonus that we don't need to hold a reference for the spare/strike etc. But if I tried to remove them, along with the bonus function, the tests failed!

## Go in for the kill - not really

Now we can store in a list the frames, and since we have all the frames we don't need to do any computation on the `roll` method, we will iterate the list and apply bonus as needed. Below is the final `Game` and `Frame` classes:

```kotlin
class Game {

    val frames = mutableListOf<Frame>()

    fun roll(pins: Int) {
        if (frames.isEmpty() || frames.last().finished()) {
            frames.add(Frame())
        }
        val lastFrame = frames.last()
        frames[frames.lastIndexOf(lastFrame)] = lastFrame.roll(pins)
    }

    fun score(): Int {
        return frames.mapIndexed { index, frame ->
            val pins = frame.pins()
            val shouldApplyBonus = index < 9
            val bonus = if (frame.strike() && shouldApplyBonus) {
                val nextFrame = frames[index + 1]
                if (!nextFrame.strike()) {
                    nextFrame.pins()
                } else {
                    nextFrame.pins() + frames[index + 2].firstRoll()
                }
            } else if (frame.spare() && shouldApplyBonus) {
                val nextFrame = frames[index + 1]
                nextFrame.firstRoll()
            } else {
                0
            }
            pins + bonus
        }.reduce { acc, next -> acc + next }

    }

}

data class Frame(
    private val firstThrow: Int? = null,
    private val secondThrow: Int? = null
) {

    fun roll(pins: Int): Frame {
        return if (firstThrow == null) {
            Frame(firstThrow = pins)
        } else {
            Frame(firstThrow, secondThrow = pins)
        }
    }

    fun finished(): Boolean {
        return if (!strike()) {
            firstThrow != null && secondThrow != null
        } else {
            firstThrow != null
        }
    }

    fun strike(): Boolean {
        return firstThrow != null && firstThrow == 10
    }

    fun spare(): Boolean {
        return (firstThrow != null && secondThrow != null) && pins() == 10
    }

    fun pins(): Int = (firstThrow ?: 0) + (secondThrow ?: 0)

    fun firstRoll() = firstThrow ?: 0

}
```

Finally I performed some cleanup and decided to stop the kata without doing any further refactoring. You can find the code [here](https://github.com/tsalik/Bowling-Kata).

## Takeaways from the kata

So, what did I learn from this exercise? 


1. Every code kata is designed with a specific technique/goal in mind. Keep your focus on the techniques and don't rush.
2. Think before you act and don't be afraid to change your course of actions if the design isn't comfortable to work with.
3. Keep a physical to-do list and pick items from first to last.
4. If a refactoring step feels too large, then it is. Try the simplest thing possible and then refactor in order to achieve incremental design. This is the hard part of the practice. 

Although the domain rules of the problem are fixed, the kata is still a good way to practice incremental design and TDD. I'm a little disappointed with my implementation and with the fact that I completely missed corner cases and some refactoring steps were too big to be called incremental, but this doesn't mean it's a bad outcome, I just have to learn from these mistakes and keep more alert in the future.
