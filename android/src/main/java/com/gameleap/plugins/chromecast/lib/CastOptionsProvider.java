package com.gameleap.plugins.chromecast.lib;

import android.content.Context;
import com.google.android.gms.cast.framework.CastOptions;
import com.google.android.gms.cast.framework.OptionsProvider;
import com.google.android.gms.cast.framework.SessionProvider;
import java.util.List;

public final class CastOptionsProvider implements OptionsProvider {

    /** The app id. */
    private static String appId;

    /**
     * Sets the app ID.
     * @param applicationId appId
     */
    public static void setAppId(String applicationId) {
        appId = applicationId;
    }

    @Override
    public CastOptions getCastOptions(Context context) {
        return new CastOptions.Builder().setReceiverApplicationId(appId).build();
    }

    @Override
    public List<SessionProvider> getAdditionalSessionProviders(Context context) {
        return null;
    }
}
