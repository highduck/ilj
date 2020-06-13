# Capacitor plugins

### How to check all

```shell script
export ANDROID_SDK_ROOT=/Users/USER/Library/Android/sdk
yarn foreach:check
```

### Each Plugin build pipeline

#### CI

Until we have no native tools for checking, just clean and build library

#### Local check

- Build Web
- Build Android
- Install and Build iOS

## Android

Add Android SDK path to your environment `ANDROID_SDK_ROOT` variable.

- MacOS: edit your `~/.bash_profile`
 
```shell script
export ANDROID_SDK_ROOT=/Users/USERNAME/Library/Android/sdk
```