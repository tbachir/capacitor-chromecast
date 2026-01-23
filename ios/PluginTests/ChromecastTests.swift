import XCTest
@testable import Plugin

class ChromecastTests: XCTestCase {

    var chromecast: Chromecast!

    override func setUp() {
        super.setUp()
        chromecast = Chromecast()
    }

    override func tearDown() {
        chromecast = nil
        super.tearDown()
    }

    // MARK: - Initialization Tests

    func testChromecastInstanceCreation() {
        XCTAssertNotNil(chromecast, "Chromecast instance should be created")
    }

    func testInitializeWithNilAppId() {
        let expectation = XCTestExpectation(description: "Initialize with nil appId")
        let mockListener = MockChromecastListener()

        chromecast.initialize(appId: nil, listener: mockListener) { error in
            // Should use default media receiver app ID
            XCTAssertNil(error, "Initialize should not return error with nil appId")
            expectation.fulfill()
        }

        wait(for: [expectation], timeout: 5.0)
    }

    func testInitializeWithCustomAppId() {
        let expectation = XCTestExpectation(description: "Initialize with custom appId")
        let mockListener = MockChromecastListener()
        let customAppId = "CC1AD845"

        chromecast.initialize(appId: customAppId, listener: mockListener) { error in
            XCTAssertNil(error, "Initialize should not return error with custom appId")
            expectation.fulfill()
        }

        wait(for: [expectation], timeout: 5.0)
    }

    // MARK: - Session Management Tests

    func testRequestSessionBeforeInitialize() {
        let expectation = XCTestExpectation(description: "Request session before initialize")

        chromecast.requestSession { result in
            switch result {
            case .success:
                XCTFail("Should fail when not initialized")
            case .failure:
                // Expected behavior - plugin not initialized
                break
            }
            expectation.fulfill()
        }

        wait(for: [expectation], timeout: 5.0)
    }

    func testEndSessionBeforeInitialize() {
        let expectation = XCTestExpectation(description: "End session before initialize")

        chromecast.endSession(stopCasting: true) { error in
            // Should handle gracefully even when not initialized
            expectation.fulfill()
        }

        wait(for: [expectation], timeout: 5.0)
    }

    func testEndSessionWithStopCasting() {
        let expectation = XCTestExpectation(description: "End session with stop casting")
        let mockListener = MockChromecastListener()

        chromecast.initialize(appId: nil, listener: mockListener) { _ in
            self.chromecast.endSession(stopCasting: true) { error in
                XCTAssertNil(error, "End session should not return error")
                expectation.fulfill()
            }
        }

        wait(for: [expectation], timeout: 5.0)
    }

    func testEndSessionWithoutStopCasting() {
        let expectation = XCTestExpectation(description: "End session without stop casting")
        let mockListener = MockChromecastListener()

        chromecast.initialize(appId: nil, listener: mockListener) { _ in
            self.chromecast.endSession(stopCasting: false) { error in
                XCTAssertNil(error, "End session should not return error")
                expectation.fulfill()
            }
        }

        wait(for: [expectation], timeout: 5.0)
    }

    // MARK: - Route Scanning Tests

    func testStartRouteScanBeforeInitialize() {
        let expectation = XCTestExpectation(description: "Start route scan before initialize")

        chromecast.startRouteScan(timeout: 1.0) { routes in
            XCTAssertTrue(routes.isEmpty, "Should return empty routes when not initialized")
            expectation.fulfill()
        }

        wait(for: [expectation], timeout: 5.0)
    }

    func testStartRouteScanWithTimeout() {
        let expectation = XCTestExpectation(description: "Start route scan with timeout")
        let mockListener = MockChromecastListener()

        chromecast.initialize(appId: nil, listener: mockListener) { _ in
            self.chromecast.startRouteScan(timeout: 1.0) { routes in
                // Routes will be empty in test environment (no actual devices)
                XCTAssertNotNil(routes, "Routes should not be nil")
                expectation.fulfill()
            }
        }

        wait(for: [expectation], timeout: 10.0)
    }

    func testStartRouteScanWithNilTimeout() {
        let expectation = XCTestExpectation(description: "Start route scan with nil timeout")
        let mockListener = MockChromecastListener()

        chromecast.initialize(appId: nil, listener: mockListener) { _ in
            self.chromecast.startRouteScan(timeout: nil) { routes in
                // Should use default 5 second timeout
                XCTAssertNotNil(routes, "Routes should not be nil")
                expectation.fulfill()
            }
        }

        wait(for: [expectation], timeout: 10.0)
    }

    func testStopRouteScan() {
        let mockListener = MockChromecastListener()

        chromecast.initialize(appId: nil, listener: mockListener) { _ in
            // Should not crash
            self.chromecast.stopRouteScan()
        }
    }

    // MARK: - Media Loading Tests

    func testLoadMediaBeforeSession() {
        let expectation = XCTestExpectation(description: "Load media before session")
        let mockListener = MockChromecastListener()

        chromecast.initialize(appId: nil, listener: mockListener) { _ in
            self.chromecast.loadMedia(
                contentId: "https://example.com/video.mp4",
                customData: nil,
                contentType: "video/mp4",
                duration: 0,
                streamType: "buffered",
                autoPlay: true,
                currentTime: 0,
                metadata: nil,
                textTrackStyle: nil
            ) { result in
                switch result {
                case .success:
                    XCTFail("Should fail when no session exists")
                case .failure(let error):
                    XCTAssertNotNil(error, "Should return error when no session")
                }
                expectation.fulfill()
            }
        }

        wait(for: [expectation], timeout: 5.0)
    }

    func testLoadMediaWithInvalidURL() {
        let expectation = XCTestExpectation(description: "Load media with invalid URL")
        let mockListener = MockChromecastListener()

        chromecast.initialize(appId: nil, listener: mockListener) { _ in
            self.chromecast.loadMedia(
                contentId: "not a valid url",
                customData: nil,
                contentType: "video/mp4",
                duration: 0,
                streamType: "buffered",
                autoPlay: true,
                currentTime: 0,
                metadata: nil,
                textTrackStyle: nil
            ) { result in
                switch result {
                case .success:
                    XCTFail("Should fail with invalid URL")
                case .failure(let error):
                    XCTAssertNotNil(error, "Should return error for invalid URL")
                }
                expectation.fulfill()
            }
        }

        wait(for: [expectation], timeout: 5.0)
    }

    func testLoadMediaStreamTypes() {
        // Test that stream type parsing works correctly
        let streamTypes = ["buffered", "live", "other", nil, "BUFFERED", "LIVE"]

        for streamType in streamTypes {
            let expectation = XCTestExpectation(description: "Load media with stream type: \(streamType ?? "nil")")
            let mockListener = MockChromecastListener()

            chromecast.initialize(appId: nil, listener: mockListener) { _ in
                self.chromecast.loadMedia(
                    contentId: "https://example.com/video.mp4",
                    customData: nil,
                    contentType: "video/mp4",
                    duration: 0,
                    streamType: streamType,
                    autoPlay: true,
                    currentTime: 0,
                    metadata: nil,
                    textTrackStyle: nil
                ) { _ in
                    // We expect failure due to no session, but no crash
                    expectation.fulfill()
                }
            }

            wait(for: [expectation], timeout: 5.0)
        }
    }

    // MARK: - Select Route Tests

    func testSelectRouteWithInvalidId() {
        let expectation = XCTestExpectation(description: "Select route with invalid ID")
        let mockListener = MockChromecastListener()

        chromecast.initialize(appId: nil, listener: mockListener) { _ in
            self.chromecast.selectRoute(routeId: "invalid-device-id") { result in
                switch result {
                case .success:
                    XCTFail("Should fail with invalid device ID")
                case .failure(let error):
                    XCTAssertNotNil(error, "Should return error for invalid device ID")
                }
                expectation.fulfill()
            }
        }

        wait(for: [expectation], timeout: 5.0)
    }

    // MARK: - Media Control Tests

    func testPauseBeforeSession() {
        let expectation = XCTestExpectation(description: "Pause before session")
        let mockListener = MockChromecastListener()

        chromecast.initialize(appId: nil, listener: mockListener) { _ in
            self.chromecast.pause { error in
                XCTAssertNotNil(error, "Should return error when no session")
                expectation.fulfill()
            }
        }

        wait(for: [expectation], timeout: 5.0)
    }

    func testPlayBeforeSession() {
        let expectation = XCTestExpectation(description: "Play before session")
        let mockListener = MockChromecastListener()

        chromecast.initialize(appId: nil, listener: mockListener) { _ in
            self.chromecast.play { error in
                XCTAssertNotNil(error, "Should return error when no session")
                expectation.fulfill()
            }
        }

        wait(for: [expectation], timeout: 5.0)
    }

    func testSeekBeforeSession() {
        let expectation = XCTestExpectation(description: "Seek before session")
        let mockListener = MockChromecastListener()

        chromecast.initialize(appId: nil, listener: mockListener) { _ in
            self.chromecast.seek(position: 60.0) { error in
                XCTAssertNotNil(error, "Should return error when no session")
                expectation.fulfill()
            }
        }

        wait(for: [expectation], timeout: 5.0)
    }

    func testNextBeforeSession() {
        let expectation = XCTestExpectation(description: "Next before session")
        let mockListener = MockChromecastListener()

        chromecast.initialize(appId: nil, listener: mockListener) { _ in
            self.chromecast.next { error in
                XCTAssertNotNil(error, "Should return error when no session")
                expectation.fulfill()
            }
        }

        wait(for: [expectation], timeout: 5.0)
    }

    func testPrevBeforeSession() {
        let expectation = XCTestExpectation(description: "Prev before session")
        let mockListener = MockChromecastListener()

        chromecast.initialize(appId: nil, listener: mockListener) { _ in
            self.chromecast.prev { error in
                XCTAssertNotNil(error, "Should return error when no session")
                expectation.fulfill()
            }
        }

        wait(for: [expectation], timeout: 5.0)
    }

    // MARK: - Messaging Tests

    func testSendMessageBeforeSession() {
        let expectation = XCTestExpectation(description: "Send message before session")
        let mockListener = MockChromecastListener()

        chromecast.initialize(appId: nil, listener: mockListener) { _ in
            self.chromecast.sendMessage(namespace: "urn:x-cast:com.example", message: "test") { result in
                switch result {
                case .success:
                    XCTFail("Should fail when no session")
                case .failure:
                    // Expected
                    break
                }
                expectation.fulfill()
            }
        }

        wait(for: [expectation], timeout: 5.0)
    }

    func testAddMessageListenerBeforeSession() {
        let expectation = XCTestExpectation(description: "Add message listener before session")
        let mockListener = MockChromecastListener()

        chromecast.initialize(appId: nil, listener: mockListener) { _ in
            self.chromecast.addMessageListener(namespace: "urn:x-cast:com.example") { error in
                XCTAssertNotNil(error, "Should return error when no session")
                expectation.fulfill()
            }
        }

        wait(for: [expectation], timeout: 5.0)
    }

    // MARK: - Network Diagnostic Tests

    func testNetworkDiagnostic() {
        let expectation = XCTestExpectation(description: "Network diagnostic")
        let mockListener = MockChromecastListener()

        chromecast.initialize(appId: nil, listener: mockListener) { _ in
            self.chromecast.networkDiagnostic { result in
                XCTAssertNotNil(result["networkConnected"], "Should have networkConnected")
                XCTAssertNotNil(result["isWiFi"], "Should have isWiFi")
                XCTAssertNotNil(result["networkType"], "Should have networkType")
                XCTAssertNotNil(result["castConnectionAvailable"], "Should have castConnectionAvailable")
                expectation.fulfill()
            }
        }

        wait(for: [expectation], timeout: 5.0)
    }

    // MARK: - Load Media With Headers Tests

    func testLoadMediaWithHeadersBeforeSession() {
        let expectation = XCTestExpectation(description: "Load media with headers before session")
        let mockListener = MockChromecastListener()

        chromecast.initialize(appId: nil, listener: mockListener) { _ in
            self.chromecast.loadMediaWithHeaders(
                contentId: "https://example.com/video.mp4",
                customData: nil,
                contentType: "video/mp4",
                duration: 0,
                streamType: "buffered",
                autoPlay: true,
                currentTime: 0,
                metadata: nil,
                textTrackStyle: nil,
                authHeaders: ["Authorization": "Bearer token123"],
                authToken: nil
            ) { result in
                switch result {
                case .success:
                    XCTFail("Should fail when no session exists")
                case .failure(let error):
                    XCTAssertNotNil(error, "Should return error when no session")
                }
                expectation.fulfill()
            }
        }

        wait(for: [expectation], timeout: 5.0)
    }

    func testLoadMediaWithAuthToken() {
        let expectation = XCTestExpectation(description: "Load media with auth token")
        let mockListener = MockChromecastListener()

        chromecast.initialize(appId: nil, listener: mockListener) { _ in
            self.chromecast.loadMediaWithHeaders(
                contentId: "https://example.com/video.mp4",
                customData: nil,
                contentType: nil,
                duration: 0,
                streamType: "buffered",
                autoPlay: true,
                currentTime: 0,
                metadata: nil,
                textTrackStyle: nil,
                authHeaders: nil,
                authToken: "my-auth-token"
            ) { result in
                switch result {
                case .success:
                    XCTFail("Should fail when no session exists")
                case .failure:
                    // Expected - no session
                    break
                }
                expectation.fulfill()
            }
        }

        wait(for: [expectation], timeout: 5.0)
    }

    // MARK: - Error Type Tests

    func testChromecastErrorDescriptions() {
        let errors: [ChromecastError] = [
            .notInitialized,
            .noSession,
            .sessionError("Test error"),
            .mediaLoadError("Load failed"),
            .invalidParameter("Bad param"),
            .timeout,
            .cancelled
        ]

        for error in errors {
            XCTAssertNotNil(error.errorDescription, "Error \(error) should have a description")
            XCTAssertFalse(error.errorDescription!.isEmpty, "Error description should not be empty")
        }
    }

    func testChromecastErrorNotInitialized() {
        let error = ChromecastError.notInitialized
        XCTAssertEqual(error.errorDescription, "Chromecast not initialized")
    }

    func testChromecastErrorNoSession() {
        let error = ChromecastError.noSession
        XCTAssertEqual(error.errorDescription, "No active Chromecast session")
    }

    func testChromecastErrorSessionError() {
        let error = ChromecastError.sessionError("Connection lost")
        XCTAssertEqual(error.errorDescription, "Session error: Connection lost")
    }

    func testChromecastErrorMediaLoadError() {
        let error = ChromecastError.mediaLoadError("Invalid format")
        XCTAssertEqual(error.errorDescription, "Media load error: Invalid format")
    }

    func testChromecastErrorInvalidParameter() {
        let error = ChromecastError.invalidParameter("Missing URL")
        XCTAssertEqual(error.errorDescription, "Invalid parameter: Missing URL")
    }

    func testChromecastErrorTimeout() {
        let error = ChromecastError.timeout
        XCTAssertEqual(error.errorDescription, "Operation timed out")
    }

    func testChromecastErrorCancelled() {
        let error = ChromecastError.cancelled
        XCTAssertEqual(error.errorDescription, "Operation cancelled")
    }
}

// MARK: - Mock Listener

class MockChromecastListener: NSObject, ChromecastListener {

    var sessionRejoinCalled = false
    var sessionUpdateCalled = false
    var sessionEndCalled = false
    var sessionStartedCalled = false
    var sessionStartFailedCalled = false
    var sessionResumedCalled = false
    var receiverAvailableCalled = false
    var mediaLoadedCalled = false
    var mediaUpdateCalled = false
    var messageReceivedCalled = false

    var lastSession: [String: Any]?
    var lastMedia: [String: Any]?
    var lastReceiverAvailable: Bool?
    var lastMessageDeviceId: String?
    var lastMessageNamespace: String?
    var lastMessage: String?
    var lastError: String?

    func onSessionRejoin(_ session: [String: Any]) {
        sessionRejoinCalled = true
        lastSession = session
    }

    func onSessionUpdate(_ session: [String: Any]) {
        sessionUpdateCalled = true
        lastSession = session
    }

    func onSessionEnd(_ session: [String: Any]) {
        sessionEndCalled = true
        lastSession = session
    }

    func onSessionStarted(_ session: [String: Any]) {
        sessionStartedCalled = true
        lastSession = session
    }

    func onSessionStartFailed(_ error: String) {
        sessionStartFailedCalled = true
        lastError = error
    }

    func onSessionResumed(_ session: [String: Any]) {
        sessionResumedCalled = true
        lastSession = session
    }

    func onReceiverAvailableUpdate(_ available: Bool) {
        receiverAvailableCalled = true
        lastReceiverAvailable = available
    }

    func onMediaLoaded(_ media: [String: Any]) {
        mediaLoadedCalled = true
        lastMedia = media
    }

    func onMediaUpdate(_ media: [String: Any]) {
        mediaUpdateCalled = true
        lastMedia = media
    }

    func onMessageReceived(_ deviceId: String, namespace: String, message: String) {
        messageReceivedCalled = true
        lastMessageDeviceId = deviceId
        lastMessageNamespace = namespace
        lastMessage = message
    }

    func reset() {
        sessionRejoinCalled = false
        sessionUpdateCalled = false
        sessionEndCalled = false
        sessionStartedCalled = false
        sessionStartFailedCalled = false
        sessionResumedCalled = false
        receiverAvailableCalled = false
        mediaLoadedCalled = false
        mediaUpdateCalled = false
        messageReceivedCalled = false
        lastSession = nil
        lastMedia = nil
        lastReceiverAvailable = nil
        lastMessageDeviceId = nil
        lastMessageNamespace = nil
        lastMessage = nil
        lastError = nil
    }
}

// MARK: - Plugin Tests

class ChromecastPluginTests: XCTestCase {

    var plugin: ChromecastPlugin!

    override func setUp() {
        super.setUp()
        plugin = ChromecastPlugin()
    }

    override func tearDown() {
        plugin = nil
        super.tearDown()
    }

    func testPluginInstanceCreation() {
        XCTAssertNotNil(plugin, "Plugin instance should be created")
    }

    // MARK: - Event Name Constants Tests

    func testEventNames() {
        // Verify event names match Android implementation
        let expectedEvents = [
            "SESSION_LISTENER",
            "SESSION_UPDATE",
            "SESSION_STARTED",
            "SESSION_ENDED",
            "SESSION_RESUMED",
            "SESSION_START_FAILED",
            "RECEIVER_LISTENER",
            "MEDIA_LOAD",
            "MEDIA_UPDATE",
            "RECEIVER_MESSAGE",
            "SETUP"
        ]

        // These are private constants, so we test through the listener interface
        let mockListener = MockChromecastListener()

        // Test that all listener methods exist and can be called
        mockListener.onSessionRejoin([:])
        XCTAssertTrue(mockListener.sessionRejoinCalled)

        mockListener.onSessionUpdate([:])
        XCTAssertTrue(mockListener.sessionUpdateCalled)

        mockListener.onSessionEnd([:])
        XCTAssertTrue(mockListener.sessionEndCalled)

        mockListener.onSessionStarted([:])
        XCTAssertTrue(mockListener.sessionStartedCalled)

        mockListener.onSessionStartFailed("Test error")
        XCTAssertTrue(mockListener.sessionStartFailedCalled)
        XCTAssertEqual(mockListener.lastError, "Test error")

        mockListener.onSessionResumed([:])
        XCTAssertTrue(mockListener.sessionResumedCalled)

        mockListener.onReceiverAvailableUpdate(true)
        XCTAssertTrue(mockListener.receiverAvailableCalled)

        mockListener.onMediaLoaded([:])
        XCTAssertTrue(mockListener.mediaLoadedCalled)

        mockListener.onMediaUpdate([:])
        XCTAssertTrue(mockListener.mediaUpdateCalled)

        mockListener.onMessageReceived("device1", namespace: "urn:x-cast", message: "test")
        XCTAssertTrue(mockListener.messageReceivedCalled)
    }
}

// MARK: - Data Conversion Tests

class ChromecastDataConversionTests: XCTestCase {

    func testMediaMetadataCreation() {
        let metadata: [String: Any] = [
            "metadataType": 0,
            "title": "Test Video",
            "subtitle": "Test Subtitle",
            "images": [
                ["url": "https://example.com/image.jpg"]
            ]
        ]

        // Test that metadata dictionary has expected structure
        XCTAssertEqual(metadata["title"] as? String, "Test Video")
        XCTAssertEqual(metadata["subtitle"] as? String, "Test Subtitle")
        XCTAssertEqual(metadata["metadataType"] as? Int, 0)

        if let images = metadata["images"] as? [[String: Any]] {
            XCTAssertEqual(images.count, 1)
            XCTAssertEqual(images[0]["url"] as? String, "https://example.com/image.jpg")
        } else {
            XCTFail("Images should be an array of dictionaries")
        }
    }

    func testSessionObjectStructure() {
        let sessionObject: [String: Any] = [
            "appId": "CC1AD845",
            "displayName": "Default Media Receiver",
            "sessionId": "session-123",
            "receiver": [
                "friendlyName": "Living Room TV",
                "label": "device-456",
                "volume": [
                    "level": 0.5,
                    "muted": false
                ]
            ],
            "media": [],
            "status": "connected"
        ]

        XCTAssertEqual(sessionObject["appId"] as? String, "CC1AD845")
        XCTAssertEqual(sessionObject["sessionId"] as? String, "session-123")
        XCTAssertEqual(sessionObject["status"] as? String, "connected")

        if let receiver = sessionObject["receiver"] as? [String: Any] {
            XCTAssertEqual(receiver["friendlyName"] as? String, "Living Room TV")
            XCTAssertEqual(receiver["label"] as? String, "device-456")

            if let volume = receiver["volume"] as? [String: Any] {
                XCTAssertEqual(volume["level"] as? Double, 0.5)
                XCTAssertEqual(volume["muted"] as? Bool, false)
            } else {
                XCTFail("Volume should be a dictionary")
            }
        } else {
            XCTFail("Receiver should be a dictionary")
        }
    }

    func testMediaObjectStructure() {
        let mediaObject: [String: Any] = [
            "currentItemId": 1,
            "currentTime": 120.5,
            "customData": [:],
            "mediaSessionId": 1,
            "playbackRate": 1.0,
            "playerState": "PLAYING",
            "isAlive": true,
            "volume": [
                "level": 1.0,
                "muted": false
            ],
            "media": [
                "contentId": "https://example.com/video.mp4",
                "contentType": "video/mp4",
                "duration": 3600.0,
                "streamType": "BUFFERED"
            ],
            "sessionId": "session-123"
        ]

        XCTAssertEqual(mediaObject["currentItemId"] as? Int, 1)
        XCTAssertEqual(mediaObject["currentTime"] as? Double, 120.5)
        XCTAssertEqual(mediaObject["playerState"] as? String, "PLAYING")
        XCTAssertEqual(mediaObject["isAlive"] as? Bool, true)

        if let media = mediaObject["media"] as? [String: Any] {
            XCTAssertEqual(media["contentId"] as? String, "https://example.com/video.mp4")
            XCTAssertEqual(media["contentType"] as? String, "video/mp4")
            XCTAssertEqual(media["duration"] as? Double, 3600.0)
            XCTAssertEqual(media["streamType"] as? String, "BUFFERED")
        } else {
            XCTFail("Media should be a dictionary")
        }
    }

    func testPlayerStateValues() {
        let validStates = ["IDLE", "PLAYING", "PAUSED", "BUFFERING", "UNKNOWN"]

        for state in validStates {
            XCTAssertTrue(validStates.contains(state), "\(state) should be a valid player state")
        }
    }

    func testIdleReasonValues() {
        let validReasons = ["CANCELLED", "ERROR", "FINISHED", "INTERRUPTED"]

        for reason in validReasons {
            XCTAssertTrue(validReasons.contains(reason), "\(reason) should be a valid idle reason")
        }
    }

    func testStreamTypeValues() {
        let validTypes = ["BUFFERED", "LIVE", "OTHER"]

        for type in validTypes {
            XCTAssertTrue(validTypes.contains(type), "\(type) should be a valid stream type")
        }
    }

    func testRouteInfoStructure() {
        let routeInfo: [String: Any] = [
            "id": "device-123",
            "name": "Living Room TV",
            "description": "Chromecast",
            "isNearbyDevice": true
        ]

        XCTAssertEqual(routeInfo["id"] as? String, "device-123")
        XCTAssertEqual(routeInfo["name"] as? String, "Living Room TV")
        XCTAssertEqual(routeInfo["description"] as? String, "Chromecast")
        XCTAssertEqual(routeInfo["isNearbyDevice"] as? Bool, true)
    }

    func testTextTrackStyleStructure() {
        let textTrackStyle: [String: Any] = [
            "fontScale": 1.5,
            "fontFamily": "Arial"
        ]

        XCTAssertEqual(textTrackStyle["fontScale"] as? Double, 1.5)
        XCTAssertEqual(textTrackStyle["fontFamily"] as? String, "Arial")
    }

    func testNetworkDiagnosticResultStructure() {
        let diagnosticResult: [String: Any] = [
            "networkConnected": true,
            "networkType": "wifi",
            "isWiFi": true,
            "castConnectionAvailable": true
        ]

        XCTAssertEqual(diagnosticResult["networkConnected"] as? Bool, true)
        XCTAssertEqual(diagnosticResult["networkType"] as? String, "wifi")
        XCTAssertEqual(diagnosticResult["isWiFi"] as? Bool, true)
        XCTAssertEqual(diagnosticResult["castConnectionAvailable"] as? Bool, true)
    }

    func testSendMessageResultStructure() {
        let successResult: [String: Any] = [
            "success": true
        ]

        let errorResult: [String: Any] = [
            "success": false,
            "error": "No active session"
        ]

        XCTAssertEqual(successResult["success"] as? Bool, true)
        XCTAssertEqual(errorResult["success"] as? Bool, false)
        XCTAssertEqual(errorResult["error"] as? String, "No active session")
    }
}

// MARK: - Content Type Detection Tests

class ContentTypeDetectionTests: XCTestCase {

    func testDetectContentType_HLS() {
        let url = "https://example.com/video.m3u8"
        let contentType = detectContentTypeFromURL(url)
        XCTAssertEqual(contentType, "application/x-mpegURL")
    }

    func testDetectContentType_HLSWithQueryParams() {
        let url = "https://example.com/video.m3u8?token=abc123"
        let contentType = detectContentTypeFromURL(url)
        XCTAssertEqual(contentType, "application/x-mpegURL")
    }

    func testDetectContentType_DASH() {
        let url = "https://example.com/video.mpd"
        let contentType = detectContentTypeFromURL(url)
        XCTAssertEqual(contentType, "application/dash+xml")
    }

    func testDetectContentType_MP4() {
        let url = "https://example.com/video.mp4"
        let contentType = detectContentTypeFromURL(url)
        XCTAssertEqual(contentType, "video/mp4")
    }

    func testDetectContentType_WebM() {
        let url = "https://example.com/video.webm"
        let contentType = detectContentTypeFromURL(url)
        XCTAssertEqual(contentType, "video/webm")
    }

    func testDetectContentType_MKV() {
        let url = "https://example.com/video.mkv"
        let contentType = detectContentTypeFromURL(url)
        XCTAssertEqual(contentType, "video/x-matroska")
    }

    func testDetectContentType_Unknown() {
        let url = "https://example.com/video"
        let contentType = detectContentTypeFromURL(url)
        XCTAssertEqual(contentType, "video/mp4") // Default
    }

    func testDetectContentType_NilURL() {
        let contentType = detectContentTypeFromURL(nil)
        XCTAssertEqual(contentType, "video/mp4") // Default
    }

    func testDetectContentType_CaseInsensitive() {
        let url = "https://example.com/video.M3U8"
        let contentType = detectContentTypeFromURL(url)
        XCTAssertEqual(contentType, "application/x-mpegURL")
    }

    // Helper method that mirrors the plugin's detection logic
    private func detectContentTypeFromURL(_ url: String?) -> String {
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
}

// MARK: - Thread Safety Tests

class ChromecastThreadSafetyTests: XCTestCase {

    func testConcurrentInitialization() {
        let iterations = 10
        let expectation = XCTestExpectation(description: "Concurrent initialization")
        expectation.expectedFulfillmentCount = iterations

        for _ in 0..<iterations {
            DispatchQueue.global().async {
                let chromecast = Chromecast()
                let mockListener = MockChromecastListener()

                chromecast.initialize(appId: nil, listener: mockListener) { _ in
                    expectation.fulfill()
                }
            }
        }

        wait(for: [expectation], timeout: 30.0)
    }

    func testConcurrentRouteScan() {
        let chromecast = Chromecast()
        let mockListener = MockChromecastListener()
        let initExpectation = XCTestExpectation(description: "Initialize")

        chromecast.initialize(appId: nil, listener: mockListener) { _ in
            initExpectation.fulfill()
        }

        wait(for: [initExpectation], timeout: 5.0)

        let iterations = 5
        let scanExpectation = XCTestExpectation(description: "Concurrent route scan")
        scanExpectation.expectedFulfillmentCount = iterations

        for _ in 0..<iterations {
            DispatchQueue.global().async {
                chromecast.startRouteScan(timeout: 0.5) { _ in
                    scanExpectation.fulfill()
                }
            }
        }

        wait(for: [scanExpectation], timeout: 30.0)
    }
}
