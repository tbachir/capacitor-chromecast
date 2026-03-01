package com.tbachir.plugins.chromecast;

import static org.junit.Assert.*;

import java.lang.reflect.Method;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;

/**
 * Unit tests for the Chromecast plugin.
 */
@RunWith(RobolectricTestRunner.class)
public class ChromecastTest {

    private Chromecast chromecast;

    @Before
    public void setUp() {
        chromecast = new Chromecast();
    }

    // ==================== Plugin Instance Tests ====================

    @Test
    public void testPluginCreation() {
        assertNotNull("Chromecast plugin should be created", chromecast);
    }

    // ==================== Plugin Method Existence Tests ====================

    @Test
    public void testHasInitializeMethod() throws NoSuchMethodException {
        Method method = Chromecast.class.getMethod("initialize", com.getcapacitor.PluginCall.class);
        assertNotNull("initialize method should exist", method);
    }

    @Test
    public void testHasRequestSessionMethod() throws NoSuchMethodException {
        Method method = Chromecast.class.getMethod("requestSession", com.getcapacitor.PluginCall.class);
        assertNotNull("requestSession method should exist", method);
    }

    @Test
    public void testHasSelectRouteMethod() throws NoSuchMethodException {
        Method method = Chromecast.class.getMethod("selectRoute", com.getcapacitor.PluginCall.class);
        assertNotNull("selectRoute method should exist", method);
    }

    @Test
    public void testHasLoadMediaMethod() throws NoSuchMethodException {
        Method method = Chromecast.class.getMethod("loadMedia", com.getcapacitor.PluginCall.class);
        assertNotNull("loadMedia method should exist", method);
    }

    @Test
    public void testHasLoadMediaWithHeadersMethod() throws NoSuchMethodException {
        Method method = Chromecast.class.getMethod("loadMediaWithHeaders", com.getcapacitor.PluginCall.class);
        assertNotNull("loadMediaWithHeaders method should exist", method);
    }

    @Test
    public void testHasLaunchMediaMethod() throws NoSuchMethodException {
        Method method = Chromecast.class.getMethod("launchMedia", com.getcapacitor.PluginCall.class);
        assertNotNull("launchMedia method should exist", method);
    }

    @Test
    public void testHasMediaPauseMethod() throws NoSuchMethodException {
        Method method = Chromecast.class.getMethod("mediaPause", com.getcapacitor.PluginCall.class);
        assertNotNull("mediaPause method should exist", method);
    }

    @Test
    public void testHasMediaPlayMethod() throws NoSuchMethodException {
        Method method = Chromecast.class.getMethod("mediaPlay", com.getcapacitor.PluginCall.class);
        assertNotNull("mediaPlay method should exist", method);
    }

    @Test
    public void testHasMediaSeekMethod() throws NoSuchMethodException {
        Method method = Chromecast.class.getMethod("mediaSeek", com.getcapacitor.PluginCall.class);
        assertNotNull("mediaSeek method should exist", method);
    }

    @Test
    public void testHasMediaNextMethod() throws NoSuchMethodException {
        Method method = Chromecast.class.getMethod("mediaNext", com.getcapacitor.PluginCall.class);
        assertNotNull("mediaNext method should exist", method);
    }

    @Test
    public void testHasMediaPrevMethod() throws NoSuchMethodException {
        Method method = Chromecast.class.getMethod("mediaPrev", com.getcapacitor.PluginCall.class);
        assertNotNull("mediaPrev method should exist", method);
    }

    @Test
    public void testHasSessionStopMethod() throws NoSuchMethodException {
        Method method = Chromecast.class.getMethod("sessionStop", com.getcapacitor.PluginCall.class);
        assertNotNull("sessionStop method should exist", method);
    }

    @Test
    public void testHasSessionLeaveMethod() throws NoSuchMethodException {
        Method method = Chromecast.class.getMethod("sessionLeave", com.getcapacitor.PluginCall.class);
        assertNotNull("sessionLeave method should exist", method);
    }

    @Test
    public void testHasStartRouteScanMethod() throws NoSuchMethodException {
        Method method = Chromecast.class.getMethod("startRouteScan", com.getcapacitor.PluginCall.class);
        assertNotNull("startRouteScan method should exist", method);
    }

    @Test
    public void testHasStopRouteScanMethod() throws NoSuchMethodException {
        Method method = Chromecast.class.getMethod("stopRouteScan", com.getcapacitor.PluginCall.class);
        assertNotNull("stopRouteScan method should exist", method);
    }

    @Test
    public void testHasSendMessageMethod() throws NoSuchMethodException {
        Method method = Chromecast.class.getMethod("sendMessage", com.getcapacitor.PluginCall.class);
        assertNotNull("sendMessage method should exist", method);
    }

    @Test
    public void testHasAddMessageListenerMethod() throws NoSuchMethodException {
        Method method = Chromecast.class.getMethod("addMessageListener", com.getcapacitor.PluginCall.class);
        assertNotNull("addMessageListener method should exist", method);
    }

    @Test
    public void testHasRemoveMessageListenerMethod() throws NoSuchMethodException {
        Method method = Chromecast.class.getMethod("removeMessageListener", com.getcapacitor.PluginCall.class);
        assertNotNull("removeMessageListener method should exist", method);
    }

    @Test
    public void testHasNetworkDiagnosticMethod() throws NoSuchMethodException {
        Method method = Chromecast.class.getMethod("networkDiagnostic", com.getcapacitor.PluginCall.class);
        assertNotNull("networkDiagnostic method should exist", method);
    }

    // ==================== Content Type Detection Tests ====================

    @Test
    public void testDetectContentType_HLS() throws Exception {
        Method method = Chromecast.class.getDeclaredMethod("detectContentType", String.class, String.class);
        method.setAccessible(true);

        String result = (String) method.invoke(chromecast, "https://example.com/video.m3u8", null);
        assertEquals("application/x-mpegURL", result);
    }

    @Test
    public void testDetectContentType_HLS_WithQueryParams() throws Exception {
        Method method = Chromecast.class.getDeclaredMethod("detectContentType", String.class, String.class);
        method.setAccessible(true);

        String result = (String) method.invoke(chromecast, "https://example.com/video.m3u8?token=abc", null);
        assertEquals("application/x-mpegURL", result);
    }

    @Test
    public void testDetectContentType_DASH() throws Exception {
        Method method = Chromecast.class.getDeclaredMethod("detectContentType", String.class, String.class);
        method.setAccessible(true);

        String result = (String) method.invoke(chromecast, "https://example.com/video.mpd", null);
        assertEquals("application/dash+xml", result);
    }

    @Test
    public void testDetectContentType_MP4() throws Exception {
        Method method = Chromecast.class.getDeclaredMethod("detectContentType", String.class, String.class);
        method.setAccessible(true);

        String result = (String) method.invoke(chromecast, "https://example.com/video.mp4", null);
        assertEquals("video/mp4", result);
    }

    @Test
    public void testDetectContentType_WebM() throws Exception {
        Method method = Chromecast.class.getDeclaredMethod("detectContentType", String.class, String.class);
        method.setAccessible(true);

        String result = (String) method.invoke(chromecast, "https://example.com/video.webm", null);
        assertEquals("video/webm", result);
    }

    @Test
    public void testDetectContentType_MKV() throws Exception {
        Method method = Chromecast.class.getDeclaredMethod("detectContentType", String.class, String.class);
        method.setAccessible(true);

        String result = (String) method.invoke(chromecast, "https://example.com/video.mkv", null);
        assertEquals("video/x-matroska", result);
    }

    @Test
    public void testDetectContentType_UsesProvidedType() throws Exception {
        Method method = Chromecast.class.getDeclaredMethod("detectContentType", String.class, String.class);
        method.setAccessible(true);

        String result = (String) method.invoke(chromecast, "https://example.com/video", "video/mp4");
        assertEquals("video/mp4", result);
    }

    @Test
    public void testDetectContentType_DefaultsToMP4() throws Exception {
        Method method = Chromecast.class.getDeclaredMethod("detectContentType", String.class, String.class);
        method.setAccessible(true);

        String result = (String) method.invoke(chromecast, "https://example.com/video", null);
        assertEquals("video/mp4", result);
    }

    @Test
    public void testDetectContentType_NullUrl() throws Exception {
        Method method = Chromecast.class.getDeclaredMethod("detectContentType", String.class, String.class);
        method.setAccessible(true);

        String result = (String) method.invoke(chromecast, null, "video/mp4");
        assertEquals("video/mp4", result);
    }

    @Test
    public void testDetectContentType_NullUrlAndType() throws Exception {
        Method method = Chromecast.class.getDeclaredMethod("detectContentType", String.class, String.class);
        method.setAccessible(true);

        String result = (String) method.invoke(chromecast, null, null);
        assertEquals("video/mp4", result);
    }

    // ==================== Error Message Tests ====================

    @Test
    public void testGetErrorMessage_AuthenticationFailed() throws Exception {
        Method method = Chromecast.class.getDeclaredMethod("getErrorMessage", int.class);
        method.setAccessible(true);

        String result = (String) method.invoke(chromecast, 2000);
        assertEquals("Authentication failed", result);
    }

    @Test
    public void testGetErrorMessage_InvalidRequest() throws Exception {
        Method method = Chromecast.class.getDeclaredMethod("getErrorMessage", int.class);
        method.setAccessible(true);

        String result = (String) method.invoke(chromecast, 2001);
        assertEquals("Invalid request", result);
    }

    @Test
    public void testGetErrorMessage_RequestCancelled() throws Exception {
        Method method = Chromecast.class.getDeclaredMethod("getErrorMessage", int.class);
        method.setAccessible(true);

        String result = (String) method.invoke(chromecast, 2002);
        assertEquals("Request cancelled", result);
    }

    @Test
    public void testGetErrorMessage_ApplicationNotFound() throws Exception {
        Method method = Chromecast.class.getDeclaredMethod("getErrorMessage", int.class);
        method.setAccessible(true);

        String result = (String) method.invoke(chromecast, 2004);
        assertEquals("Application not found", result);
    }

    @Test
    public void testGetErrorMessage_ReceiverNotFound() throws Exception {
        Method method = Chromecast.class.getDeclaredMethod("getErrorMessage", int.class);
        method.setAccessible(true);

        String result = (String) method.invoke(chromecast, 2475);
        assertEquals("Receiver application not found - check your internet connection and App ID", result);
    }

    @Test
    public void testGetErrorMessage_NetworkError() throws Exception {
        Method method = Chromecast.class.getDeclaredMethod("getErrorMessage", int.class);
        method.setAccessible(true);

        String result = (String) method.invoke(chromecast, 7);
        assertEquals("Network error", result);
    }

    @Test
    public void testGetErrorMessage_InternalError() throws Exception {
        Method method = Chromecast.class.getDeclaredMethod("getErrorMessage", int.class);
        method.setAccessible(true);

        String result = (String) method.invoke(chromecast, 8);
        assertEquals("Internal error", result);
    }

    @Test
    public void testGetErrorMessage_Timeout() throws Exception {
        Method method = Chromecast.class.getDeclaredMethod("getErrorMessage", int.class);
        method.setAccessible(true);

        String result = (String) method.invoke(chromecast, 15);
        assertEquals("Request timeout", result);
    }

    @Test
    public void testGetErrorMessage_UnknownError() throws Exception {
        Method method = Chromecast.class.getDeclaredMethod("getErrorMessage", int.class);
        method.setAccessible(true);

        String result = (String) method.invoke(chromecast, 9999);
        assertEquals("Unknown error (code: 9999)", result);
    }

    // ==================== Plugin Annotation Tests ====================

    @Test
    public void testPluginMethodAnnotations() {
        // Verify that key methods have @PluginMethod annotation
        Method[] methods = Chromecast.class.getMethods();

        String[] expectedPluginMethods = {
            "initialize",
            "requestSession",
            "selectRoute",
            "loadMedia",
            "loadMediaWithHeaders",
            "launchMedia",
            "mediaPause",
            "mediaPlay",
            "mediaSeek",
            "mediaNext",
            "mediaPrev",
            "sessionStop",
            "sessionLeave",
            "startRouteScan",
            "stopRouteScan",
            "sendMessage",
            "addMessageListener",
            "removeMessageListener",
            "networkDiagnostic"
        };

        for (String methodName : expectedPluginMethods) {
            boolean found = false;
            for (Method method : methods) {
                if (method.getName().equals(methodName)) {
                    boolean hasAnnotation = method.isAnnotationPresent(com.getcapacitor.PluginMethod.class);
                    assertTrue("Method " + methodName + " should have @PluginMethod annotation", hasAnnotation);
                    found = true;
                    break;
                }
            }
            assertTrue("Method " + methodName + " should exist", found);
        }
    }
}
