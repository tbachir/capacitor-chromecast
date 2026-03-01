import Foundation
import Capacitor
import GoogleCast

@objc(ChromecastPlugin)
public class ChromecastPlugin: CAPPlugin, CAPBridgedPlugin, ChromecastListener {

    public let identifier = "ChromecastPlugin"
    public let jsName = "Chromecast"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "initialize", returnType: CAPPluginReturnNone),
        CAPPluginMethod(name: "requestSession", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "launchMedia", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "loadMedia", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "loadMediaWithHeaders", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "mediaPause", returnType: CAPPluginReturnNone),
        CAPPluginMethod(name: "mediaPlay", returnType: CAPPluginReturnNone),
        CAPPluginMethod(name: "mediaSeek", returnType: CAPPluginReturnNone),
        CAPPluginMethod(name: "mediaNext", returnType: CAPPluginReturnNone),
        CAPPluginMethod(name: "mediaPrev", returnType: CAPPluginReturnNone),
        CAPPluginMethod(name: "sessionStop", returnType: CAPPluginReturnNone),
        CAPPluginMethod(name: "sessionLeave", returnType: CAPPluginReturnNone),
        CAPPluginMethod(name: "startRouteScan", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopRouteScan", returnType: CAPPluginReturnNone),
        CAPPluginMethod(name: "selectRoute", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "sendMessage", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "addMessageListener", returnType: CAPPluginReturnNone),
        CAPPluginMethod(name: "removeMessageListener", returnType: CAPPluginReturnNone),
        CAPPluginMethod(name: "networkDiagnostic", returnType: CAPPluginReturnPromise)
    ]

    // MARK: - Lifecycle
    public override func load() {
        print("🔴🔴🔴 ChromecastPlugin LOADED 🔴🔴🔴")
        super.load()
    }

    // MARK: - Properties
    private var implementation: Chromecast?
    private var isInitialized = false
    private var initializedAppId: String?

    // MARK: - Event Names (matching Android)
    private let EVENT_SESSION_LISTENER = "SESSION_LISTENER"
    private let EVENT_SESSION_UPDATE = "SESSION_UPDATE"
    private let EVENT_SESSION_STARTED = "SESSION_STARTED"
    private let EVENT_SESSION_ENDED = "SESSION_ENDED"
    private let EVENT_SESSION_RESUMED = "SESSION_RESUMED"
    private let EVENT_SESSION_START_FAILED = "SESSION_START_FAILED"
    private let EVENT_RECEIVER_LISTENER = "RECEIVER_LISTENER"
    private let EVENT_MEDIA_LOAD = "MEDIA_LOAD"
    private let EVENT_MEDIA_UPDATE = "MEDIA_UPDATE"
    private let EVENT_RECEIVER_MESSAGE = "RECEIVER_MESSAGE"
    private let EVENT_SETUP = "SETUP"

    // MARK: - Plugin Methods

    @objc func initialize(_ call: CAPPluginCall) {
        let requestedAppId = resolveAppId(from: call)

        // Ensure main thread execution
        DispatchQueue.main.async { [weak self] in
            guard let self = self else {
                call.reject("Plugin deallocated")
                return
            }

            // Google Cast iOS SDK uses a singleton cast context.
            // After initialization, switching appId at runtime is not supported.
            if self.isInitialized {
                if self.initializedAppId == requestedAppId {
                    call.resolve()
                } else {
                    call.reject(
                        "iOS Cast SDK is already initialized with appId '\(self.initializedAppId ?? requestedAppId)'. " +
                        "Restart the app to use a different appId."
                    )
                }
                return
            }

            self.implementation = Chromecast()
            self.implementation?.initialize(appId: requestedAppId, listener: self) { error in
                if let error = error {
                    call.reject(error.localizedDescription)
                } else {
                    self.isInitialized = true
                    self.initializedAppId = requestedAppId
                    call.resolve()
                }
            }
        }
    }

    private func resolveAppId(from call: CAPPluginCall) -> String {
        let callAppId = call.getString("appId")?.trimmingCharacters(in: .whitespacesAndNewlines)
        if let callAppId = callAppId, !callAppId.isEmpty {
            return callAppId
        }

        let configuredAppId = bridge?
            .config
            .getPluginConfig("Chromecast")
            .getString("appId")?
            .trimmingCharacters(in: .whitespacesAndNewlines)
        if let configuredAppId = configuredAppId, !configuredAppId.isEmpty {
            return configuredAppId
        }

        return kGCKDefaultMediaReceiverApplicationID
    }

    @objc func requestSession(_ call: CAPPluginCall) {
        print("🔴🔴🔴 ChromecastPlugin requestSession() called 🔴🔴🔴")
        guard let implementation = implementation, isInitialized else {
            print("🔴🔴🔴 ChromecastPlugin not initialized! 🔴🔴🔴")
            call.reject("Plugin not initialized")
            return
        }

        DispatchQueue.main.async {
            implementation.requestSession { result in
                switch result {
                case .success(let session):
                    call.resolve(session as PluginCallResultData)
                case .failure(let error):
                    call.reject(error.localizedDescription)
                }
            }
        }
    }

    @objc func launchMedia(_ call: CAPPluginCall) {
        guard let mediaUrl = call.getString("mediaUrl") else {
            call.reject("mediaUrl is required")
            return
        }

        guard let implementation = implementation, isInitialized else {
            call.reject("Plugin not initialized")
            return
        }

        // Auto-detect content type from URL
        let contentType = detectContentType(url: mediaUrl)

        DispatchQueue.main.async {
            implementation.loadMedia(
                contentId: mediaUrl,
                customData: nil,
                contentType: contentType,
                duration: 0,
                streamType: "buffered",
                autoPlay: true,
                currentTime: 0,
                metadata: nil,
                textTrackStyle: nil
            ) { result in
                switch result {
                case .success:
                    call.resolve(["success": true])
                case .failure(let error):
                    call.reject(error.localizedDescription)
                }
            }
        }
    }

    /// Detect content type from URL
    private func detectContentType(url: String?) -> String {
        guard let url = url?.lowercased() else {
            return "video/mp4"
        }

        let urlWithoutQuery = url.components(separatedBy: "?").first ?? url

        if urlWithoutQuery.hasSuffix(".m3u8") {
            return "application/x-mpegURL"
        } else if urlWithoutQuery.hasSuffix(".mpd") {
            return "application/dash+xml"
        } else if urlWithoutQuery.hasSuffix(".mp4") {
            return "video/mp4"
        } else if urlWithoutQuery.hasSuffix(".webm") {
            return "video/webm"
        } else if urlWithoutQuery.hasSuffix(".mkv") {
            return "video/x-matroska"
        }

        return "video/mp4"
    }

    @objc func loadMedia(_ call: CAPPluginCall) {
        guard let contentId = call.getString("contentId") else {
            call.reject("contentId is required")
            return
        }

        guard let implementation = implementation, isInitialized else {
            call.reject("Plugin not initialized")
            return
        }

        let customData = call.getObject("customData") as? [String: Any]
        let contentType = call.getString("contentType") ?? "video/mp4"
        let duration = call.getDouble("duration") ?? 0
        let streamType = call.getString("streamType") ?? "buffered"
        let autoPlay = call.getBool("autoPlay") ?? true
        let currentTime = call.getDouble("currentTime") ?? 0
        let metadata = call.getObject("metadata") as? [String: Any]
        let textTrackStyle = call.getObject("textTrackStyle") as? [String: Any]

        DispatchQueue.main.async {
            implementation.loadMedia(
                contentId: contentId,
                customData: customData,
                contentType: contentType,
                duration: duration,
                streamType: streamType,
                autoPlay: autoPlay,
                currentTime: currentTime,
                metadata: metadata,
                textTrackStyle: textTrackStyle
            ) { result in
                switch result {
                case .success(let mediaObject):
                    call.resolve(mediaObject as PluginCallResultData)
                case .failure(let error):
                    call.reject(error.localizedDescription)
                }
            }
        }
    }

    @objc func loadMediaWithHeaders(_ call: CAPPluginCall) {
        guard let contentId = call.getString("contentId") else {
            call.reject("contentId is required")
            return
        }

        guard let implementation = implementation, isInitialized else {
            call.reject("Plugin not initialized")
            return
        }

        let customData = call.getObject("customData") as? [String: Any]
        let contentType = call.getString("contentType") ?? detectContentType(url: contentId)
        let duration = call.getDouble("duration") ?? 0
        let streamType = call.getString("streamType") ?? "buffered"
        let autoPlay = call.getBool("autoPlay") ?? true
        let currentTime = call.getDouble("currentTime") ?? 0
        let metadata = call.getObject("metadata") as? [String: Any]
        let textTrackStyle = call.getObject("textTrackStyle") as? [String: Any]
        let authHeaders = call.getObject("authHeaders") as? [String: String]
        let authToken = call.getString("authToken")

        DispatchQueue.main.async {
            implementation.loadMediaWithHeaders(
                contentId: contentId,
                customData: customData,
                contentType: contentType,
                duration: duration,
                streamType: streamType,
                autoPlay: autoPlay,
                currentTime: currentTime,
                metadata: metadata,
                textTrackStyle: textTrackStyle,
                authHeaders: authHeaders,
                authToken: authToken
            ) { result in
                switch result {
                case .success(let mediaObject):
                    call.resolve(mediaObject as PluginCallResultData)
                case .failure(let error):
                    call.reject(error.localizedDescription)
                }
            }
        }
    }

    // MARK: - Media Control Methods

    @objc func mediaPause(_ call: CAPPluginCall) {
        guard let implementation = implementation, isInitialized else {
            call.reject("Plugin not initialized")
            return
        }

        DispatchQueue.main.async {
            implementation.pause { error in
                if let error = error {
                    call.reject(error.localizedDescription)
                } else {
                    call.resolve()
                }
            }
        }
    }

    @objc func mediaPlay(_ call: CAPPluginCall) {
        guard let implementation = implementation, isInitialized else {
            call.reject("Plugin not initialized")
            return
        }

        DispatchQueue.main.async {
            implementation.play { error in
                if let error = error {
                    call.reject(error.localizedDescription)
                } else {
                    call.resolve()
                }
            }
        }
    }

    @objc func mediaSeek(_ call: CAPPluginCall) {
        guard let currentTime = call.getDouble("currentTime") else {
            call.reject("currentTime is required")
            return
        }

        guard let implementation = implementation, isInitialized else {
            call.reject("Plugin not initialized")
            return
        }

        DispatchQueue.main.async {
            implementation.seek(position: currentTime) { error in
                if let error = error {
                    call.reject(error.localizedDescription)
                } else {
                    call.resolve()
                }
            }
        }
    }

    @objc func mediaNext(_ call: CAPPluginCall) {
        guard let implementation = implementation, isInitialized else {
            call.reject("Plugin not initialized")
            return
        }

        DispatchQueue.main.async {
            implementation.next { error in
                if let error = error {
                    call.reject(error.localizedDescription)
                } else {
                    call.resolve()
                }
            }
        }
    }

    @objc func mediaPrev(_ call: CAPPluginCall) {
        guard let implementation = implementation, isInitialized else {
            call.reject("Plugin not initialized")
            return
        }

        DispatchQueue.main.async {
            implementation.prev { error in
                if let error = error {
                    call.reject(error.localizedDescription)
                } else {
                    call.resolve()
                }
            }
        }
    }

    // MARK: - Messaging Methods

    @objc func sendMessage(_ call: CAPPluginCall) {
        guard let namespace = call.getString("namespace") else {
            call.reject("namespace is required")
            return
        }

        guard let message = call.getString("message") else {
            call.reject("message is required")
            return
        }

        guard let implementation = implementation, isInitialized else {
            call.reject("Plugin not initialized")
            return
        }

        DispatchQueue.main.async {
            implementation.sendMessage(namespace: namespace, message: message) { result in
                switch result {
                case .success:
                    call.resolve(["success": true])
                case .failure(let error):
                    call.resolve(["success": false, "error": error.localizedDescription])
                }
            }
        }
    }

    @objc func addMessageListener(_ call: CAPPluginCall) {
        guard let namespace = call.getString("namespace") else {
            call.reject("namespace is required")
            return
        }

        guard let implementation = implementation, isInitialized else {
            call.reject("Plugin not initialized")
            return
        }

        DispatchQueue.main.async {
            implementation.addMessageListener(namespace: namespace) { error in
                if let error = error {
                    call.reject(error.localizedDescription)
                } else {
                    call.resolve()
                }
            }
        }
    }

    @objc func removeMessageListener(_ call: CAPPluginCall) {
        guard let namespace = call.getString("namespace") else {
            call.reject("namespace is required")
            return
        }

        guard let implementation = implementation, isInitialized else {
            call.reject("Plugin not initialized")
            return
        }

        DispatchQueue.main.async {
            implementation.removeMessageListener(namespace: namespace) { error in
                if let error = error {
                    call.reject(error.localizedDescription)
                } else {
                    call.resolve()
                }
            }
        }
    }

    // MARK: - Diagnostic Methods

    @objc func networkDiagnostic(_ call: CAPPluginCall) {
        guard let implementation = implementation else {
            call.reject("Plugin not initialized")
            return
        }

        DispatchQueue.main.async {
            implementation.networkDiagnostic { result in
                call.resolve(result as PluginCallResultData)
            }
        }
    }

    @objc func sessionStop(_ call: CAPPluginCall) {
        guard let implementation = implementation, isInitialized else {
            call.reject("Plugin not initialized")
            return
        }

        DispatchQueue.main.async {
            implementation.endSession(stopCasting: true) { error in
                if let error = error {
                    call.reject(error.localizedDescription)
                } else {
                    call.resolve()
                }
            }
        }
    }

    @objc func sessionLeave(_ call: CAPPluginCall) {
        guard let implementation = implementation, isInitialized else {
            call.reject("Plugin not initialized")
            return
        }

        DispatchQueue.main.async {
            implementation.endSession(stopCasting: false) { error in
                if let error = error {
                    call.reject(error.localizedDescription)
                } else {
                    call.resolve()
                }
            }
        }
    }

    @objc func startRouteScan(_ call: CAPPluginCall) {
        guard let implementation = implementation, isInitialized else {
            call.reject("Plugin not initialized")
            return
        }

        let timeout = call.getDouble("timeout")

        DispatchQueue.main.async {
            implementation.startRouteScan(timeout: timeout) { routes in
                call.resolve(["routes": routes])
            }
        }
    }

    @objc func stopRouteScan(_ call: CAPPluginCall) {
        guard let implementation = implementation, isInitialized else {
            call.reject("Plugin not initialized")
            return
        }

        DispatchQueue.main.async {
            implementation.stopRouteScan()
            call.resolve()
        }
    }

    @objc func selectRoute(_ call: CAPPluginCall) {
        guard let routeId = call.getString("routeId") else {
            call.reject("routeId is required")
            return
        }

        guard let implementation = implementation, isInitialized else {
            call.reject("Plugin not initialized")
            return
        }

        DispatchQueue.main.async {
            implementation.selectRoute(routeId: routeId) { result in
                switch result {
                case .success(let session):
                    call.resolve(session as PluginCallResultData)
                case .failure(let error):
                    call.reject(error.localizedDescription)
                }
            }
        }
    }

    // MARK: - ChromecastListener Implementation

    public func onSessionRejoin(_ session: [String: Any]) {
        notifyListeners(EVENT_SESSION_LISTENER, data: session as PluginCallResultData)
    }

    public func onSessionUpdate(_ session: [String: Any]) {
        notifyListeners(EVENT_SESSION_UPDATE, data: session as PluginCallResultData)
    }

    public func onSessionEnd(_ session: [String: Any]) {
        notifyListeners(EVENT_SESSION_ENDED, data: session as PluginCallResultData)
        notifyListeners(EVENT_SESSION_UPDATE, data: session as PluginCallResultData)
    }

    public func onSessionStarted(_ session: [String: Any]) {
        notifyListeners(EVENT_SESSION_STARTED, data: session as PluginCallResultData)
    }

    public func onSessionStartFailed(_ error: String) {
        notifyListeners(EVENT_SESSION_START_FAILED, data: ["error": error])
    }

    public func onSessionResumed(_ session: [String: Any]) {
        notifyListeners(EVENT_SESSION_RESUMED, data: session as PluginCallResultData)
    }

    public func onReceiverAvailableUpdate(_ available: Bool) {
        notifyListeners(EVENT_RECEIVER_LISTENER, data: [
            "available": available,
            "isAvailable": available
        ])
    }

    public func onMediaLoaded(_ media: [String: Any]) {
        notifyListeners(EVENT_MEDIA_LOAD, data: media as PluginCallResultData)
    }

    public func onMediaUpdate(_ media: [String: Any]) {
        notifyListeners(EVENT_MEDIA_UPDATE, data: media as PluginCallResultData)
    }

    public func onMessageReceived(_ deviceId: String, namespace: String, message: String) {
        notifyListeners(EVENT_RECEIVER_MESSAGE, data: [
            "namespace": namespace,
            "message": message
        ])
    }
}
