# Billing plugin for Capacitor

Based on [capacitor-admob](https://github.com/rahadur/capacitor-admob) plugin.


## Configuration

```json
{
    "plugins":{
        "Billing": {
            "skip_verification": true,
            "play_store_key": "PUBLIC_BILLING_KEY"
        }
    }
}
```

### Notes

not working: clear test purchases
```shell script
adb shell pm clear com.android.vending
```
