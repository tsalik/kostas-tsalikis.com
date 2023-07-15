---
title: "Testing LazyColumn in Compose"
date: 2023-07-09T09:00:00+03:00
draft: true
description: "A quick guide on how to test LazyColumns with Espresso"
---

In this post, we will explore how to test the population of items in Jetpack Compose's `LazyColumn`. Additionally, we will explore the Semantics tree and its importance in accessibility and testing. Finally, we will examine adding custom semantics to a `Composable`. You can find the [source code here](https://github.com/tsalik/JetpackComposeLazyColumnTesting).


## Getting started
For the sake of our example, we will build a screen that contains the details of a run. The screen looks like this:

{{< caption image="/images/posts/lazycolumn_espresso/run_breakdown.png" alt="An Android screen showing the details of a run" caption="The run details screen" >}}

The implementation of the screen is the following:
```kotlin
@Composable
fun RunDetailsScreen(records: List<RunRecord>, modifier: Modifier = Modifier) {
    Column(modifier = modifier.fillMaxSize()) {
        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(16.dp)) {
            Column(modifier = Modifier.weight(0.33f), horizontalAlignment = Alignment.Start) {
                Text(text = "10.01", style = Typography.titleLarge)
                Text(text = "Distance (km)", style = Typography.labelSmall)
            }
            Column(
                modifier = Modifier.weight(0.33f),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(text = "01:17:15", style = Typography.titleLarge)
                Text(text = "Duration", style = Typography.labelSmall)
            }
            Column(modifier = Modifier.weight(0.33f), horizontalAlignment = Alignment.End) {
                Text(text = "996", style = Typography.titleLarge)
                Text(text = "Calories", style = Typography.labelSmall)
            }
        }
        Spacer(modifier = Modifier.height(4.dp))
        Divider()
        Spacer(modifier = Modifier.height(4.dp))
        LazyColumn(
            modifier = modifier
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(records) { record ->
                Column {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            painter = painterResource(id = record.icon),
                            contentDescription = null,
                            modifier = Modifier.size(32.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = record.title,
                            modifier = Modifier
                                .weight(.8f),
                            style = Typography.titleMedium
                        )
                        Text(
                            text = record.record,
                            style = Typography.titleMedium
                        )
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Divider()
                }
            }
        }
    }
}

data class RunRecord(
    @DrawableRes val icon: Int,
    val title: String,
    val record: String
)
```

In our first test, we will verify that the title of the first record appears. We must assert that the `LazyColumn` contains an item with a specific text. To do so, add a `testTag` on the `LazyColumn` and scroll to the item containing that text:

```kotlin
       LazyColumn(
            modifier = modifier
                .padding(16.dp)
                .testTag(RunDetailsTestTags.records), // <-Add the test tag on the Modifier 
        ) {
           ..
       }
```
And then our first test:

```kotlin
@RunWith(AndroidJUnit4::class)
class RunDetailsUiTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun should_populate_records_properly() {
        composeTestRule.setContent {
            RunAppTheme {
                RunDetailsScreen(
                    records = listOf(
                        RunRecord(
                            icon = R.drawable.ic_average_pace,
                            title = "Avg. Pace",
                            record = "07:42 min/km"
                        ),
                        RunRecord(
                            icon = R.drawable.ic_speed,
                            title = "Avg. Speed",
                            record = "7.8 km/h"
                        ),
                    )
                )
            }
        }

        composeTestRule.onNodeWithTag(RunDetailsTestTags.records)
            .performScrollToNode(hasText("Avg. Pace")) // <- Scroll to the node containing the appropriate text
            .assertIsDisplayed() // <- Assert that it is displayed
    }
}
```

The test passes! Next, we should assert that the record has the proper value! But how do we do that? We may try and scroll to the item containing the appropriate text. 

```kotlin
    @Test
    fun should_populate_records_properly() {
        ...

        composeTestRule.onNodeWithTag(RunDetailsTestTags.records)
            .performScrollToNode(hasText("Avg. Pace"))
            .performScrollToNode(hasText("07:42 min/km")) // <- Assert that the item's record has the proper value.
            .assertIsDisplayed()
    }
```

The test passes again! How sure are we that we are performing the proper assertion? The test should fail if we check that the text contains the second item's record. Unfortunately, this action scrolls to the second item, where the second record value is displayed. We need to perform the assertion on the same node that we have scrolled, not scroll to the second one. How do we do this check?

## The Semantic tree

To make further assertions on the whole item which contains the run record, we need to understand the UI hierarchy. According to the [Semantics tree documentation](https://developer.android.com/jetpack/compose/semantics):

> This tree describes your UI in an alternative manner that is understandable for [Accessibility](https://developer.android.com/jetpack/compose/accessibility) services and for the [Testing](https://developer.android.com/jetpack/compose/testing) framework.

Let's print the semantic tree to understand our situation better:

```kotlin
    @Test
    fun should_populate_records_properly() {
        ...

        composeTestRule.onNodeWithTag(RunDetailsTestTags.records)
            .printToLog(RunDetailsTestTags.records) // <- Print the LazyColumn's semantic tree

        composeTestRule.onNodeWithTag(RunDetailsTestTags.records)
            .performScrollToNode(hasText("Avg. Pace"))
            .assertIsDisplayed()
    }
```

The test's logs should contain the following:
```txt
printToLog:
Printing with useUnmergedTree = 'false'
Node #16 at (l=42.0, t=330.0, r=1038.0, b=567.0)px, Tag: 'records'
VerticalScrollAxisRange = 'ScrollAxisRange(value=0.0, maxValue=0.0, reverseScrolling=false)'
CollectionInfo = 'androidx.compose.ui.semantics.CollectionInfo@478a650'
Actions = [IndexForKey, ScrollBy, ScrollToIndex]
 |-Node #22 at (l=147.0, t=344.0, r=767.0, b=401.0)px
 | Text = '[Avg. Pace]'
 | Actions = [GetTextLayoutResult]
 |-Node #23 at (l=767.0, t=344.0, r=1038.0, b=401.0)px
 | Text = '[07:42 min/km]'
 | Actions = [GetTextLayoutResult]
 |-Node #31 at (l=147.0, t=473.0, r=864.0, b=530.0)px
 | Text = '[Avg. Speed]'
 | Actions = [GetTextLayoutResult]
 |-Node #32 at (l=864.0, t=473.0, r=1038.0, b=530.0)px
   Text = '[7.8 km/h]'
   Actions = [GetTextLayoutResult]
```

We see that all `Text`s are siblings, with the `LazyColumn` being the common parent! Let's add a test tag to each `LazyColumn` item and then print again its semantic tree:

```kotlin
items(records) { record ->
    Column(modifier = Modifier.testTag(RunDetailsTestTags.recordRow)) { // <- Add a test tag on the parent item of the LazyColumn
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(
                painter = painterResource(id = record.icon),
                contentDescription = null,
                modifier = Modifier.size(32.dp)
            )
            ...
         }
     }
}
```

To our surprise, we can see that the semantic tree has changed:
```txt
Node #16 at (l=42.0, t=330.0, r=1038.0, b=567.0)px, Tag: 'records'
VerticalScrollAxisRange = 'ScrollAxisRange(value=0.0, maxValue=0.0, reverseScrolling=false)'
CollectionInfo = 'androidx.compose.ui.semantics.CollectionInfo@478a650'
Actions = [IndexForKey, ScrollBy, ScrollToIndex]
 |-Node #18 at (l=42.0, t=330.0, r=1038.0, b=438.0)px, Tag: 'recordRow'
 |  |-Node #22 at (l=147.0, t=344.0, r=767.0, b=401.0)px
 |  | Text = '[Avg. Pace]'
 |  | Actions = [GetTextLayoutResult]
 |  |-Node #23 at (l=767.0, t=344.0, r=1038.0, b=401.0)px
 |    Text = '[07:42 min/km]'
 |    Actions = [GetTextLayoutResult]
 |-Node #27 at (l=42.0, t=459.0, r=1038.0, b=567.0)px, Tag: 'recordRow'
    |-Node #31 at (l=147.0, t=473.0, r=864.0, b=530.0)px
    | Text = '[Avg. Speed]'
    | Actions = [GetTextLayoutResult]
    |-Node #32 at (l=864.0, t=473.0, r=1038.0, b=530.0)px
      Text = '[7.8 km/h]'
      Actions = [GetTextLayoutResult]
```

We can now safely assert that the text values are populated as they should. Furthermore, we can add test tags to each text to verify that we populate each `Text` with the appropriate value. The implementation now looks like this:
```kotlin
Text(
    text = record.title,
    modifier = Modifier
        .weight(.8f)
        .testTag(RunDetailsTestTags.recordTitle), // <- Add a test tag for the record title
    style = Typography.titleMedium
)
Text(
    text = record.record,
    modifier = Modifier.testTag(RunDetailsTestTags.recordValue), // <- Add a test tag for the record value
    style = Typography.titleMedium
)
```

The UI test assertion should now take into consideration the `testTag` for each `Text`:
```kotlin
composeTestRule.onNodeWithTag(RunDetailsTestTags.records)
    .performScrollToNode(
        (hasText("Avg. Pace") and hasTestTag(RunDetailsTestTags.recordTitle)) // <- check the value and the test tag simultaneously
            and hasAnySibling(hasText("07:42 min/km") and hasTestTag(RunDetailsTestTags.recordValue))) // <- perform the same check for the other Text
    .assertIsDisplayed()
```

## Adding custom semantics to a node
So far we have verified that the right `Text` element contain the proper value. What if we needed to assert that the right image is set as well? We could do so by using the `hasContentDescription()` method, but we don't need to add a content description on these images as their role is cosmetic and that wouldn't help with checking that we set the proper drawable.

The proper way to verify the drawable resource is to add a new semantic:
```kotlin
val DrawableId = SemanticsPropertyKey<Int>("DrawableResId") // <- Create a new Semantics property named DrawableResId which should hold an Int value
var SemanticsPropertyReceiver.drawableId by DrawableId // <- Create a delegate to add the new property on the semantics Modifier
```
And add the semantic on the `Icon`:
```kotlin
Icon(
    painter = painterResource(id = record.icon),
    contentDescription = null,
    modifier = Modifier
        .size(32.dp)
        .semantics {
            drawableId = record.icon // <- Add the new Semantics property to the Icon
        }
)
```

We should now update the test to check for the new semantic:
```kotlin
fun hasDrawable(@DrawableRes id: Int): SemanticsMatcher =
    SemanticsMatcher.expectValue(DrawableId, id)

@Test {
    ...
    composeTestRule.onNodeWithTag(RunDetailsTestTags.records)
        .performScrollToNode(
            (hasText("Avg. Pace") and hasTestTag(RunDetailsTestTags.recordTitle))
                    and hasAnySibling(hasText("07:42 min/km") and hasTestTag(RunDetailsTestTags.recordValue))
                    and hasAnySibling(hasDrawable(R.drawable.ic_average_pace)) // <- Check that the Icon has the proper drawable resource
        )
        .assertIsDisplayed()
}
```

The semantic tree now includes the new `DrawableResId` semantic that we created:
```txt
Node #16 at (l=42.0, t=330.0, r=1038.0, b=567.0)px, Tag: 'records'
VerticalScrollAxisRange = 'ScrollAxisRange(value=0.0, maxValue=0.0, reverseScrolling=false)'
CollectionInfo = 'androidx.compose.ui.semantics.CollectionInfo@beb6049'
Actions = [IndexForKey, ScrollBy, ScrollToIndex]
 |-Node #18 at (l=42.0, t=330.0, r=1038.0, b=438.0)px, Tag: 'recordRow'
 |  |-Node #20 at (l=42.0, t=330.0, r=126.0, b=414.0)px
 |  | DrawableResId = '2130968577'
 |  |-Node #22 at (l=147.0, t=344.0, r=767.0, b=401.0)px, Tag: 'recordTitle'
 |  | Text = '[Avg. Pace]'
 |  | Actions = [GetTextLayoutResult]
 |  |-Node #23 at (l=767.0, t=344.0, r=1038.0, b=401.0)px, Tag: 'recordValue'
 |    Text = '[07:42 min/km]'
 |    Actions = [GetTextLayoutResult]
 |-Node #27 at (l=42.0, t=459.0, r=1038.0, b=567.0)px, Tag: 'recordRow'
    |-Node #29 at (l=42.0, t=459.0, r=126.0, b=543.0)px
    | DrawableResId = '2130968589'
    |-Node #31 at (l=147.0, t=473.0, r=864.0, b=530.0)px, Tag: 'recordTitle'
    | Text = '[Avg. Speed]'
    | Actions = [GetTextLayoutResult]
    |-Node #32 at (l=864.0, t=473.0, r=1038.0, b=530.0)px, Tag: 'recordValue'
      Text = '[7.8 km/h]'
      Actions = [GetTextLayoutResult]
```

A simpler alternative would be to set the `testTag` to the resource drawable, but in this instance, I wanted to highlight how we can create custom semantics, how to use them in tests, and how they affect the semantic tree.

## How accessibility affects the semantic tree

We should always have accessibility in our minds when building apps. If we turned on Talkback, we would be surprised to listen to how it announces one by one each element. A better experience would be to announce the title and value of the records together. To do so we need to merge the descendants of the `Row` containing the records:
```kotlin
items(records) { record ->
    Column(modifier = Modifier.testTag(RunDetailsTestTags.recordRow)) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.semantics(mergeDescendants = true) {}) { // <- Merge descendants for a better accessibility experience
            ...
        }
        ...
    }
}
```
We would expect that these changes shouldn't break tests. Unfortunately, that's not the case. Taking a look at the semantic tree will help us understand the situation:
```txt
printToLog:
Printing with useUnmergedTree = 'false'
Node #16 at (l=42.0, t=330.0, r=1038.0, b=567.0)px, Tag: 'records'
VerticalScrollAxisRange = 'ScrollAxisRange(value=0.0, maxValue=0.0, reverseScrolling=false)'
CollectionInfo = 'androidx.compose.ui.semantics.CollectionInfo@bac7aa5'
Actions = [IndexForKey, ScrollBy, ScrollToIndex]
 |-Node #18 at (l=42.0, t=330.0, r=1038.0, b=438.0)px, Tag: 'recordRow'
 |  |-Node #19 at (l=42.0, t=330.0, r=1038.0, b=414.0)px
 |    DrawableResId = '2130968577'
 |    Text = '[Avg. Pace, 07:42 min/km]'
 |    Actions = [GetTextLayoutResult]
 |    MergeDescendants = 'true'
 |-Node #27 at (l=42.0, t=459.0, r=1038.0, b=567.0)px, Tag: 'recordRow'
    |-Node #28 at (l=42.0, t=459.0, r=1038.0, b=543.0)px
      DrawableResId = '2130968589'
      Text = '[Avg. Speed, 7.8 km/h]'
      Actions = [GetTextLayoutResult]
      MergeDescendants = 'true'
```
We see that the individual nodes have disappeared, as we have added `semantics(mergeDescendants = true)` on each `Row`. In the process of making a better accessibility experience, we broke our tests! No need to panic though - the fix is easy. 

We need to instruct our tests not to take into consideration the merging of all the descendant nodes:
```kotlin
composeTestRule.onNodeWithTag(RunDetailsTestTags.records, useUnmergedTree = true) // <- useUnmergedTree will bypass the merging of the descendants
            .performScrollToNode(
            ...
            )
```
Indeed if we print the semantics tree with `useUnmergedTree = true`, it will show again as previously:
```txt
printToLog:
Printing with useUnmergedTree = 'true'
Node #16 at (l=42.0, t=330.0, r=1038.0, b=567.0)px, Tag: 'records'
VerticalScrollAxisRange = 'ScrollAxisRange(value=0.0, maxValue=0.0, reverseScrolling=false)'
CollectionInfo = 'androidx.compose.ui.semantics.CollectionInfo@bac7aa5'
Actions = [IndexForKey, ScrollBy, ScrollToIndex]
 |-Node #18 at (l=42.0, t=330.0, r=1038.0, b=438.0)px, Tag: 'recordRow'
 |  |-Node #19 at (l=42.0, t=330.0, r=1038.0, b=414.0)px
 |    MergeDescendants = 'true'
 |     |-Node #20 at (l=42.0, t=330.0, r=126.0, b=414.0)px
 |     | DrawableResId = '2130968577'
 |     |-Node #22 at (l=147.0, t=344.0, r=767.0, b=401.0)px, Tag: 'recordTitle'
 |     | Text = '[Avg. Pace]'
 |     | Actions = [GetTextLayoutResult]
 |     |-Node #23 at (l=767.0, t=344.0, r=1038.0, b=401.0)px, Tag: 'recordValue'
 |       Text = '[07:42 min/km]'
 |       Actions = [GetTextLayoutResult]
 |-Node #27 at (l=42.0, t=459.0, r=1038.0, b=567.0)px, Tag: 'recordRow'
    |-Node #28 at (l=42.0, t=459.0, r=1038.0, b=543.0)px
      MergeDescendants = 'true'
       |-Node #29 at (l=42.0, t=459.0, r=126.0, b=543.0)px
       | DrawableResId = '2130968589'
       |-Node #31 at (l=147.0, t=473.0, r=864.0, b=530.0)px, Tag: 'recordTitle'
       | Text = '[Avg. Speed]'
       | Actions = [GetTextLayoutResult]
       |-Node #32 at (l=864.0, t=473.0, r=1038.0, b=530.0)px, Tag: 'recordValue'
         Text = '[7.8 km/h]'
         Actions = [GetTextLayoutResult]
```

## Summary
* Test the population of items in Jetpack Compose's `LazyColumn` using Espresso by adding test tags, scrolling to specific items, and performing assertions on text values.
* Explore the Semantics tree to make precise assertions on the entire node structure, including text values and custom semantics like drawable resources.
* Consider accessibility implications by understanding the impact of merged descendants in the semantic tree and adjusting tests accordingly.
