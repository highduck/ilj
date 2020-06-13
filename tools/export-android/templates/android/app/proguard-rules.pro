# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile

-keep,allowobfuscation @interface com.getcapacitor.NativePlugin,com.getcapacitor.PluginMethod
-keep @com.getcapacitor.NativePlugin class * { *; }
-keepclasseswithmembernames class * {
  @com.getcapacitor.PluginMethod public *;
}
#-keep @com.getcapacitor.NativePlugin class * { *; }
#-keep class com.getcapacitor.** { *; }

# firebase crashlytics reports
-keepattributes SourceFile,LineNumberTable        # Keep file names and line numbers.
-keep public class * extends java.lang.Exception  # Optional: Keep custom exceptions.

# firebase crashlytics faster builds
-keep class com.google.firebase.crashlytics.** { *; }
-dontwarn com.google.firebase.crashlytics.**