package com.hauxir.plugins.chromecast;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.util.Log;
import androidx.annotation.NonNull;
import androidx.mediarouter.media.MediaRouter;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.cast.CastDevice;
import com.google.android.gms.cast.framework.CastSession;
import com.google.android.gms.cast.framework.Session;
import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.GoogleApiAvailability;
import com.google.android.gms.common.api.ResultCallback;
import com.google.android.gms.common.api.Status;
import java.util.List;
import org.json.JSONException;
import org.json.JSONObject;

@CapacitorPlugin(name = "Chromecast")
public class Chromecast extends Plugin {

    /**
     * Tag for logging.
     */
    private static final String TAG = "Chromecast";
    /**
     * Object to control the connection to the chromecast.
     */
    private ChromecastConnection connection;
    /**
     * Object to control the media.
     */
    private ChromecastSession media;
    /**
     * Holds the reference to the current client initiated scan.
     */
    private ChromecastConnection.ScanCallback clientScan;
    /**
     * Holds the reference to the current client initiated scan callback.
     */
    private PluginCall scanPluginCall;
    /**
     * In the case that chromecast can't be used.
     **/
    private String noChromecastError;

    /**
     * Initialize all of the MediaRouter stuff with the AppId.
     * For now, ignore the autoJoinPolicy and defaultActionPolicy; those will come later
     *
     * @param pluginCall called with .success or .error depending on the result
     * @return true for cordova
     */
    @PluginMethod
    public boolean initialize(final PluginCall pluginCall) {
        String appId = pluginCall.getString("appId");
        Log.d(TAG, "Initialize called with App ID: " + appId);

        if (appId == null || appId.isEmpty()) {
            Log.e(TAG, "App ID is null or empty");
            pluginCall.reject("App ID is required");
            return false;
        }

        Log.d(TAG, "App ID validation passed: " + appId);
        // tab_and_origin_scoped | origin_scoped | page_scoped
        String autoJoinPolicy = pluginCall.getString("autoJoinPolicy");
        // create_session | cast_this_tab
        String defaultActionPolicy = pluginCall.getString("defaultActionPolicy");

        setup();

        try {
            this.connection =
                new ChromecastConnection(
                    getActivity(),
                    new ChromecastConnection.Listener() {
                        @Override
                        public void onSessionStarted(Session session, String sessionId) {
                            try {
                                // Cast to CastSession to get full session info
                                if (session instanceof CastSession) {
                                    CastSession castSession = (CastSession) session;
                                    // Update the media session reference
                                    if (media != null) {
                                        media.setSession(castSession);
                                    }
                                    // Create a full session object like iOS does
                                    JSONObject sessionObject = ChromecastUtilities.createSessionObject(castSession, "connected");
                                    // Fire both SESSION_STARTED and SESSION_UPDATE for compatibility with iOS
                                    sendEvent("SESSION_STARTED", JSObject.fromJSONObject(sessionObject));
                                    sendEvent("SESSION_UPDATE", JSObject.fromJSONObject(sessionObject));
                                    Log.d(TAG, "Session started and connected: " + sessionId);
                                } else {
                                    // Fallback to basic info
                                    JSONObject result = new JSONObject();
                                    result.put("isConnected", session.isConnected());
                                    result.put("sessionId", sessionId);
                                    sendEvent("SESSION_STARTED", JSObject.fromJSONObject(result));
                                }
                            } catch (JSONException e) {
                                Log.e(TAG, "Error creating SESSION_STARTED event", e);
                            }
                        }

                        @Override
                        public void onSessionEnded(Session session, int error) {
                            try {
                                // Cast to CastSession to get full session info
                                if (session instanceof CastSession) {
                                    CastSession castSession = (CastSession) session;
                                    String status = error != 0 ? "error" : "stopped";
                                    JSONObject sessionObject = ChromecastUtilities.createSessionObject(castSession, status);
                                    sendEvent("SESSION_ENDED", JSObject.fromJSONObject(sessionObject));
                                    Log.d(TAG, "Session ended with status: " + status);
                                } else {
                                    // Fallback to basic info
                                    JSONObject result = new JSONObject();
                                    result.put("isConnected", session.isConnected());
                                    result.put("error", error);
                                    sendEvent("SESSION_ENDED", JSObject.fromJSONObject(result));
                                }
                            } catch (JSONException e) {
                                Log.e(TAG, "Error creating SESSION_ENDED event", e);
                            }
                        }

                        @Override
                        public void onSessionEnding(Session session) {}

                        @Override
                        public void onSessionResumeFailed(Session session, int error) {}

                        @Override
                        public void onSessionResumed(Session session, boolean wasSuspended) {
                            try {
                                // Cast to CastSession to get full session info
                                if (session instanceof CastSession) {
                                    CastSession castSession = (CastSession) session;
                                    // Update the media session reference
                                    if (media != null) {
                                        media.setSession(castSession);
                                    }
                                    // Create a full session object like iOS does
                                    JSONObject sessionObject = ChromecastUtilities.createSessionObject(castSession, "connected");
                                    // Fire SESSION_RESUMED and SESSION_LISTENER/SESSION_UPDATE for compatibility
                                    sendEvent("SESSION_RESUMED", JSObject.fromJSONObject(sessionObject));
                                    sendEvent("SESSION_LISTENER", JSObject.fromJSONObject(sessionObject));
                                    Log.d(TAG, "Session resumed: " + castSession.getSessionId());
                                } else {
                                    // Fallback to basic info
                                    JSONObject result = new JSONObject();
                                    result.put("isConnected", session.isConnected());
                                    result.put("wasSuspended", wasSuspended);
                                    sendEvent("SESSION_RESUMED", JSObject.fromJSONObject(result));
                                }
                            } catch (JSONException e) {
                                Log.e(TAG, "Error creating SESSION_RESUMED event", e);
                            }
                        }

                        @Override
                        public void onSessionResuming(Session session, String sessionId) {}

                        @Override
                        public void onSessionStartFailed(Session session, int error) {
                            try {
                                JSONObject result = new JSONObject();
                                result.put("isConnected", session.isConnected());
                                result.put("error", error);
                                sendEvent("SESSION_START_FAILED", JSObject.fromJSONObject(result));
                            } catch (JSONException e) {
                                Log.e(TAG, "Error creating SESSION_START_FAILED event", e);
                            }
                        }

                        @Override
                        public void onSessionStarting(Session session) {}

                        @Override
                        public void onSessionSuspended(Session session, int reason) {}

                        @Override
                        public void onSessionRejoin(JSONObject jsonSession) {
                            try {
                                sendEvent("SESSION_LISTENER", JSObject.fromJSONObject(jsonSession));
                            } catch (JSONException e) {
                                Log.e(TAG, "Error creating SESSION_LISTENER event", e);
                            }
                        }

                        @Override
                        public void onSessionUpdate(JSONObject jsonSession) {
                            try {
                                sendEvent("SESSION_UPDATE", JSObject.fromJSONObject(jsonSession));
                            } catch (JSONException e) {
                                Log.e(TAG, "Error creating SESSION_UPDATE event", e);
                            }
                        }

                        @Override
                        public void onSessionEnd(JSONObject jsonSession) {
                            onSessionUpdate(jsonSession);
                        }

                        @Override
                        public void onReceiverAvailableUpdate(boolean available) {
                            sendEvent("RECEIVER_LISTENER", new JSObject().put("isAvailable", available));
                        }

                        @Override
                        public void onMediaLoaded(JSONObject jsonMedia) {
                            try {
                                sendEvent("MEDIA_LOAD", JSObject.fromJSONObject(jsonMedia));
                            } catch (JSONException e) {
                                Log.e(TAG, "Error creating MEDIA_LOAD event", e);
                            }
                        }

                        @Override
                        public void onMediaUpdate(JSONObject jsonMedia) {
                            try {
                                if (jsonMedia != null) {
                                    sendEvent("MEDIA_UPDATE", JSObject.fromJSONObject(jsonMedia));
                                }
                            } catch (JSONException e) {
                                Log.e(TAG, "Error creating MEDIA_UPDATE event", e);
                            }
                        }

                        @Override
                        public void onMessageReceived(CastDevice device, String namespace, String message) {
                            Log.d(TAG, "onMessageReceived - namespace: " + namespace + ", message: " + message);
                            sendEvent("RECEIVER_MESSAGE", new JSObject().put("namespace", namespace).put("message", message));
                        }
                    }
                );
            this.media = connection.getChromecastSession();
        } catch (RuntimeException e) {
            Log.e(TAG, "Error initializing Chromecast connection: " + e.getMessage());
            noChromecastError = "Could not initialize chromecast: " + e.getMessage();
            e.printStackTrace();
        }

        connection.initialize(appId, pluginCall);
        return true;
    }

    /**
     * Request the session for the previously sent appId.
     * THIS IS WHAT LAUNCHES THE CHROMECAST PICKER
     * or, if we already have a session launch the connection options
     * dialog which will have the option to stop casting at minimum.
     *
     * @param pluginCall called with .success or .error depending on the result
     * @return true for capacitor
     */
    @PluginMethod
    public boolean requestSession(final PluginCall pluginCall) {
        connection.requestSession(
            new ChromecastConnection.RequestSessionCallback() {
                @Override
                public void onJoin(JSONObject jsonSession) {
                    try {
                        pluginCall.resolve(JSObject.fromJSONObject(jsonSession));
                    } catch (JSONException e) {
                        Log.e(TAG, "Error parsing session JSON", e);
                        pluginCall.reject("session_parse_error", e.getMessage());
                    }
                }

                @Override
                public void onError(int errorCode) {
                    Log.e(TAG, "Session request failed with error code: " + errorCode);
                    String errorMessage = getErrorMessage(errorCode);
                    pluginCall.reject("session_error", errorMessage);
                }

                @Override
                public void onCancel() {
                    Log.d(TAG, "Session request was cancelled by user");
                    pluginCall.reject("session_cancelled", "User cancelled the session request");
                }
            }
        );
        return true;
    }

    /**
     * Converts Cast error codes to more understandable messages
     */
    private String getErrorMessage(int errorCode) {
        switch (errorCode) {
            case 2000:
                return "Authentication failed";
            case 2001:
                return "Invalid request";
            case 2002:
                return "Request cancelled";
            case 2003:
                return "Request not authorized";
            case 2004:
                return "Application not found";
            case 2005:
                return "Application not running";
            case 2006:
                return "Message too large";
            case 2007:
                return "Send buffer full";
            case 2475:
                return "Receiver application not found - check your internet connection and App ID";
            case 7:
                return "Network error";
            case 8:
                return "Internal error";
            case 15:
                return "Request timeout";
            default:
                return "Unknown error (code: " + errorCode + ")";
        }
    }

    /**
     * Selects a route by its id.
     *
     * @param pluginCall called with .success or .error depending on the result
     * @return true for cordova
     */
    @PluginMethod
    public boolean selectRoute(final PluginCall pluginCall) {
        String routeId = pluginCall.getString("routeId");
        connection.selectRoute(
            routeId,
            new ChromecastConnection.SelectRouteCallback() {
                @Override
                public void onJoin(JSONObject jsonSession) {
                    try {
                        pluginCall.resolve(JSObject.fromJSONObject(jsonSession));
                    } catch (JSONException e) {
                        pluginCall.reject("json_parse_error", e);
                    }
                }

                @Override
                public void onError(JSONObject message) {
                    try {
                        pluginCall.resolve(JSObject.fromJSONObject(message));
                    } catch (JSONException e) {
                        pluginCall.reject("json_parse_error", e);
                    }
                }
            }
        );
        return true;
    }

    /**
     * Send a custom message to the receiver.
     *
     * @param pluginCall called with .success or .error depending on the result
     * @return true for cordova
     */
    @PluginMethod
    public boolean sendMessage(final PluginCall pluginCall) {
        String namespace = pluginCall.getString("namespace");
        String message = pluginCall.getString("message");
        JSObject returnObj = new JSObject();
        returnObj.put("success", false);

        if (this.media == null) this.media = connection.getChromecastSession();
        if (this.media == null) {
            pluginCall.resolve(returnObj);
            return false;
        }

        this.media.sendMessage(
                namespace,
                message,
                new ResultCallback<Status>() {
                    @Override
                    public void onResult(Status result) {
                        if (!result.isSuccess()) {
                            returnObj.put("error", result.getStatus().toString());
                        } else {
                            returnObj.put("success", true);
                        }
                        pluginCall.resolve(returnObj);
                    }
                }
            );
        return true;
    }

    /**
     * Adds a listener to a specific namespace.
     *
     * @param pluginCall called with .success or .error depending on the result
     */
    @PluginMethod
    public void addMessageListener(PluginCall pluginCall) {
        String namespace = pluginCall.getString("namespace");
        if (namespace == null) {
            pluginCall.reject("namespace is required");
            return;
        }
        if (this.media == null) this.media = connection.getChromecastSession();
        if (this.media == null) {
            Log.d(TAG, "addMessageListener: Session not found");
            pluginCall.reject("No active session");
            return;
        }
        this.media.addMessageListener(namespace);
        pluginCall.resolve();
    }

    /**
     * Loads some media on the Chromecast using the media APIs.
     *
     * @param pluginCall called with .success or .error depending on the result
     */
    @PluginMethod
    public void loadMedia(final PluginCall pluginCall) {
        String contentId = pluginCall.getString("contentId");
        JSObject customData = pluginCall.getObject("customData", new JSObject());
        String contentType = pluginCall.getString("contentType", "");
        Integer duration = pluginCall.getInt("duration", 0);
        String streamType = pluginCall.getString("streamType", "");
        Boolean autoPlay = pluginCall.getBoolean("autoPlay", false);
        Integer currentTime = pluginCall.getInt("currentTime", 0);
        JSObject metadata = pluginCall.getObject("metadata", new JSObject());
        JSObject textTrackStyle = pluginCall.getObject("textTrackStyle", new JSObject());

        // Auto-detect content type if not specified
        String detectedContentType = detectContentType(contentId, contentType);
        if (!detectedContentType.equals(contentType)) {
            Log.d(TAG, "ContentType corrected from '" + contentType + "' to '" + detectedContentType + "'");
            contentType = detectedContentType;
        }

        // Adjust stream type for HLS
        if (detectedContentType.equals("application/x-mpegURL") && (streamType == null || streamType.isEmpty())) {
            streamType = "LIVE";
            Log.d(TAG, "StreamType set to LIVE for HLS stream");
        }

        Log.d(TAG, "=== LOAD MEDIA DEBUG ===");
        Log.d(TAG, "contentId: " + contentId);
        Log.d(TAG, "contentType: " + contentType);
        Log.d(TAG, "streamType: " + streamType);
        Log.d(TAG, "autoPlay: " + autoPlay);
        Log.d(TAG, "========================");

        this.connection.getChromecastSession()
            .loadMedia(
                contentId,
                customData,
                contentType,
                duration,
                streamType,
                autoPlay,
                currentTime,
                metadata,
                textTrackStyle,
                pluginCall
            );
    }

    /**
     * Loads media with authentication headers.
     *
     * @param pluginCall called with .success or .error depending on the result
     */
    @PluginMethod
    public void loadMediaWithHeaders(final PluginCall pluginCall) {
        String contentId = pluginCall.getString("contentId");
        JSObject customData = pluginCall.getObject("customData", new JSObject());
        String contentType = pluginCall.getString("contentType", "");
        Integer duration = pluginCall.getInt("duration", 0);
        String streamType = pluginCall.getString("streamType", "");
        Boolean autoPlay = pluginCall.getBoolean("autoPlay", false);
        Integer currentTime = pluginCall.getInt("currentTime", 0);
        JSObject metadata = pluginCall.getObject("metadata", new JSObject());
        JSObject textTrackStyle = pluginCall.getObject("textTrackStyle", new JSObject());
        JSObject authHeaders = pluginCall.getObject("authHeaders", new JSObject());
        String authToken = pluginCall.getString("authToken", "");

        // Add auth headers to custom data
        if (authHeaders != null && authHeaders.length() > 0) {
            try {
                customData.put("authHeaders", authHeaders);
                Log.d(TAG, "Added auth headers to customData");
            } catch (Exception e) {
                Log.w(TAG, "Failed to add auth headers to customData", e);
            }
        }

        // Add auth token to custom data
        if (authToken != null && !authToken.isEmpty()) {
            try {
                customData.put("authToken", authToken);
                Log.d(TAG, "Added auth token to customData");
            } catch (Exception e) {
                Log.w(TAG, "Failed to add auth token to customData", e);
            }
        }

        // Auto-detect content type
        String detectedContentType = detectContentType(contentId, contentType);
        if (!detectedContentType.equals(contentType)) {
            contentType = detectedContentType;
        }

        // Adjust stream type for HLS
        if (detectedContentType.equals("application/x-mpegURL") && (streamType == null || streamType.isEmpty())) {
            streamType = "LIVE";
        }

        this.connection.getChromecastSession()
            .loadMedia(
                contentId,
                customData,
                contentType,
                duration,
                streamType,
                autoPlay,
                currentTime,
                metadata,
                textTrackStyle,
                pluginCall
            );
    }

    /**
     * Simple method to launch media with default parameters.
     *
     * @param pluginCall called with .success or .error depending on the result
     */
    @PluginMethod
    public void launchMedia(final PluginCall pluginCall) {
        String mediaUrl = pluginCall.getString("mediaUrl");
        if (mediaUrl == null) {
            mediaUrl = pluginCall.getString("url");
        }
        if (mediaUrl == null) {
            mediaUrl = pluginCall.getString("options");
        }

        if (mediaUrl == null || mediaUrl.isEmpty()) {
            Log.e(TAG, "No URL found in launchMedia");
            pluginCall.reject("mediaUrl is required");
            return;
        }

        Log.d(TAG, "launchMedia URL: " + mediaUrl);

        if (this.connection == null) {
            Log.e(TAG, "No Chromecast connection initialized");
            pluginCall.resolve(new JSObject().put("value", false));
            return;
        }

        if (this.connection.getChromecastSession() == null) {
            Log.e(TAG, "No active Chromecast session");
            pluginCall.resolve(new JSObject().put("value", false));
            return;
        }

        try {
            JSObject customData = new JSObject();
            String contentType = detectContentType(mediaUrl, null);
            Integer duration = 0;
            String streamType = "BUFFERED";

            if (contentType.equals("application/x-mpegURL")) {
                streamType = "LIVE";
            }

            Boolean autoPlay = true;
            Integer currentTime = 0;
            JSObject metadata = new JSObject();
            JSObject textTrackStyle = new JSObject();

            try {
                JSONObject customDataJSON = new JSONObject(customData.toString());
                JSONObject metadataJSON = new JSONObject(metadata.toString());
                JSONObject textTrackStyleJSON = new JSONObject(textTrackStyle.toString());

                this.connection.getChromecastSession()
                    .loadMedia(
                        mediaUrl,
                        customDataJSON,
                        contentType,
                        duration.longValue(),
                        streamType,
                        autoPlay,
                        currentTime.doubleValue(),
                        metadataJSON,
                        textTrackStyleJSON,
                        pluginCall
                    );
            } catch (JSONException e) {
                Log.e(TAG, "JSON conversion error: " + e.getMessage());
                pluginCall.reject("json_error", e);
            }
        } catch (Exception e) {
            Log.e(TAG, "Exception launching media: " + e.getMessage());
            e.printStackTrace();
            pluginCall.resolve(new JSObject().put("value", false));
        }
    }

    /**
     * Pause the current media.
     *
     * @param pluginCall called with .success or .error depending on the result
     */
    @PluginMethod
    public void mediaPause(PluginCall pluginCall) {
        if (this.media == null) this.media = connection.getChromecastSession();
        if (this.media == null) {
            Log.d(TAG, "mediaPause: Session not found");
            pluginCall.reject("No active session");
            return;
        }
        this.media.pause();
        pluginCall.resolve();
    }

    /**
     * Play/resume the current media.
     *
     * @param pluginCall called with .success or .error depending on the result
     */
    @PluginMethod
    public void mediaPlay(PluginCall pluginCall) {
        if (this.media == null) this.media = connection.getChromecastSession();
        if (this.media == null) {
            Log.d(TAG, "mediaPlay: Session not found");
            pluginCall.reject("No active session");
            return;
        }
        this.media.play();
        pluginCall.resolve();
    }

    /**
     * Seek to a position in the current media.
     *
     * @param pluginCall called with .success or .error depending on the result
     */
    @PluginMethod
    public void mediaSeek(PluginCall pluginCall) {
        if (this.media == null) this.media = connection.getChromecastSession();
        if (this.media == null) {
            Log.d(TAG, "mediaSeek: Session not found");
            pluginCall.reject("No active session");
            return;
        }
        long position = pluginCall.getInt("currentTime", 0);
        this.media.seek(position);
        pluginCall.resolve();
    }

    /**
     * Skip to next item in queue.
     *
     * @param pluginCall called with .success or .error depending on the result
     */
    @PluginMethod
    public void mediaNext(PluginCall pluginCall) {
        if (this.media == null) this.media = connection.getChromecastSession();
        if (this.media == null) {
            Log.d(TAG, "mediaNext: Session not found");
            pluginCall.reject("No active session");
            return;
        }
        this.media.next();
        pluginCall.resolve();
    }

    /**
     * Go to previous item in queue.
     *
     * @param pluginCall called with .success or .error depending on the result
     */
    @PluginMethod
    public void mediaPrev(PluginCall pluginCall) {
        if (this.media == null) this.media = connection.getChromecastSession();
        if (this.media == null) {
            Log.d(TAG, "mediaPrev: Session not found");
            pluginCall.reject("No active session");
            return;
        }
        this.media.prev();
        pluginCall.resolve();
    }

    /**
     * Stops the session.
     *
     * @param pluginCall called with .success or .error depending on the result
     * @return true for cordova
     */
    @PluginMethod
    public boolean sessionStop(PluginCall pluginCall) {
        connection.endSession(true, pluginCall);
        return true;
    }

    /**
     * Stops the session.
     *
     * @param pluginCall called with .success or .error depending on the result
     * @return true for cordova
     */
    @PluginMethod
    public boolean sessionLeave(PluginCall pluginCall) {
        connection.endSession(false, pluginCall);
        return true;
    }

    /**
     * Will actively scan for routes and send a json array to the client.
     *
     * @param pluginCall called with .success or .error depending on the result
     * @return true for cordova
     */
    @PluginMethod
    public boolean startRouteScan(PluginCall pluginCall) {
        if (scanPluginCall != null) {
            scanPluginCall.reject("Started a new route scan before stopping previous one.");
        }
        scanPluginCall = pluginCall;
        Runnable startScan = new Runnable() {
            @Override
            public void run() {
                clientScan =
                    new ChromecastConnection.ScanCallback() {
                        @Override
                        void onRouteUpdate(List<MediaRouter.RouteInfo> routes) {
                            if (scanPluginCall != null) {
                                JSObject ret = new JSObject();
                                JSArray retArr = new JSArray();

                                for (int i = 0; i < routes.size(); i++) {
                                    retArr.put(routes.get(i));
                                }
                                ret.put("routes", retArr);

                                scanPluginCall.resolve(ret);
                            } else {
                                connection.stopRouteScan(clientScan, null);
                            }
                        }
                    };
                connection.startRouteScan(null, clientScan, null);
            }
        };
        if (clientScan != null) {
            connection.stopRouteScan(clientScan, startScan);
        } else {
            startScan.run();
        }
        return true;
    }

    /**
     * Stops the scan started by startRouteScan.
     *
     * @param pluginCall called with .success or .error depending on the result
     * @return true for cordova
     */
    @PluginMethod
    public boolean stopRouteScan(final PluginCall pluginCall) {
        connection.stopRouteScan(
            clientScan,
            new Runnable() {
                @Override
                public void run() {
                    if (scanPluginCall != null) {
                        scanPluginCall.reject("Scan stopped.");
                        scanPluginCall = null;
                    }
                    pluginCall.resolve();
                }
            }
        );
        return true;
    }

    /**
     * Network diagnostic method.
     *
     * @param pluginCall called with diagnostic info
     */
    @PluginMethod
    public void networkDiagnostic(PluginCall pluginCall) {
        JSObject result = new JSObject();

        try {
            ConnectivityManager cm = (ConnectivityManager) getContext().getSystemService(Context.CONNECTIVITY_SERVICE);
            NetworkInfo activeNetwork = cm.getActiveNetworkInfo();

            if (activeNetwork != null) {
                result.put("networkConnected", true);
                result.put("networkType", activeNetwork.getTypeName());
                result.put("networkState", activeNetwork.getState().toString());

                boolean isWiFi = activeNetwork.getType() == ConnectivityManager.TYPE_WIFI;
                result.put("isWiFi", isWiFi);

                if (!isWiFi) {
                    result.put("warning", "Chromecast requires WiFi. You are on " + activeNetwork.getTypeName());
                }
            } else {
                result.put("networkConnected", false);
                result.put("error", "No network connection detected");
            }

            try {
                int gmsAvailable = GoogleApiAvailability.getInstance().isGooglePlayServicesAvailable(getContext());
                result.put("googlePlayServices", gmsAvailable == ConnectionResult.SUCCESS);
                if (gmsAvailable != ConnectionResult.SUCCESS) {
                    result.put("gmsError", "Google Play Services not available: " + gmsAvailable);
                }
            } catch (Exception e) {
                result.put("gmsError", "Error checking Google Play Services: " + e.getMessage());
            }

            if (connection != null) {
                result.put("castConnectionAvailable", true);
            } else {
                result.put("castConnectionAvailable", false);
            }
        } catch (Exception e) {
            result.put("error", "Error during diagnostic: " + e.getMessage());
            Log.e(TAG, "Error in networkDiagnostic", e);
        }

        pluginCall.resolve(result);
    }

    /**
     * Do everything you need to for "setup".
     *
     * @return true for cordova
     */
    private boolean setup() {
        if (this.connection != null) {
            connection.stopRouteScan(
                clientScan,
                new Runnable() {
                    @Override
                    public void run() {
                        if (scanPluginCall != null) {
                            scanPluginCall.reject("Scan stopped because setup triggered.");
                            scanPluginCall = null;
                        }
                        sendEvent("SETUP", new JSObject());
                    }
                }
            );
        }

        return true;
    }

    /**
     * Auto-detect content type based on URL.
     */
    private String detectContentType(String url, String providedContentType) {
        if (url == null) {
            return providedContentType != null ? providedContentType : "video/mp4";
        }

        String baseUrl = url.split("\\?")[0].toLowerCase();

        if (baseUrl.endsWith(".m3u8")) {
            Log.d(TAG, "Detected HLS stream (.m3u8)");
            return "application/x-mpegURL";
        } else if (baseUrl.endsWith(".mpd")) {
            Log.d(TAG, "Detected DASH stream (.mpd)");
            return "application/dash+xml";
        } else if (baseUrl.endsWith(".mp4")) {
            return "video/mp4";
        } else if (baseUrl.endsWith(".webm")) {
            return "video/webm";
        } else if (baseUrl.endsWith(".mkv")) {
            return "video/x-matroska";
        }

        return providedContentType != null && !providedContentType.isEmpty() ? providedContentType : "video/mp4";
    }

    /**
     * This triggers an event on the JS-side.
     *
     * @param eventName - The name of the JS event to trigger
     * @param args      - The arguments to pass the JS event
     */
    private void sendEvent(String eventName, JSObject args) {
        notifyListeners(eventName, args);
    }
}
