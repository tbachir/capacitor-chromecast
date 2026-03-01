#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

// Define the plugin using the CAP_PLUGIN Macro, and
// each method the plugin supports using the CAP_PLUGIN_METHOD macro.
CAP_PLUGIN(ChromecastPlugin, "Chromecast",
           CAP_PLUGIN_METHOD(initialize, CAPPluginReturnNone);
           CAP_PLUGIN_METHOD(requestSession, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(launchMedia, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(loadMedia, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(loadMediaWithHeaders, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(mediaPause, CAPPluginReturnNone);
           CAP_PLUGIN_METHOD(mediaPlay, CAPPluginReturnNone);
           CAP_PLUGIN_METHOD(mediaSeek, CAPPluginReturnNone);
           CAP_PLUGIN_METHOD(mediaNext, CAPPluginReturnNone);
           CAP_PLUGIN_METHOD(mediaPrev, CAPPluginReturnNone);
           CAP_PLUGIN_METHOD(sessionStop, CAPPluginReturnNone);
           CAP_PLUGIN_METHOD(sessionLeave, CAPPluginReturnNone);
           CAP_PLUGIN_METHOD(startRouteScan, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(stopRouteScan, CAPPluginReturnNone);
           CAP_PLUGIN_METHOD(selectRoute, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(sendMessage, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(addMessageListener, CAPPluginReturnNone);
           CAP_PLUGIN_METHOD(removeMessageListener, CAPPluginReturnNone);
           CAP_PLUGIN_METHOD(networkDiagnostic, CAPPluginReturnPromise);
)
