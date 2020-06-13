# AdMob capacitor plugin

Based on [capacitor-admob](https://github.com/rahadur/capacitor-admob) plugin.

## Config

```json
{
    "plugins": {
        "AdMob":{
            "appId": "YOUR_APP_ID",
            "testDevices": []
        }
    }
}
``` 


## iOS

### Update **Info.plist**

Open your **App/App/Info.plist** file and add Google AdMob application identifier:

```plist
<key>GADApplicationIdentifier</key>
<string>ca-app-pub-0000000000000000~0000000000</string>
```

## Android

### Update Manifest

Open your **android/app/src/Android/AndroidManifest.xml** file and add `<meta-data>` with your App ID to `<application>` children:

```xml
<application>
  <meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID" 
    android:value="ca-app-pub-0000000000000000~0000000000" />
</application>
```

### Register AdMob to Capacitor Android

Open your Ionic Capacitor App in Android Studio, Now open **MainActivity.java** of your app and Register AdMob to Capacitor Plugins.

```java
//....
import highduck.capacitor.admob.AdMob;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    this.init(savedInstanceState, new ArrayList<Class<? extends Plugin>>() {{
      add(AdMob.class);
    }});
  }
}
```
