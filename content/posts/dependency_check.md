---
title: "Scanning vulnerable libraries with Dependency-Check"
date: 2021-01-27T22:30:28+02:00
draft: true
---

write-an-appropriate intro here

## The demo vulnerable app

Let's pretend that we have inherited a legacy app and one of our first priorities is to check what kind of libraries it uses and whether or not they're obsolete or have any security issues. This is what the [sample](https://github.com/tsalik/DependencyCheckExample) emulates, by adding a vulnerable old version of `OkHttp` in a "network" module.

## Adding and running OWASP dependency-check

In order to add dependency-check on a multi-project Android app we need the following in the top level `build.gradle`

```gradle
buildscript {
    repositories {
        mavenCentral()
    }
    dependencies {
        classpath 'org.owasp:dependency-check-gradle:6.1.0'
    }
}

apply plugin: 'org.owasp.dependencycheck'
```

At this point, we can run `./gradlew dependencyCheckAggregate`, which will scan all dependencies on all modules and produce a report on the top level `build/reports/` directory.

## Reading the report

Before deciding whether or not the build should fail based on the results of `dependencyCheckAggregate` it would be better to weed out any false positives or configurations/project that should be skipped. The first report might be too noisy but do not despair! Static analysis tools may be the first offender, and in fact Lint is indeed one of them, but we can skip these configurations since they are not part of the `apk`. 

A row in the report will show a list of the vulnerable dependencies along with its package and version, the id of the vulnerability([CPE](https://nvd.nist.gov/products/cpe) - Common Platform Enumeration), its severity([CVVS](https://nvd.nist.gov/vuln-metrics/cvss) Common Vulnerability Scoring System) and the evidence count and confidence produced by dependency-check that this is indeed a potential vulnerability. By selecting the dependency under the homonymous tab we can see additional details that might be crucial in understanding whether or not any action is needed. 

One of those details might be the *Referenced In Projects/Scopes* section: it shows which gradle configuration and which sub-module has the potential vulnerability. There are times where the vulnerable library is not directly imported on gradle's dependencies, but rather a sub-dependency of the library.
By running `./gradlew sub_module:dependencies` we can quickly identify which of the dependencies needs to be addressed.

## Skipping configurations

As said above, static analysis tools, compilers or other configurations that are not part of the `apk` can be found on the report, so we need to skip them.  By reading the report on the `report-1-nothing-suppressed-or-skipped` tag on the sample(checkout tag and run `./gradlew dependencyCheckAggregate`) we can see on a lot of dependencies' *Referenced in Projects/Scopes* section that their scope is `lintClassPath`(needed by Lint to [load its dependencies](https://android.googlesource.com/platform/tools/base/+/studio-master-dev/lint/libs/lint-gradle-api/README.md)), so we can [skip](https://jeremylong.github.io/DependencyCheck/dependency-check-gradle/configuration.html) this. 

```gradle
buildscript {
    ...

    apply plugin: 'org.owasp.dependencycheck'
    dependencyCheck {
        skipConfigurations = ["lintClassPath"]
    }
}
```

Similarly `kapt` or other configurations may have the same issue but a regex may be better suited(shamelessly taken [from GitHub](https://github.com/jeremylong/dependency-check-gradle/issues/22#issuecomment-575568801)).

```gradle
apply plugin: 'org.owasp.dependencycheck'
dependencyCheck {
    def skipConfigurationPatterns = [
            "_classStructurekapt.*",
            "_internal_aapt2_binary",
            "androidApis",
            "kotlinCompiler.*",
            "lintClassPath"
    ]
    allprojects {
        configurations.all { configuration ->
            if (configuration.name in skipConfigurations) {
                return
            }
            skipConfigurationPatterns.each { pattern ->
                if (configuration.name.matches(pattern)) {
                    skipConfigurations << configuration.name
                }
            }
        }
    }
}
```

## Suppressing false positives

Since it is known that dependency-check may produce false positives, how easy is it to understand if this is the case? After checking out `report-2-lint-skipped` tag and running the tool again, we can still see a lot of occurrences of `Kotlin`'s version 1.4.0 with various scopes(`kotlinCompilerPluginClasspath`, `releaseCompileClasspath`, `releaseRuntimeClasspath` etc.). Investigating the reported
[CVE-2020-15824](https://nvd.nist.gov/vuln/detail/CVE-2020-15824), it's stated that the problem is between versions 1.4-M1 and 1.4-RC, but it's fixed on version 1.4.0, the one that we're using on the sample project! This seems like a potential false positive, so we could check furthermore whether or not this is reported on the [respective issues](https://github.com/jeremylong/DependencyCheck/issues?q=is%3Aissue+is%3Aopen+label%3A%22FP+Report%22) on dependency-check's GitHub page. 

[Evidently](https://github.com/jeremylong/DependencyCheck/issues/2785) this is indeed a false positive, so we can go on and suppress CVE-2020-15824 altogether. In order to suppress a known vulnerability, we must add a corresponding `xml` file and then include it on the configuration of  dependency-check on gradle. On this example we will suppress directly by the CVE id, but there are [a number of ways](https://jeremylong.github.io/DependencyCheck/general/suppression.html) to suppress false positives: 


```xml
<?xml version="1.0" encoding="UTF-8"?>
<suppressions xmlns="https://jeremylong.github.io/DependencyCheck/dependency-suppression.1.3.xsd">
    <suppress>
        <notes><![CDATA[
        This suppresses Kotlin CVE-2020-15824
   ]]></notes>
        <cve>CVE-2020-15824</cve>
    </suppress>
</suppressions>
```


```gradle
buildscript {
    apply plugin: 'org.owasp.dependencycheck'
    dependencyCheck {
        ...
        suppressionFile = 'dependency-check-suppressions.xml'
    }
}
```

## Running on CI

Finally, after suppressing false positives and skipping configurations/projects, we can see that indeed, the only problem remaining is the vulnerable `OkHttp` version and its [CVE-2016-2402](https://nvd.nist.gov/vuln/detail/CVE-2016-2402). Fixing the problem may be as easy as upgrading the version of the library, may need code changes or even moving to another library - and a migration can cost non-trivial amount of time. Assessing the situation depends on the severity and the
circumstances, so everyone will proceed according to theirs. 

Making dependency-check run on CI depends on your CI and gradle configuration, but if we run all tests/checks with `./gradlew check` then we could configure every subproject to add dependency-check as well.

```gradle
subprojects {
    afterEvaluate {
        check.dependsOn dependencyCheckAggregate
    }
}
```
