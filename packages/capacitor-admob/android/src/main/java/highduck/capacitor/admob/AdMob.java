package highduck.capacitor.admob;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.util.Log;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.RelativeLayout;

import androidx.coordinatorlayout.widget.CoordinatorLayout;

import com.getcapacitor.Config;
import com.getcapacitor.JSObject;
import com.getcapacitor.NativePlugin;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.google.android.gms.ads.AdListener;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.AdSize;
import com.google.android.gms.ads.AdView;
import com.google.android.gms.ads.InterstitialAd;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.RequestConfiguration;
import com.google.android.gms.ads.reward.RewardItem;
import com.google.android.gms.ads.reward.RewardedVideoAd;
import com.google.android.gms.ads.reward.RewardedVideoAdListener;

import java.util.Arrays;

@NativePlugin(
        permissions = {
                Manifest.permission.ACCESS_NETWORK_STATE,
                Manifest.permission.INTERNET
        }
)
public class AdMob extends Plugin {
    private ViewGroup mViewGroup;
    private RelativeLayout mAdViewLayout;
    private AdView mAdView;
    private InterstitialAd mInterstitialAd;
    private RewardedVideoAd mRewardedVideoAd;

    @Override
    public void load() {
        final Config config = bridge.getConfig();
        final String[] testDevices = config.getArray("plugins.AdMob.testDevices", new String[0]);
        final Context context = this.getContext();
        final RequestConfiguration requestConfig = new RequestConfiguration.Builder()
                .setTestDeviceIds(Arrays.asList(testDevices))
                .build();
        MobileAds.setRequestConfiguration(requestConfig);
        MobileAds.initialize(context);
        mViewGroup = (ViewGroup) ((ViewGroup) ((Activity) getActivity()).findViewById(android.R.id.content)).getChildAt(0);
    }

    private static AdSize getAdSize(String adSize) {
        switch (adSize) {
            case "BANNER":
                return AdSize.BANNER;
            case "FLUID":
                return AdSize.FLUID;
            case "FULL_BANNER":
                return AdSize.FULL_BANNER;
            case "LARGE_BANNER":
                return AdSize.LARGE_BANNER;
            case "LEADERBOARD":
                return AdSize.LEADERBOARD;
            case "MEDIUM_RECTANGLE":
                return AdSize.MEDIUM_RECTANGLE;
        }
        return AdSize.SMART_BANNER;
    }

    private static int getAdPosition(String adPosition) {
        switch (adPosition) {
            case "TOP_CENTER":
                return Gravity.TOP;
            case "CENTER":
                return Gravity.CENTER;
        }
        return Gravity.BOTTOM;
    }

    // Show a banner Ad
    @PluginMethod()
    public void showBanner(PluginCall call) {
        /* Dedicated test ad unit ID for Android banners: ca-app-pub-3940256099942544/6300978111*/
        final String adId = call.getString("adId", "ca-app-pub-3940256099942544/6300978111");
        final String adSize = call.getString("adSize", "SMART_BANNER");
        final String adPosition = call.getString("position", "BOTTOM_CENTER");
        final Context context = getContext();
        try {
            // Run AdMob In Main UI Thread
            getActivity().runOnUiThread(() -> {
                if (mAdView == null) {
                    mAdView = new AdView(context);
                    mAdView.setAdUnitId(adId);

                    mAdView.setAdListener(new AdListener() {
                        @Override
                        public void onAdLoaded() {
                            notifyListeners("onAdLoaded", new JSObject().put("value", true));
                            super.onAdLoaded();
                        }

                        @Override
                        public void onAdFailedToLoad(int i) {
                            notifyListeners("onAdFailedToLoad", new JSObject().put("errorCode", i));
                            super.onAdFailedToLoad(i);
                        }

                        @Override
                        public void onAdOpened() {
                            notifyListeners("onAdOpened", new JSObject().put("value", true));
                            super.onAdOpened();
                        }

                        @Override
                        public void onAdClosed() {
                            notifyListeners("onAdClosed", new JSObject().put("value", true));
                            super.onAdClosed();
                        }
                    });
                }
                mAdView.setAdSize(AdMob.getAdSize(adSize));
                // Setup AdView Layout

                mAdViewLayout = new RelativeLayout(getContext());
                mAdViewLayout.setHorizontalGravity(Gravity.CENTER_HORIZONTAL);
                mAdViewLayout.setVerticalGravity(Gravity.BOTTOM);

                final CoordinatorLayout.LayoutParams mAdViewLayoutParams = new CoordinatorLayout.LayoutParams(
                        CoordinatorLayout.LayoutParams.WRAP_CONTENT,
                        CoordinatorLayout.LayoutParams.WRAP_CONTENT
                );

                mAdViewLayoutParams.gravity = AdMob.getAdPosition(adPosition);

                // Remove child from AdViewLayout
                if (mAdView.getParent() != null) {
                    ((ViewGroup) mAdView.getParent()).removeView(mAdView);
                }
                mAdViewLayout.setLayoutParams(mAdViewLayoutParams);
                // Add AdView into AdViewLayout
                mAdViewLayout.addView(mAdView);

                // Add AdViewLayout top of the WebView
                mViewGroup.addView(mAdViewLayout);

                mAdView.loadAd(new AdRequest.Builder().build());
            });

            call.success(new JSObject().put("value", true));

        } catch (Exception ex) {
            call.error(ex.getLocalizedMessage(), ex);
        }
    }

    // Hide the banner, remove it from screen, but can show it later
    @PluginMethod()
    public void hideBanner(PluginCall call) {
        try {
            getActivity().runOnUiThread(() -> {
                if (mAdViewLayout != null) {
                    mAdViewLayout.setVisibility(View.GONE);
                    mAdView.pause();
                }
            });

            call.success(new JSObject().put("value", true));

        } catch (Exception ex) {
            call.error(ex.getLocalizedMessage(), ex);
        }
    }


    // Resume the banner, show it after hide
    @PluginMethod()
    public void resumeBanner(PluginCall call) {
        try {
            getActivity().runOnUiThread(() -> {
                if (mAdViewLayout != null && mAdView != null) {
                    mAdViewLayout.setVisibility(View.VISIBLE);
                    mAdView.resume();
                    Log.d(getLogTag(), "Banner AD Resumed");
                }
            });

            call.success(new JSObject().put("value", true));

        } catch (Exception ex) {
            call.error(ex.getLocalizedMessage(), ex);
        }
    }


    // Destroy the banner, remove it from screen.
    @PluginMethod()
    public void removeBanner(PluginCall call) {
        try {
            getActivity().runOnUiThread(() -> {
                if (mAdView != null) {
                    mViewGroup.removeView(mAdViewLayout);
                    mAdViewLayout.removeView(mAdView);
                    mAdView.destroy();
                    mAdView = null;
                    Log.d(getLogTag(), "Banner AD Removed");
                }
            });
            call.success(new JSObject().put("value", true));
        } catch (Exception ex) {
            call.error(ex.getLocalizedMessage(), ex);
        }
    }

    // Prepare interstitial Ad
    @PluginMethod()
    public void prepareInterstitial(final PluginCall call) {
        final String adId = call.getString("adId", "ca-app-pub-3940256099942544/1033173712");
        try {
            getActivity().runOnUiThread(() -> {
                if (mInterstitialAd == null) {
                    mInterstitialAd = new InterstitialAd(getContext());
                    mInterstitialAd.setAdUnitId(adId);
                    mInterstitialAd.setImmersiveMode(true);

                    mInterstitialAd.setAdListener(new AdListener() {
                        @Override
                        public void onAdLoaded() {
                            // Code to be executed when an ad finishes loading.
                            notifyListeners("onAdLoaded", new JSObject().put("value", true));
                            super.onAdLoaded();
                        }

                        @Override
                        public void onAdFailedToLoad(int errorCode) {
                            // Code to be executed when an ad request fails.
                            notifyListeners("onAdFailedToLoad", new JSObject().put("errorCode", errorCode));
                            super.onAdFailedToLoad(errorCode);
                        }

                        @Override
                        public void onAdOpened() {
                            // Code to be executed when the ad is displayed.
                            notifyListeners("onAdOpened", new JSObject().put("value", true));
                            super.onAdOpened();
                        }

                        @Override
                        public void onAdLeftApplication() {
                            // Code to be executed when the user has left the app.
                            notifyListeners("onAdLeftApplication", new JSObject().put("value", true));
                            super.onAdLeftApplication();
                        }

                        @Override
                        public void onAdClosed() {
                            // Code to be executed when when the interstitial ad is closed.
                            notifyListeners("onAdClosed", new JSObject().put("value", true));
                            super.onAdClosed();
                        }
                    });
                }

                mInterstitialAd.loadAd(new AdRequest.Builder().build());
            });

            call.success(new JSObject().put("value", true));
        } catch (Exception ex) {
            call.error(ex.getLocalizedMessage(), ex);
        }
    }


    // Show interstitial Ad
    @PluginMethod()
    public void showInterstitial(final PluginCall call) {
        try {
            getActivity().runOnUiThread(() -> {
                if (mInterstitialAd != null && mInterstitialAd.isLoaded()) {
                    mInterstitialAd.show();
                }
            });
            call.success(new JSObject().put("value", true));
        } catch (Exception ex) {
            call.error(ex.getLocalizedMessage(), ex);
        }
    }


    // Prepare a RewardVideoAd
    @PluginMethod()
    public void prepareRewardVideoAd(final PluginCall call) {
        final String adId = call.getString("adId", "ca-app-pub-3940256099942544/5224354917");
        final Context context = this.getContext();

        try {
            getActivity().runOnUiThread(() -> {
                if (mRewardedVideoAd == null) {
                    mRewardedVideoAd = MobileAds.getRewardedVideoAdInstance(context);
                    mRewardedVideoAd.setImmersiveMode(true);
                    mRewardedVideoAd.setRewardedVideoAdListener(new RewardedVideoAdListener() {
                        @Override
                        public void onRewardedVideoAdLoaded() {
                            notifyListeners("onRewardedVideoAdLoaded", new JSObject().put("value", true));
                        }

                        @Override
                        public void onRewardedVideoAdOpened() {
                            notifyListeners("onRewardedVideoAdOpened", new JSObject().put("value", true));
                        }

                        @Override
                        public void onRewardedVideoStarted() {
                            notifyListeners("onRewardedVideoStarted", new JSObject().put("value", true));
                        }

                        @Override
                        public void onRewardedVideoAdClosed() {
                            notifyListeners("onRewardedVideoAdClosed", new JSObject().put("value", true));
                        }

                        @Override
                        public void onRewarded(RewardItem rewardItem) {
                            notifyListeners("onRewarded", new JSObject().put("value", true));
                        }

                        @Override
                        public void onRewardedVideoAdLeftApplication() {
                            notifyListeners("onRewardedVideoAdLeftApplication", new JSObject().put("value", true));
                        }

                        @Override
                        public void onRewardedVideoAdFailedToLoad(int i) {
                            notifyListeners("onRewardedVideoAdFailedToLoad", new JSObject().put("error", i));
                        }

                        @Override
                        public void onRewardedVideoCompleted() {
                            notifyListeners("onRewardedVideoCompleted", new JSObject().put("value", true));
                        }
                    });
                }
                mRewardedVideoAd.loadAd(adId, new AdRequest.Builder().build());
            });
            call.success(new JSObject().put("value", true));
        } catch (Exception ex) {
            call.error(ex.getLocalizedMessage(), ex);
        }
    }

    // Show a RewardVideoAd
    @PluginMethod()
    public void showRewardVideoAd(final PluginCall call) {
        try {
            getActivity().runOnUiThread(() -> {
                if (mRewardedVideoAd != null && mRewardedVideoAd.isLoaded()) {
                    mRewardedVideoAd.show();
                }
            });
            call.success(new JSObject().put("value", true));
        } catch (Exception ex) {
            call.error(ex.getLocalizedMessage(), ex);
        }
    }


    // Pause a RewardVideoAd
    @PluginMethod()
    public void pauseRewardedVideo(PluginCall call) {
        try {
            getActivity().runOnUiThread(() -> mRewardedVideoAd.pause(getContext()));
            call.success(new JSObject().put("value", true));
        } catch (Exception ex) {
            call.error(ex.getLocalizedMessage(), ex);
        }
    }


    // Resume a RewardVideoAd
    @PluginMethod()
    public void resumeRewardedVideo(PluginCall call) {
        try {
            getActivity().runOnUiThread(() -> mRewardedVideoAd.resume(getContext()));
            call.success(new JSObject().put("value", true));
        } catch (Exception ex) {
            call.error(ex.getLocalizedMessage(), ex);
        }
    }


    // Destroy a RewardVideoAd
    @PluginMethod()
    public void stopRewardedVideo(PluginCall call) {
        try {
            getActivity().runOnUiThread(() -> mRewardedVideoAd.destroy(getContext()));
            call.success(new JSObject().put("value", true));
        } catch (Exception ex) {
            call.error(ex.getLocalizedMessage(), ex);
        }
    }
}