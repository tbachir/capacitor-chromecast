#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

// Define the plugin using the CAP_PLUGIN Macro, and
// each method the plugin supports using the CAP_PLUGIN_METHOD macro.
CAP_PLUGIN(ChromecastPlugin, "KosmiCast",
           CAP_PLUGIN_METHOD(initialize, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(requestSession, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(launchMedia, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(loadMedia, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(loadMediaWithHeaders, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(mediaPause, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(mediaPlay, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(mediaSeek, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(mediaNext, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(mediaPrev, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(sessionStop, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(sessionLeave, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(startRouteScan, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(stopRouteScan, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(selectRoute, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(sendMessage, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(addMessageListener, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(networkDiagnostic, CAPPluginReturnPromise);
)
