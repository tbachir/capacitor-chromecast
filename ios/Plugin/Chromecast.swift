import Foundation
import GoogleCast
import SystemConfiguration

// MARK: - Error Types
enum ChromecastError: Error, LocalizedError {
    case notInitialized
    case noSession
    case sessionError(String)
    case mediaLoadError(String)
    case invalidParameter(String)
    case timeout
    case cancelled

    var errorDescription: String? {
        switch self {
        case .notInitialized:
            return "Chromecast not initialized"
        case .noSession:
            return "No active Chromecast session"
        case .sessionError(let message):
            return "Session error: \(message)"
        case .mediaLoadError(let message):
            return "Media load error: \(message)"
        case .invalidParameter(let message):
            return "Invalid parameter: \(message)"
        case .timeout:
            return "Operation timed out"
        case .cancelled:
            return "Operation cancelled"
        }
    }
}

// MARK: - Listener Protocol
@objc public protocol ChromecastListener: AnyObject {
    func onSessionRejoin(_ session: [String: Any])
    func onSessionUpdate(_ session: [String: Any])
    func onSessionEnd(_ session: [String: Any])
    func onSessionStarted(_ session: [String: Any])
    func onSessionStartFailed(_ error: String)
    func onSessionResumed(_ session: [String: Any])
    func onReceiverAvailableUpdate(_ available: Bool)
    func onMediaLoaded(_ media: [String: Any])
    func onMediaUpdate(_ media: [String: Any])
    func onMessageReceived(_ deviceId: String, namespace: String, message: String)
}

// MARK: - Main Chromecast Class
@objc public class Chromecast: NSObject {

    // MARK: - Properties
    private var appId: String?
    private weak var listener: ChromecastListener?
    private var isInitialized = false
    private var sessionManager: GCKSessionManager?
    private var discoveryManager: GCKDiscoveryManager?
    private var currentSession: GCKCastSession?
    private var remoteMediaClient: GCKRemoteMediaClient?

    // Pending completion handlers
    private var pendingSessionCompletion: ((Result<[String: Any], Error>) -> Void)?
    private var pendingMediaCompletion: ((Result<[String: Any], Error>) -> Void)?
    private var pendingRouteScanCompletion: (([[String: Any]]) -> Void)?

    // MARK: - Initialization
    public func initialize(appId: String?, listener: ChromecastListener, completion: @escaping (Error?) -> Void) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else {
                completion(ChromecastError.notInitialized)
                return
            }

            self.listener = listener
            let receiverAppId = appId ?? kGCKDefaultMediaReceiverApplicationID
            self.appId = receiverAppId

            // Create discovery criteria
            let discoveryCriteria = GCKDiscoveryCriteria(applicationID: receiverAppId)

            // Create cast options
            let castOptions = GCKCastOptions(discoveryCriteria: discoveryCriteria)
            castOptions.startDiscoveryAfterFirstTapOnCastButton = false

            // Initialize the GCKCastContext (singleton)
            GCKCastContext.setSharedInstanceWith(castOptions)

            // Get managers
            self.sessionManager = GCKCastContext.sharedInstance().sessionManager
            self.discoveryManager = GCKCastContext.sharedInstance().discoveryManager

            // Add listeners
            self.sessionManager?.add(self)
            self.discoveryManager?.add(self)

            // Start discovery
            self.discoveryManager?.startDiscovery()

            self.isInitialized = true
            completion(nil)

            // Check for rejoining session after short delay
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) { [weak self] in
                guard let self = self else { return }
                if let session = self.sessionManager?.currentCastSession {
                    self.currentSession = session
                    self.remoteMediaClient = session.remoteMediaClient
                    self.setupMediaClientCallbacks()
                    self.listener?.onSessionRejoin(self.createSessionObject(session, status: nil))
                }
            }
        }
    }

    // MARK: - Session Management
    public func requestSession(completion: @escaping (Result<[String: Any], Error>) -> Void) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else {
                completion(.failure(ChromecastError.notInitialized))
                return
            }

            // If already have a session, return it
            if let session = self.currentSession, session.connectionState == .connected {
                completion(.success(self.createSessionObject(session, status: "connected")))
                return
            }

            // Store completion handler for session callback
            self.pendingSessionCompletion = completion

            // Present the device chooser dialog
            GCKCastContext.sharedInstance().presentCastDialog()
        }
    }

    public func selectRoute(routeId: String, completion: @escaping (Result<[String: Any], Error>) -> Void) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self,
                  let discoveryManager = self.discoveryManager else {
                completion(.failure(ChromecastError.notInitialized))
                return
            }

            // Find device by ID
            var targetDevice: GCKDevice?
            for i in 0..<discoveryManager.deviceCount {
                let device = discoveryManager.device(at: i)
                if device.deviceID == routeId {
                    targetDevice = device
                    break
                }
            }

            guard let device = targetDevice else {
                completion(.failure(ChromecastError.sessionError("Device not found")))
                return
            }

            // Store completion handler
            self.pendingSessionCompletion = completion

            // Start session with device
            self.sessionManager?.startSession(with: device)
        }
    }

    public func endSession(stopCasting: Bool, completion: @escaping (Error?) -> Void) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else {
                completion(ChromecastError.notInitialized)
                return
            }

            self.sessionManager?.endSessionAndStopCasting(stopCasting)
            self.currentSession = nil
            self.remoteMediaClient = nil
            completion(nil)
        }
    }

    // MARK: - Device Discovery
    public func startRouteScan(timeout: TimeInterval?, completion: @escaping ([[String: Any]]) -> Void) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self,
                  let discoveryManager = self.discoveryManager else {
                completion([])
                return
            }

            self.pendingRouteScanCompletion = completion

            // Start discovery if not already running
            if !discoveryManager.discoveryActive {
                discoveryManager.startDiscovery()
            }

            // Return current devices after a short delay to allow discovery
            let scanTimeout = timeout ?? 5.0
            DispatchQueue.main.asyncAfter(deadline: .now() + scanTimeout) { [weak self] in
                self?.returnDiscoveredDevices()
            }
        }
    }

    public func stopRouteScan() {
        DispatchQueue.main.async { [weak self] in
            self?.pendingRouteScanCompletion = nil
        }
    }

    private func returnDiscoveredDevices() {
        guard let discoveryManager = self.discoveryManager,
              let completion = self.pendingRouteScanCompletion else { return }

        var devices: [[String: Any]] = []
        for i in 0..<discoveryManager.deviceCount {
            let device = discoveryManager.device(at: i)
            devices.append(createDeviceObject(device))
        }

        completion(devices)
        self.pendingRouteScanCompletion = nil
    }

    // MARK: - Media Control

    /// Pause current media playback
    public func pause(completion: @escaping (Error?) -> Void) {
        DispatchQueue.main.async { [weak self] in
            guard let client = self?.currentSession?.remoteMediaClient else {
                completion(ChromecastError.noSession)
                return
            }
            client.pause()
            completion(nil)
        }
    }

    /// Resume media playback
    public func play(completion: @escaping (Error?) -> Void) {
        DispatchQueue.main.async { [weak self] in
            guard let client = self?.currentSession?.remoteMediaClient else {
                completion(ChromecastError.noSession)
                return
            }
            client.play()
            completion(nil)
        }
    }

    /// Seek to position in seconds
    public func seek(position: Double, completion: @escaping (Error?) -> Void) {
        DispatchQueue.main.async { [weak self] in
            guard let client = self?.currentSession?.remoteMediaClient else {
                completion(ChromecastError.noSession)
                return
            }
            let options = GCKMediaSeekOptions()
            options.interval = position
            client.seek(with: options)
            completion(nil)
        }
    }

    /// Skip to next item in queue
    public func next(completion: @escaping (Error?) -> Void) {
        DispatchQueue.main.async { [weak self] in
            guard let client = self?.currentSession?.remoteMediaClient else {
                completion(ChromecastError.noSession)
                return
            }
            client.queueNextItem()
            completion(nil)
        }
    }

    /// Go to previous item in queue
    public func prev(completion: @escaping (Error?) -> Void) {
        DispatchQueue.main.async { [weak self] in
            guard let client = self?.currentSession?.remoteMediaClient else {
                completion(ChromecastError.noSession)
                return
            }
            client.queuePreviousItem()
            completion(nil)
        }
    }

    public func loadMedia(
        contentId: String,
        customData: [String: Any]?,
        contentType: String?,
        duration: Double,
        streamType: String?,
        autoPlay: Bool,
        currentTime: Double,
        metadata: [String: Any]?,
        textTrackStyle: [String: Any]?,
        completion: @escaping (Result<[String: Any], Error>) -> Void
    ) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else {
                completion(.failure(ChromecastError.notInitialized))
                return
            }

            guard let client = self.currentSession?.remoteMediaClient else {
                completion(.failure(ChromecastError.noSession))
                return
            }

            guard let contentURL = URL(string: contentId) else {
                completion(.failure(ChromecastError.invalidParameter("Invalid contentId URL")))
                return
            }

            // Build media information
            let mediaInfoBuilder = GCKMediaInformationBuilder(contentURL: contentURL)
            mediaInfoBuilder.contentID = contentId
            mediaInfoBuilder.contentType = contentType ?? "video/mp4"
            mediaInfoBuilder.streamDuration = duration

            // Set stream type
            switch streamType?.lowercased() {
            case "buffered":
                mediaInfoBuilder.streamType = .buffered
            case "live":
                mediaInfoBuilder.streamType = .live
            default:
                mediaInfoBuilder.streamType = .none
            }

            // Set metadata if provided
            if let metadata = metadata {
                mediaInfoBuilder.metadata = self.createMediaMetadata(from: metadata)
            }

            // Set custom data
            if let customData = customData {
                mediaInfoBuilder.customData = customData
            }

            // Set text track style if provided
            if let textTrackStyle = textTrackStyle {
                mediaInfoBuilder.textTrackStyle = self.createTextTrackStyle(from: textTrackStyle)
            }

            let mediaInfo = mediaInfoBuilder.build()

            // Create load options
            let loadOptions = GCKMediaLoadOptions()
            loadOptions.autoplay = autoPlay
            loadOptions.playPosition = currentTime

            // Store completion handler
            self.pendingMediaCompletion = completion

            // Load the media
            let request = client.loadMedia(mediaInfo, with: loadOptions)
            request.delegate = self
        }
    }

    /// Load media with authentication headers
    public func loadMediaWithHeaders(
        contentId: String,
        customData: [String: Any]?,
        contentType: String?,
        duration: Double,
        streamType: String?,
        autoPlay: Bool,
        currentTime: Double,
        metadata: [String: Any]?,
        textTrackStyle: [String: Any]?,
        authHeaders: [String: String]?,
        authToken: String?,
        completion: @escaping (Result<[String: Any], Error>) -> Void
    ) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else {
                completion(.failure(ChromecastError.notInitialized))
                return
            }

            guard let client = self.currentSession?.remoteMediaClient else {
                completion(.failure(ChromecastError.noSession))
                return
            }

            guard let contentURL = URL(string: contentId) else {
                completion(.failure(ChromecastError.invalidParameter("Invalid contentId URL")))
                return
            }

            // Build media information
            let mediaInfoBuilder = GCKMediaInformationBuilder(contentURL: contentURL)
            mediaInfoBuilder.contentID = contentId
            mediaInfoBuilder.contentType = contentType ?? self.detectContentType(url: contentId)
            mediaInfoBuilder.streamDuration = duration

            // Set stream type
            switch streamType?.lowercased() {
            case "buffered":
                mediaInfoBuilder.streamType = .buffered
            case "live":
                mediaInfoBuilder.streamType = .live
            default:
                mediaInfoBuilder.streamType = .none
            }

            // Set metadata if provided
            if let metadata = metadata {
                mediaInfoBuilder.metadata = self.createMediaMetadata(from: metadata)
            }

            // Build custom data with auth headers
            var mergedCustomData: [String: Any] = customData ?? [:]

            if let authHeaders = authHeaders, !authHeaders.isEmpty {
                mergedCustomData["headers"] = authHeaders
            }

            if let authToken = authToken, !authToken.isEmpty {
                mergedCustomData["authToken"] = authToken
                // Also add as Authorization header if headers not specified
                if mergedCustomData["headers"] == nil {
                    mergedCustomData["headers"] = ["Authorization": "Bearer \(authToken)"]
                }
            }

            if !mergedCustomData.isEmpty {
                mediaInfoBuilder.customData = mergedCustomData
            }

            // Set text track style if provided
            if let textTrackStyle = textTrackStyle {
                mediaInfoBuilder.textTrackStyle = self.createTextTrackStyle(from: textTrackStyle)
            }

            let mediaInfo = mediaInfoBuilder.build()

            // Create load options
            let loadOptions = GCKMediaLoadOptions()
            loadOptions.autoplay = autoPlay
            loadOptions.playPosition = currentTime

            // Store completion handler
            self.pendingMediaCompletion = completion

            // Load the media
            let request = client.loadMedia(mediaInfo, with: loadOptions)
            request.delegate = self
        }
    }

    // MARK: - Messaging

    private var messageChannels: [String: GCKGenericChannel] = [:]

    /// Send a custom message to the receiver
    public func sendMessage(namespace: String, message: String, completion: @escaping (Result<Bool, Error>) -> Void) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else {
                completion(.failure(ChromecastError.notInitialized))
                return
            }

            guard let session = self.currentSession else {
                completion(.failure(ChromecastError.noSession))
                return
            }

            // Get or create channel for namespace
            let channel: GCKGenericChannel
            if let existingChannel = self.messageChannels[namespace] {
                channel = existingChannel
            } else {
                channel = GCKGenericChannel(namespace: namespace)
                channel.delegate = self
                session.add(channel)
                self.messageChannels[namespace] = channel
            }

            // Send message via channel
            var error: GCKError?
            let result = channel.sendTextMessage(message, error: &error)

            if result == 0, let error = error {
                completion(.failure(ChromecastError.sessionError("Failed to send message: \(error.localizedDescription)")))
            } else {
                completion(.success(true))
            }
        }
    }

    /// Add a message listener for a namespace
    public func addMessageListener(namespace: String, completion: @escaping (Error?) -> Void) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else {
                completion(ChromecastError.notInitialized)
                return
            }

            guard let session = self.currentSession else {
                completion(ChromecastError.noSession)
                return
            }

            // Only add if not already listening
            if self.messageChannels[namespace] == nil {
                let channel = GCKGenericChannel(namespace: namespace)
                channel.delegate = self
                session.add(channel)
                self.messageChannels[namespace] = channel
            }

            completion(nil)
        }
    }

    // MARK: - Network Diagnostic

    /// Get network diagnostic information
    public func networkDiagnostic(completion: @escaping ([String: Any]) -> Void) {
        DispatchQueue.main.async { [weak self] in
            var result: [String: Any] = [:]

            // Check network connectivity
            result["networkConnected"] = self?.isNetworkConnected() ?? false

            // Check if WiFi
            result["isWiFi"] = self?.isOnWiFi() ?? false

            // Get network type
            result["networkType"] = self?.getNetworkType() ?? "unknown"

            // Check Cast availability
            if let discoveryManager = self?.discoveryManager {
                result["castConnectionAvailable"] = discoveryManager.deviceCount > 0
            } else {
                result["castConnectionAvailable"] = false
            }

            // Check if initialized
            if self?.isInitialized != true {
                result["warning"] = "Chromecast SDK not initialized"
            }

            completion(result)
        }
    }

    private func isNetworkConnected() -> Bool {
        // Simple reachability check
        var zeroAddress = sockaddr_in()
        zeroAddress.sin_len = UInt8(MemoryLayout.size(ofValue: zeroAddress))
        zeroAddress.sin_family = sa_family_t(AF_INET)

        guard let defaultRouteReachability = withUnsafePointer(to: &zeroAddress, {
            $0.withMemoryRebound(to: sockaddr.self, capacity: 1) {
                SCNetworkReachabilityCreateWithAddress(nil, $0)
            }
        }) else {
            return false
        }

        var flags: SCNetworkReachabilityFlags = []
        if !SCNetworkReachabilityGetFlags(defaultRouteReachability, &flags) {
            return false
        }

        let isReachable = flags.contains(.reachable)
        let needsConnection = flags.contains(.connectionRequired)
        return isReachable && !needsConnection
    }

    private func isOnWiFi() -> Bool {
        var zeroAddress = sockaddr_in()
        zeroAddress.sin_len = UInt8(MemoryLayout.size(ofValue: zeroAddress))
        zeroAddress.sin_family = sa_family_t(AF_INET)

        guard let defaultRouteReachability = withUnsafePointer(to: &zeroAddress, {
            $0.withMemoryRebound(to: sockaddr.self, capacity: 1) {
                SCNetworkReachabilityCreateWithAddress(nil, $0)
            }
        }) else {
            return false
        }

        var flags: SCNetworkReachabilityFlags = []
        if !SCNetworkReachabilityGetFlags(defaultRouteReachability, &flags) {
            return false
        }

        let isReachable = flags.contains(.reachable)
        let isWWAN = flags.contains(.isWWAN)
        return isReachable && !isWWAN
    }

    private func getNetworkType() -> String {
        var zeroAddress = sockaddr_in()
        zeroAddress.sin_len = UInt8(MemoryLayout.size(ofValue: zeroAddress))
        zeroAddress.sin_family = sa_family_t(AF_INET)

        guard let defaultRouteReachability = withUnsafePointer(to: &zeroAddress, {
            $0.withMemoryRebound(to: sockaddr.self, capacity: 1) {
                SCNetworkReachabilityCreateWithAddress(nil, $0)
            }
        }) else {
            return "none"
        }

        var flags: SCNetworkReachabilityFlags = []
        if !SCNetworkReachabilityGetFlags(defaultRouteReachability, &flags) {
            return "none"
        }

        if !flags.contains(.reachable) {
            return "none"
        }

        if flags.contains(.isWWAN) {
            return "cellular"
        }

        return "wifi"
    }

    // MARK: - Content Type Detection

    /// Auto-detect content type from URL
    private func detectContentType(url: String?) -> String {
        guard let url = url?.lowercased() else {
            return "video/mp4"
        }

        // Remove query parameters for extension checking
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
        } else if urlWithoutQuery.hasSuffix(".mp3") {
            return "audio/mpeg"
        } else if urlWithoutQuery.hasSuffix(".wav") {
            return "audio/wav"
        } else if urlWithoutQuery.hasSuffix(".ogg") {
            return "audio/ogg"
        } else if urlWithoutQuery.hasSuffix(".flac") {
            return "audio/flac"
        }

        // Default to video/mp4
        return "video/mp4"
    }

    // MARK: - Setup Media Client Callbacks
    private func setupMediaClientCallbacks() {
        remoteMediaClient?.add(self)
    }

    // MARK: - Helper Methods
    private func createSessionObject(_ session: GCKCastSession, status: String?) -> [String: Any] {
        var result: [String: Any] = [:]

        if let metadata = session.applicationMetadata {
            result["appId"] = metadata.applicationID
            result["displayName"] = metadata.applicationName

            if let images = metadata.images {
                result["appImages"] = images.map { image -> [String: Any] in
                    if let gckImage = image as? GCKImage {
                        return ["url": gckImage.url.absoluteString]
                    }
                    return [:]
                }
            }
        } else {
            result["appId"] = appId ?? ""
        }

        result["sessionId"] = session.sessionID ?? ""

        // Receiver info
        var receiver: [String: Any] = [:]
        receiver["friendlyName"] = session.device.friendlyName ?? ""
        receiver["label"] = session.device.deviceID

        var volume: [String: Any] = [:]
        volume["level"] = session.currentDeviceVolume
        volume["muted"] = session.currentDeviceMuted
        receiver["volume"] = volume

        result["receiver"] = receiver

        if let status = status {
            result["status"] = status
        }

        // Add media array
        if let mediaStatus = session.remoteMediaClient?.mediaStatus {
            result["media"] = [createMediaObject(from: mediaStatus)]
        } else {
            result["media"] = []
        }

        return result
    }

    private func createMediaObject(from mediaStatus: GCKMediaStatus) -> [String: Any] {
        var result: [String: Any] = [:]

        result["currentItemId"] = mediaStatus.currentItemID
        result["currentTime"] = mediaStatus.streamPosition
        result["customData"] = mediaStatus.customData ?? [:]
        result["mediaSessionId"] = mediaStatus.mediaSessionID
        result["playbackRate"] = mediaStatus.playbackRate

        // Player state
        switch mediaStatus.playerState {
        case .idle:
            result["playerState"] = "IDLE"
        case .playing:
            result["playerState"] = "PLAYING"
        case .paused:
            result["playerState"] = "PAUSED"
        case .buffering:
            result["playerState"] = "BUFFERING"
        case .loading:
            result["playerState"] = "BUFFERING"
        @unknown default:
            result["playerState"] = "UNKNOWN"
        }

        // Idle reason
        if mediaStatus.playerState == .idle {
            switch mediaStatus.idleReason {
            case .cancelled:
                result["idleReason"] = "CANCELLED"
            case .error:
                result["idleReason"] = "ERROR"
            case .finished:
                result["idleReason"] = "FINISHED"
            case .interrupted:
                result["idleReason"] = "INTERRUPTED"
            case .none:
                break
            @unknown default:
                break
            }
        }

        result["isAlive"] = mediaStatus.playerState != .idle

        // Volume
        var volume: [String: Any] = [:]
        volume["level"] = mediaStatus.volume
        volume["muted"] = mediaStatus.isMuted
        result["volume"] = volume

        // Media info
        if let mediaInfo = mediaStatus.mediaInformation {
            result["media"] = createMediaInfoObject(from: mediaInfo)
        }

        // Session ID from current session
        if let sessionId = currentSession?.sessionID {
            result["sessionId"] = sessionId
        }

        return result
    }

    private func createMediaInfoObject(from mediaInfo: GCKMediaInformation) -> [String: Any] {
        var result: [String: Any] = [:]

        result["contentId"] = mediaInfo.contentID ?? ""
        result["contentType"] = mediaInfo.contentType ?? ""
        result["customData"] = mediaInfo.customData ?? [:]
        result["duration"] = mediaInfo.streamDuration

        switch mediaInfo.streamType {
        case .buffered:
            result["streamType"] = "BUFFERED"
        case .live:
            result["streamType"] = "LIVE"
        default:
            result["streamType"] = "OTHER"
        }

        if let metadata = mediaInfo.metadata {
            result["metadata"] = createMetadataDict(from: metadata)
        }

        return result
    }

    private func createMetadataDict(from metadata: GCKMediaMetadata) -> [String: Any] {
        var result: [String: Any] = [:]

        result["metadataType"] = metadata.metadataType.rawValue

        if let title = metadata.string(forKey: kGCKMetadataKeyTitle) {
            result["title"] = title
        }
        if let subtitle = metadata.string(forKey: kGCKMetadataKeySubtitle) {
            result["subtitle"] = subtitle
        }

        // Images
        var images: [[String: Any]] = []
        for i in 0..<metadata.images().count {
            if let image = metadata.images()[i] as? GCKImage {
                images.append(["url": image.url.absoluteString])
            }
        }
        if !images.isEmpty {
            result["images"] = images
        }

        return result
    }

    private func createDeviceObject(_ device: GCKDevice) -> [String: Any] {
        var result: [String: Any] = [:]
        result["id"] = device.deviceID
        result["name"] = device.friendlyName ?? ""
        result["description"] = device.modelName ?? ""
        result["isNearbyDevice"] = device.isOnLocalNetwork
        return result
    }

    private func createMediaMetadata(from dict: [String: Any]) -> GCKMediaMetadata {
        let metadataType = GCKMediaMetadataType(rawValue: dict["metadataType"] as? Int ?? 0) ?? .generic
        let metadata = GCKMediaMetadata(metadataType: metadataType)

        if let title = dict["title"] as? String {
            metadata.setString(title, forKey: kGCKMetadataKeyTitle)
        }
        if let subtitle = dict["subtitle"] as? String {
            metadata.setString(subtitle, forKey: kGCKMetadataKeySubtitle)
        }

        // Add images
        if let images = dict["images"] as? [[String: Any]] {
            for imageDict in images {
                if let urlString = imageDict["url"] as? String,
                   let url = URL(string: urlString) {
                    metadata.addImage(GCKImage(url: url, width: 0, height: 0))
                }
            }
        }

        return metadata
    }

    private func createTextTrackStyle(from dict: [String: Any]) -> GCKMediaTextTrackStyle {
        let style = GCKMediaTextTrackStyle.createDefault()

        if let fontScale = dict["fontScale"] as? CGFloat {
            style.fontScale = fontScale
        }

        if let fontFamily = dict["fontFamily"] as? String {
            style.fontFamily = fontFamily
        }

        return style
    }
}

// MARK: - GCKSessionManagerListener
extension Chromecast: GCKSessionManagerListener {

    public func sessionManager(_ sessionManager: GCKSessionManager, didStart session: GCKCastSession) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }

            self.currentSession = session
            self.remoteMediaClient = session.remoteMediaClient
            self.setupMediaClientCallbacks()

            let sessionObject = self.createSessionObject(session, status: "connected")

            // Call pending completion if exists
            self.pendingSessionCompletion?(.success(sessionObject))
            self.pendingSessionCompletion = nil

            // Fire both events for compatibility
            self.listener?.onSessionStarted(sessionObject)
            self.listener?.onSessionUpdate(sessionObject)
        }
    }

    public func sessionManager(_ sessionManager: GCKSessionManager, didEnd session: GCKCastSession, withError error: Error?) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }

            let status = error != nil ? "error" : "stopped"
            let sessionObject = self.createSessionObject(session, status: status)

            self.currentSession = nil
            self.remoteMediaClient = nil
            self.messageChannels.removeAll()

            self.listener?.onSessionEnd(sessionObject)
        }
    }

    public func sessionManager(_ sessionManager: GCKSessionManager, didFailToStart session: GCKCastSession, withError error: Error) {
        DispatchQueue.main.async { [weak self] in
            self?.pendingSessionCompletion?(.failure(error))
            self?.pendingSessionCompletion = nil
            self?.listener?.onSessionStartFailed(error.localizedDescription)
        }
    }

    public func sessionManager(_ sessionManager: GCKSessionManager, didSuspend session: GCKCastSession, with reason: GCKConnectionSuspendReason) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            let sessionObject = self.createSessionObject(session, status: "suspended")
            self.listener?.onSessionUpdate(sessionObject)
        }
    }

    public func sessionManager(_ sessionManager: GCKSessionManager, didResumeCastSession session: GCKCastSession) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            self.currentSession = session
            self.remoteMediaClient = session.remoteMediaClient
            self.setupMediaClientCallbacks()

            let sessionObject = self.createSessionObject(session, status: "connected")
            self.listener?.onSessionResumed(sessionObject)
            self.listener?.onSessionRejoin(sessionObject)
        }
    }

    public func sessionManager(_ sessionManager: GCKSessionManager, session: GCKCastSession, didUpdate device: GCKDevice) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            self.listener?.onSessionUpdate(self.createSessionObject(session, status: nil))
        }
    }

    public func sessionManager(_ sessionManager: GCKSessionManager, session: GCKCastSession, didReceiveDeviceVolume volume: Float, muted: Bool) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            self.listener?.onSessionUpdate(self.createSessionObject(session, status: nil))
        }
    }
}

// MARK: - GCKRemoteMediaClientListener
extension Chromecast: GCKRemoteMediaClientListener {

    public func remoteMediaClient(_ client: GCKRemoteMediaClient, didUpdate mediaStatus: GCKMediaStatus?) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self,
                  let mediaStatus = mediaStatus else { return }

            let mediaObject = self.createMediaObject(from: mediaStatus)
            self.listener?.onMediaUpdate(mediaObject)
        }
    }

    public func remoteMediaClientDidUpdateQueue(_ client: GCKRemoteMediaClient) {
        // Handle queue updates if needed
    }
}

// MARK: - GCKDiscoveryManagerListener
extension Chromecast: GCKDiscoveryManagerListener {

    public func didUpdateDeviceList() {
        DispatchQueue.main.async { [weak self] in
            guard let self = self,
                  let discoveryManager = self.discoveryManager else { return }

            let available = discoveryManager.deviceCount > 0
            self.listener?.onReceiverAvailableUpdate(available)
        }
    }
}

// MARK: - GCKRequestDelegate
extension Chromecast: GCKRequestDelegate {

    public func requestDidComplete(_ request: GCKRequest) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }

            // If this was a media load request
            if let mediaStatus = self.currentSession?.remoteMediaClient?.mediaStatus {
                let mediaObject = self.createMediaObject(from: mediaStatus)
                self.pendingMediaCompletion?(.success(mediaObject))
                self.pendingMediaCompletion = nil
                self.listener?.onMediaLoaded(mediaObject)
            }
        }
    }

    public func request(_ request: GCKRequest, didFailWithError error: GCKError) {
        DispatchQueue.main.async { [weak self] in
            self?.pendingMediaCompletion?(.failure(error))
            self?.pendingMediaCompletion = nil
        }
    }

    public func request(_ request: GCKRequest, didAbortWith abortReason: GCKRequestAbortReason) {
        DispatchQueue.main.async { [weak self] in
            self?.pendingMediaCompletion?(.failure(ChromecastError.cancelled))
            self?.pendingMediaCompletion = nil
        }
    }
}

// MARK: - GCKGenericChannelDelegate
extension Chromecast: GCKGenericChannelDelegate {

    public func cast(_ channel: GCKGenericChannel, didReceiveTextMessage message: String, withNamespace protocolNamespace: String) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            let deviceId = self.currentSession?.device.deviceID ?? ""
            self.listener?.onMessageReceived(deviceId, namespace: protocolNamespace, message: message)
        }
    }
}
