# ilj tools: packager

- Package targets

```
# init capacitor config
cap init --npm-client yarn "I Have To Flap" "i.have.to.flap"
# init private package
yarn init -p
# add android platform
cap add android
```

yarn add @highduck/capacitor-admob --peer
yarn add @highduck/capacitor-billing --peer
yarn add @highduck/capacitor-firebase --peer
yarn add @highduck/capacitor-play-games --peer
    
override template

variables.gradle


add constants to Android Manifest:
```xml
<!-- Google Play Game Services -->
        <meta-data
            android:name="com.google.android.gms.games.APP_ID"
            android:value="@string/app_id" />
        <meta-data
            android:name="com.google.android.gms.version"
            android:value="@integer/google_play_services_version" />

        <!-- AdMob -->
        <meta-data
            android:name="com.google.android.gms.ads.APPLICATION_ID"
            android:value="ca-app-pub-3931267664278058~6628251591" />

<!--    <uses-feature android:glEsVersion="0x00020000" android:required="true" />-->
    <uses-feature android:name="android.software.webview" android:required="true" />

```
