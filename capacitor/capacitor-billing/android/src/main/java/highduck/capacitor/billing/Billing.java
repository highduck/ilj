package highduck.capacitor.billing;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

import com.getcapacitor.Config;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.NativePlugin;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;

import org.json.JSONException;

import java.util.List;

@NativePlugin(
        requestCodes = {
                Billing.REQUEST_PURCHASE
        }
)
public class Billing extends Plugin {

    static final int REQUEST_PURCHASE = 10111;

    private static final String TAG = "capacitor.billing";
    private static final String CONFIG_PREFIX = "plugins.Billing.";

    public static final int OK = 0;
    public static final int INVALID_ARGUMENTS = -1;
    public static final int UNABLE_TO_INITIALIZE = -2;
    public static final int BILLING_NOT_INITIALIZED = -3;
    public static final int UNKNOWN_ERROR = -4;
    public static final int USER_CANCELLED = -5;
    public static final int BAD_RESPONSE_FROM_SERVER = -6;
    public static final int VERIFICATION_FAILED = -7;
    public static final int ITEM_UNAVAILABLE = -8;
    public static final int ITEM_ALREADY_OWNED = -9;
    public static final int ITEM_NOT_OWNED = -10;
    public static final int CONSUME_FAILED = -11;

    public static final int PURCHASE_PURCHASED = 0;
    public static final int PURCHASE_CANCELLED = 1;
    public static final int PURCHASE_REFUNDED = 2;

    private IabHelper iabHelper = null;
    private boolean billingInitialized = false;

    private String getBase64EncodedPublicKey() {
        return bridge.getConfig().getString(CONFIG_PREFIX + "play_store_key", "");
    }

    private boolean shouldSkipPurchaseVerification() {
        return bridge.getConfig().getBoolean(CONFIG_PREFIX + "skip_verification", false);
    }

    @Override
    public void load() {
        Context context = this.getActivity();
        String base64EncodedPublicKey = getBase64EncodedPublicKey();
        boolean skipPurchaseVerification = shouldSkipPurchaseVerification();
        if (base64EncodedPublicKey != null) {
            iabHelper = new IabHelper(context, base64EncodedPublicKey);
            iabHelper.setSkipPurchaseVerification(skipPurchaseVerification);
            billingInitialized = false;
        }
        else {
            Log.d(TAG, "Unable to initialize billing");
        }
    }

    @PluginMethod()
    public void initialize(final PluginCall call) {
        if (billingInitialized) {
            Log.d(TAG, "Billing already initialized");
            call.success();
        } else if (iabHelper == null) {
            call.error("Billing cannot be initialized");
        } else {
            iabHelper.startSetup(result -> {
                if (!result.isSuccess()) {
                    call.error("Unable to initialize billing: " + result.toString());
                } else {
                    Log.d(TAG, "Billing initialized");
                    billingInitialized = true;
                    call.success();
                }
            });
        }
    }

    private static JSObject getPurchaseResultInfo(final Purchase purchase) {
        final JSObject result = new JSObject();
        result.put("orderId", purchase.getOrderId());
        result.put("packageName", purchase.getPackageName());
        result.put("productId", purchase.getSku());
        result.put("purchaseTime", purchase.getPurchaseTime());
        result.put("purchaseState", purchase.getPurchaseState());
        result.put("purchaseToken", purchase.getToken());
        result.put("signature", purchase.getSignature());
        result.put("type", purchase.getItemType());
        result.put("receipt", purchase.getOriginalJson());
        return result;
    }

    @PluginMethod()
    public void purchase(final PluginCall call) {
        final boolean subscribe = call.getBoolean("subscribe", false);
        final String sku = call.getString("sku");

        if (iabHelper == null || !billingInitialized) {
            call.error("Billing is not initialized");
            return;
        }
        final Activity activity = this.getActivity();

        IabHelper.OnIabPurchaseFinishedListener oipfl = (result, purchase) -> {
            if (result.isFailure()) {
                final int response = result.getResponse();
                final String errorCode = String.valueOf(response);
                if (response == IabHelper.IABHELPER_BAD_RESPONSE || response == IabHelper.IABHELPER_UNKNOWN_ERROR) {
                    call.reject("Could not complete purchase", errorCode);
                } else if (response == IabHelper.IABHELPER_VERIFICATION_FAILED) {
                    call.reject("Could not complete purchase", errorCode);
                } else if (response == IabHelper.IABHELPER_USER_CANCELLED) {
                    call.reject("Purchase Cancelled", errorCode);
                } else if (response == IabHelper.BILLING_RESPONSE_RESULT_ITEM_ALREADY_OWNED) {
                    call.reject("Item already owned", errorCode);
                } else {
                    call.reject("Error completing purchase", errorCode);
                }
            } else {
                call.success(getPurchaseResultInfo(purchase));
            }
        };

        if (subscribe) {
            iabHelper.launchSubscriptionPurchaseFlow(activity, sku, REQUEST_PURCHASE, oipfl, "");
        } else {
            iabHelper.launchPurchaseFlow(activity, sku, REQUEST_PURCHASE, oipfl, "");
        }
    }

    @PluginMethod()
    public void consumePurchase(final PluginCall call) {
        String type = call.getString("type");
        String receipt = call.getString("receipt");
        String signature = call.getString("signature");
        Purchase purchase;
        try {
            purchase = new Purchase(type, receipt, signature);
        } catch (JSONException e) {
            call.error("invalid json in `receipt` argument", e);
            return;
        }

        if (iabHelper == null || !billingInitialized) {
            call.error("Billing is not initialized");
            return;
        }

        iabHelper.consumeAsync(purchase, (purchase1, result) -> {
            if (result.isFailure()) {
                int response = result.getResponse();
                if (response == IabHelper.BILLING_RESPONSE_RESULT_ITEM_NOT_OWNED) {
                    call.error("Error consuming purchase (ITEM_NOT_OWNED)");
                } else {
                    call.error("Error consuming purchase (CONSUME_FAILED)");
                }
            } else {
                final JSObject pluginResponse = new JSObject();
                pluginResponse.put("transactionId", purchase1.getOrderId());
                pluginResponse.put("productId", purchase1.getSku());
                pluginResponse.put("token", purchase1.getToken());
                call.success(pluginResponse);
            }
        });
    }

    @PluginMethod()
    public void getSkuDetails(final PluginCall call) {
        List<String> skus;
        try {
            skus = call.getArray("skus").<String>toList();
        } catch (JSONException e) {
            call.error("Invalid SKU (INVALID_ARGUMENTS)");
            return;
        }
        if (iabHelper == null || !billingInitialized) {
            call.error("Billing is not initialized");
            return;
        }
        iabHelper.queryInventoryAsync(true, skus, (result, inventory) -> {
            if (result.isFailure()) {
                call.error("Error retrieving SKU details");
                return;
            }
            final JSObject response = new JSObject();
            final JSArray list = new JSArray();
            for (String sku : skus) {
                SkuDetails details = inventory.getSkuDetails(sku);
                if (details != null) {
                    final JSObject detailsJson = new JSObject();
                    detailsJson.put("productId", details.getSku());
                    detailsJson.put("title", details.getTitle());
                    detailsJson.put("description", details.getDescription());
                    detailsJson.put("price", details.getPrice());
                    detailsJson.put("type", details.getType());
                    list.put(detailsJson);
                }
            }
            response.put("list", list);
            call.success(response);
        });
    }

    @PluginMethod()
    public void restorePurchases(final PluginCall call) {
        if (iabHelper == null || !billingInitialized) {
            call.error("Billing is not initialized");
            return;
        }
        iabHelper.queryInventoryAsync((result, inventory) -> {
            if (result.isFailure()) {
                call.error("Error retrieving purchase details");
                return;
            }
            JSObject response = new JSObject();
            JSArray list = new JSArray();
            for (Purchase purchase : inventory.getAllPurchases()) {
                if (purchase != null) {
                    list.put(getPurchaseResultInfo(purchase));
                }
            }
            response.put("purchases", list);
            call.success(response);
        });
    }

    @Override
    protected void handleOnActivityResult(int requestCode, int resultCode, Intent intent) {
        if (!iabHelper.handleActivityResult(requestCode, resultCode, intent)) {
            super.handleOnActivityResult(requestCode, resultCode, intent);
        }
    }

    @Override
    public void handleOnStop() {
        if (iabHelper != null) iabHelper.dispose();
        iabHelper = null;
        billingInitialized = false;
    }
}
