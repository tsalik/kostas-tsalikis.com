---
title: "Uploading an Android library on JCenter"
date: 2019-05-21T22:47:02+03:00
tags: [android]
description: "A small overview on how to publish an Android open-source library on a public maven repository"
---

Facing a lack of inspiration for quite some time I decided to draw some from an old project of mine. A couple of years ago I created an open-source library named [`target-layout`](https://github.com/tsalik/target-layout) which was basically a `FrameLayout` that draws a view on its center and some `drawables` around it, letting the user pinch zoom on the view and select through a range of levels.

{{< caption image="/gifs/targetlayout.gif" alt="TargetLayout animation" caption=" Of course a GIF might be the best way to showcase what the library does." >}}


Apart from the joy of creating a custom and unique UI and delving into the depths of how a view is measured, laid-out and drawn I decided to learn how to publish the library on JCenter. Unfortunately, I haven't been the world’s best maintainer, so I left the library targeting old Android SDK versions, without any support for AndroidX. What's more, I had left the project without Continuous Integration (CI from now on) and as the years passed, I forgot how publishing on JCenter works, so I decided to revisit these topics before doing any further work with the library itself.

# Adding CI on your open-source library

The first think I had to do was updating all its outdated dependencies. This meant updating gradle versions along with target and compile Android SDK versions so any new users of the library would be able to compile it with no problems and warnings. Even though I am the maintainer and could push directly to the master branch, I decided to go for a pull request process with myself. Doing so meant that I would emulate the process of someone else trying to use and modify the library, so I needed to add some checks from an external CI server in order to verify that the library actually builds.

Among the most usual CI services that support open-source projects and are Android friendly are [CircleCI](https://circleci.com/) and [TravisCI](https://travis-ci.org/). As I had some previous experience with TravisCI on a toy project, I decided to use TravisCI in order to kick-start the process of making the library modernized. In order to start using TravisCI. First of all, it is needed to create an account or sign in with your GitHub account. After doing so, we can add from the dashboard a git repository and then add a `.travis.yml` file on the root of the repo. The `.travis.yml` is essential as it instructs TravisCI on how to build the project - if TravisCI does not find the `.travis.yml` on the root of the repo it will be unable to build. Below you can find a sample `.travis.yml` for building an Android project:

```yml
language: android
jdk: oraclejdk8

before_cache:
  - rm -f $HOME/.gradle/caches/modules-2/modules-2.lock
  - rm -fr $HOME/.gradle/caches/*/plugin-resolution/

cache:
  directories:
    - $HOME/.gradle/caches/
    - $HOME/.gradle/wrapper/

env:
  global:
    - ANDROID_API=28
    - ANDROID_BUILD_TOOLS=28.0.3

android:
  components:
    - tools
    - platform-tools
    - build-tools-$ANDROID_BUILD_TOOLS
    - android-$ANDROID_API
    - extra-google-m2repository
    - extra-android-m2repository # for design library

licenses:
  - android-sdk-preview-license-.+
  - android-sdk-license-.+
  - google-gdk-license-.+

before_install:
  - mkdir "$ANDROID_HOME/licenses" || true
  - echo -e "\n8933bad161af4178b1185d1a37fbf41ea5269c55" > "$ANDROID_HOME/licenses/android-sdk-license"
  - echo -e "\n84831b9409646a918e30573bab4c9c91346d8abd" > "$ANDROID_HOME/licenses/android-sdk-preview-license"
  - yes | $ANDROID_HOME/tools/bin/sdkmanager "build-tools;24.0.3"
  - chmod +x gradlew

script:
  - "./gradlew :library_module_name:clean :library_module_name:build"
```

## Explaining the .travis.yml

The yml above instructs the CI service to clear the caches before building and exports as environment variables the desired Android API and build tools versions. We then declare which components we will use, along with their licenses. This is something that, in our daily work life, do through Android Studio manually but since we are building on a CI server, we need to do this programmatically. By declaring them this way on the `.travis.yml` we are instructing TravisCI to download the desired components and accept any of
the licenses needed. As there are some problems with accepting the licenses, we additionally instruct to accept the licenses through the `sdkmanager` tool and finally make the `gradlew` file executable in order to let TravisCI execute the gradle scripts for building the project. Finally the `script` section is where the build actually happens. Since we are only interested in building the library module and not the sample that accompanies it, we only clean and build the library module(on the script
with a name exampled as library_module_name)

## Some pain points

We must be sure that we have added the `.travis.yml` on the root of the git directory as otherwise TravisCI will not be able to build. Another pain point is the licenses. Accepting them through the `sdkmanager` solves any persisting problems. Unfortunately I did not find a way to access the lint html report on TravisCI, so I ended up showing any reports as text on the console through the `build.gradle` of the library module.

```gradle

android {
    compileSdkVersion 28
    buildToolsVersion "28.0.3"

    lintOptions {
        textReport true
        abortOnError true
        warningsAsErrors false
    }
    ...
}
```

# Updating gradle versions and moving on AndroidX

At this point we have a build that passes through TravisCI and we are ready to update gradle and Android SDK versions. Fortunately this is done easily through Android Studio since it already gives warnings on the library's `build.gradle` file. Just hitting `Alt+Enter` on the respective versions, updates them automatically and the migration tool for AndroidX works fine as the project does not have any dependencies apart from the Android `appcompat` library - so I didn't have to deal with any of the [problems of the AndroidX migration](/posts/androidx). Now we are ready to create the pull request, see it pass the TravisCI build and safely accept it. What's more we can add the TravisCI build badge in our `README.md` to showcase that the build is passing.

# Uploading on JCenter

Now that the build passes, we are finally ready to upload the library's artifacts on JCenter so everyone will be able to add it as a dependency on their builds. But before uploading anything anywhere, first we need to know what files to actually upload! 

## The maven repository

For our library to be traceable and downloadable we need to upload it on a maven repository. A very good and thorough explanation of what a maven repository is and how it works can be found [here](https://blog.packagecloud.io/eng/2017/03/09/how-does-a-maven-repository-work/#what-is-a-maven-dependency). In a few words, a maven repository is a directory where all the library's executable files are stored and are available to download. The path of the directory is
determined by the library's `.pom` file, which essentially gives the library its name as well and adds any transitive dependencies that it has. The `.pom` file for the `target-layout` library that serves as an example for this post is the following:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.tsalik.targetlayout</groupId>
  <artifactId>targetlayout</artifactId>
  <version>1.0.2</version>
  <packaging>aar</packaging>
  <dependencies>
    <dependency>
      <groupId>androidx.appcompat</groupId>
      <artifactId>appcompat</artifactId>
      <version>1.0.2</version>
      <scope>runtime</scope>
    </dependency>
  </dependencies>
</project>
```

The above means, would anyone like to fetch the library from a maven repository with gradle, they would have to add in the dependencies of their `build.gradle` file the following line:

```gradle
implementation "com.tsalik.targetlayout:targetlayout:1.0.2"
```

Since this is an Android library, it is declared that an `.aar`(named targetlayout-1.0.2.aar more specifically) file should be downloaded, along with the dependencies of the library, which is the `androidx.appcompat:appcompat:1.0.2`. 

Now we know that we need to produce the `.aar` from the code of the library and add it along with a `.pom` file, including any extra resources or javadoc on a maven repository, so next steps should be about building the library and adding any of the
artifacts above on a specific maven repository (in our case we want to eventually upload it on the JCenter repository)

## Let's build and publish locally

First of all, we need to create the artifacts mentioned above on a local repository. To do this we need to know how to publish a maven repository through gradle, which is the de facto tool for building on Android (although alternatives like [Bazel](https://bazel.build/) and [Buck](https://buck.build/) do exist). An extensive documentation on how maven publishing works can be found [here](https://docs.gradle.org/current/userguide/publishing_maven.html)(at the time of writing for the 5.4.1 version of gradle). Although the official gradle documentation describes how publishing works the [bintray plugin documentation](https://github.com/bintray/gradle-bintray-plugin)(version 1.8.4 at the time of writing) is more specific on how to publish specifically in Android and avoid common pitfalls.

Below you can find the example gradle script for publishing the `target-layout` library:

```gradle
apply plugin: 'maven-publish'

task androidJavadocs(type: Javadoc) {
    failOnError = false
    source = android.sourceSets.main.java.srcDirs
    ext.androidJar = "${android.sdkDirectory}/platforms/${android.compileSdkVersion}/android.jar"
    classpath += files(ext.androidJar)
    exclude '**/R.html', '**/R.*.html', '**/index.html'
}

task androidJavadocsJar(type: Jar, dependsOn: androidJavadocs) {
    classifier = 'javadoc'
    from androidJavadocs.destinationDir
}

task androidSourcesJar(type: Jar) {
    classifier = 'sources'
    from android.sourceSets.main.java.srcDirs
}

project.afterEvaluate {
    publishing {
        publications {
            targetlayout(MavenPublication) {
                groupId project.ext.PUBLISH_GROUP_ID
                artifactId project.ext.PUBLISH_ARTIFACT_ID
                version project.ext.PUBLISH_VERSION

                artifact bundleReleaseAar
                artifact androidJavadocsJar
                artifact androidSourcesJar

                pom.withXml {
                    final dependenciesNode = asNode().appendNode('dependencies')

                    ext.addDependency = { Dependency dep, String scope ->
                        if (dep.group == null || dep.version == null || dep.name == null || dep.name == "unspecified")
                            return // ignore invalid dependencies

                        final dependencyNode = dependenciesNode.appendNode('dependency')
                        dependencyNode.appendNode('groupId', dep.group)
                        dependencyNode.appendNode('artifactId', dep.name)
                        dependencyNode.appendNode('version', dep.version)
                        dependencyNode.appendNode('scope', scope)

                        if (!dep.transitive) {
                            // If this dependency is transitive, we should force exclude all its dependencies them from the POM
                            final exclusionNode = dependencyNode.appendNode('exclusions').appendNode('exclusion')
                            exclusionNode.appendNode('groupId', '*')
                            exclusionNode.appendNode('artifactId', '*')
                        } else if (!dep.properties.excludeRules.empty) {
                            // Otherwise add specified exclude rules
                            final exclusionNode = dependencyNode.appendNode('exclusions').appendNode('exclusion')
                            dep.properties.excludeRules.each { ExcludeRule rule ->
                                exclusionNode.appendNode('groupId', rule.group ?: '*')
                                exclusionNode.appendNode('artifactId', rule.module ?: '*')
                            }
                        }
                    }

                    // List all "compile" dependencies (for old Gradle)
                    configurations.compile.getDependencies().each { dep -> addDependency(dep, "compile") }
                    // List all "api" dependencies (for new Gradle) as "compile" dependencies
                    configurations.api.getDependencies().each { dep -> addDependency(dep, "compile") }
                    // List all "implementation" dependencies (for new Gradle) as "runtime" dependencies
                    configurations.implementation.getDependencies().each { dep -> addDependency(dep, "runtime") }
                }
            }
        }

        repositories {
            maven {
                // change to point to your repo, e.g. http://my.org/repo
                url = "$buildDir/repo"
            }
        }
}
```

Although it seems daunting, let's try to dissect it. First of all, we declare our own tasks for generating Javadoc and Android resources on their respective jars. The `publishing` and `publication` closures are from the `maven-publish` plugin, which we must apply on top of the script. Inside the `publication` closure we declare a maven publication named `targetlayout` - named after the library (for your own library you must apply an appropriate name). 

Continuing inside the `publication` closure, we apply the `groupdId`, `artifactId` and `version` in order to name the library appropriately. The values on the example above are set as extra project properties on the `build.gradle` file of the library's module so that we can reference them in one single point. Then we declare which artifacts (i.e. files) we need the publication to have. We want the `.aar` for the release build, as well as the Javadoc and any extra resources as
jars (we do so by calling the tasks we declared above).

Finally, we manually add all the dependencies of the library for `compile`, `api` and `implementation` configurations, as otherwise it will not be done automatically (the bintray-gradle-plugin explains nicely why).

In order to check if all this configuration for the publication works, we can add the `repositories` closure and publish on a local directory (in this case a directory named repo under the library module's build folder). Now in order to test that everything is fine we can execute:

```shell
./gradlew clean :targetlayout:publish
```

and we should be able to check that all the artifacts(aar, javadoc, pom files) have been published on the build folder and the pom has the right `groupId`, `artifactId` and `version`.

## So where should we upload then?

Now that we have seen how a publication works and what files it contains, we are ready to finally upload the library on a maven repository other than the local one that we created. Among the various public maven repositories that exist, the more popular ones for Android development are Maven Central, JCenter and JitPack. A comparison between them is out of the scope of this post and since I had already uploaded the library on JCenter, we will focus only on uploading there. Fortunately,
there already exists a gradle plugin for uploading on JCenter so there will be no need to re-invent the wheel. 

In order to install the bintray gradle plugin, we apply the `classpath 'com.jfrog.bintray.gradle:gradle-bintray-plugin:1.8.4'` on the dependencies of the top `build.gradle` of the project and then apply it on the same script declared above(which is responsible for publishing).

```gradle
apply plugin: 'maven-publish'
apply plugin: 'com.jfrog.bintray'

...
project.afterEvaluate {
    publishing {
        publications {
            targetlayout(MavenPublication) {
                ...
            }
        }
    }

    bintray {
            Properties localProperties = new Properties()
            if (project.rootProject.file('local.properties').exists()) {
                localProperties.load(project.rootProject.file('local.properties').newDataInputStream())
            }
            user = localProperties.getProperty("bintray.user")
            key = localProperties.getProperty("bintray.apikey")
            pkg {
                repo = 'target-layout'
                name = 'target-layout'
                licenses = ['MIT']
                vcsUrl = 'https://github.com/tsalik/target-layout.git'
                version {
                    name = "1.0.2"
                    released = new Date()
                }
            }
            publications = ['targetlayout']
        }
}
```

There are a couple of things to notice here. First of all, we must have already been singed in JCenter and created a maven repository. I will leave this part out and provide references on how to do it. You can check that the repository and the name of the library have the same name - `target-layout`. This is not something mandatory, it just happened at the time I was creating the repository.

In order to be able to upload the artifact of the publishing, we must somehow authorize ourselves with bintray. The `user` and `key` fields just do that - but be aware. We **MUST NOT** add these values on version control as everyone could check these values and upload anything, they want on your maven repository. We can add them as environment variables if we publish and upload through the CI server, or add them on `local.properties`(which **MUST** be on the `.gitignore`). 

If you decide to inject them through the `local.properties`, make sure that you check that the file exists - in a CI server it will not and the build will fail.

Note that although I have declared the version as an external property, instead of referencing it I have hardcoded it. I'm sure on the future there will be some frustration with my past self unless I fix it soon 😅.

Finally, after adding any required metadata, we declare which publications we want to upload. This must be the same value with the name that we declared on the publishing section. At last we are ready to publish the library from the command-line:

```bash
./gradlew clean :targetlayout:bintrayUpload
```

# Final thoughts

Ultimately revisiting how to add CI on an open-source project and automating its publishing process proved to be a good exercise. Apart from the frustration of some (a lot) broken builds due to misconfigurations on the `travis.yml` for setting up CI it was an overall enjoyable ride. Having to deal with how a publication works, clarified a lot of things on how maven works and highlighted that creating a publication with its artifacts and uploading it on a public maven repo
are actually two different and partially unrelated things.

Just publishing locally would have been enough as I would be able to manually upload the artifacts as I did in the past, but this time instead of being dependent on someone else's ready-made solution, I decided to actually check out how to do this without the help of a third-party plugin. After all, the lesser the plugins the lesser the pain of building a library or app. The bintray plugin was indeed invaluable as it made easy the upload part of publishing the library.

# Next Steps

Now that the library is updated with the latest gradle and Android SDK versions I can investigate more thoroughly some lint checks and maybe consider adding some animations when the layout first attaches on the window. It is amazing that what used to be on the brink of deprecation now has a new spark and gave inspiration to investigate a variety of things. Another step for future work is to add gpg signing and push the library on Maven Central as well.

# References

Although there are a lot of posts that cover the publication that have far more detail on how to setup your TravisCI account and how to create an account and the repository on [JCenter](https://bintray.com/bintray/jcenter) I decided to cover more in depth on how a publication works on a maven repository.

What's more, most of the posts used other gradle plugins for the publishing part on top of gradle's `maven-plugin` and since the scope of the exercise was to check how it works with minimal dependencies, I decided to depend only on what's vanilla on gradle.

The posts from [Anitaa Murthy](https://medium.com/@anitaa_1990/6-easy-steps-to-upload-your-android-library-to-bintray-jcenter-59e6030c8890), [Yegor Zatsepin](https://medium.com/@yegor_zatsepin/simple-way-to-publish-your-android-library-to-jcenter-d1e145bacf13) and [Wajahat Karim](https://android.jlelse.eu/publishing-your-android-kotlin-or-java-library-to-jcenter-from-android-studio-1b24977fe450) acted as guides for this one, with excellent replication steps on how to set up the repository on JCenter.

*Special thanks to Michalis Kolozoff for proofreading*
