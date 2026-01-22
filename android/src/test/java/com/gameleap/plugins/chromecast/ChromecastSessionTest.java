package com.gameleap.plugins.chromecast;

import static org.junit.Assert.*;

import org.junit.Test;

import java.lang.reflect.Method;

/**
 * Unit tests for ChromecastSession.
 */
public class ChromecastSessionTest {

    // ==================== Method Existence Tests ====================

    @Test
    public void testHasSetSessionMethod() throws NoSuchMethodException {
        Method method = ChromecastSession.class.getMethod("setSession",
            com.google.android.gms.cast.framework.CastSession.class);
        assertNotNull("setSession method should exist", method);
    }

    @Test
    public void testHasAddMessageListenerMethod() throws NoSuchMethodException {
        Method method = ChromecastSession.class.getMethod("addMessageListener", String.class);
        assertNotNull("addMessageListener method should exist", method);
    }

    @Test
    public void testHasSendMessageMethod() throws NoSuchMethodException {
        Method method = ChromecastSession.class.getMethod("sendMessage",
            String.class, String.class,
            com.google.android.gms.common.api.ResultCallback.class);
        assertNotNull("sendMessage method should exist", method);
    }

    @Test
    public void testHasPauseMethod() throws NoSuchMethodException {
        Method method = ChromecastSession.class.getMethod("pause");
        assertNotNull("pause method should exist", method);
    }

    @Test
    public void testHasPlayMethod() throws NoSuchMethodException {
        Method method = ChromecastSession.class.getMethod("play");
        assertNotNull("play method should exist", method);
    }

    @Test
    public void testHasSeekMethod() throws NoSuchMethodException {
        Method method = ChromecastSession.class.getMethod("seek", long.class);
        assertNotNull("seek method should exist", method);
    }

    @Test
    public void testHasNextMethod() throws NoSuchMethodException {
        Method method = ChromecastSession.class.getMethod("next");
        assertNotNull("next method should exist", method);
    }

    @Test
    public void testHasPrevMethod() throws NoSuchMethodException {
        Method method = ChromecastSession.class.getMethod("prev");
        assertNotNull("prev method should exist", method);
    }

    @Test
    public void testHasLoadMediaMethod() throws NoSuchMethodException {
        Method method = ChromecastSession.class.getMethod("loadMedia",
            String.class,           // contentId
            org.json.JSONObject.class,  // customData
            String.class,           // contentType
            long.class,             // duration
            String.class,           // streamType
            boolean.class,          // autoPlay
            double.class,           // currentTime
            org.json.JSONObject.class,  // metadata
            org.json.JSONObject.class,  // textTrackStyle
            com.getcapacitor.PluginCall.class);  // callback
        assertNotNull("loadMedia method should exist", method);
    }

    // ==================== Listener Interface Tests ====================

    @Test
    public void testListenerInterface_HasOnMediaLoaded() throws NoSuchMethodException {
        Method method = ChromecastSession.Listener.class.getMethod("onMediaLoaded",
            org.json.JSONObject.class);
        assertNotNull("Listener.onMediaLoaded should exist", method);
    }

    @Test
    public void testListenerInterface_HasOnMediaUpdate() throws NoSuchMethodException {
        Method method = ChromecastSession.Listener.class.getMethod("onMediaUpdate",
            org.json.JSONObject.class);
        assertNotNull("Listener.onMediaUpdate should exist", method);
    }

    @Test
    public void testListenerInterface_HasOnSessionUpdate() throws NoSuchMethodException {
        Method method = ChromecastSession.Listener.class.getMethod("onSessionUpdate",
            org.json.JSONObject.class);
        assertNotNull("Listener.onSessionUpdate should exist", method);
    }

    @Test
    public void testListenerInterface_HasOnSessionEnd() throws NoSuchMethodException {
        Method method = ChromecastSession.Listener.class.getMethod("onSessionEnd",
            org.json.JSONObject.class);
        assertNotNull("Listener.onSessionEnd should exist", method);
    }

    // ==================== Constructor Test ====================

    @Test
    public void testConstructor() throws NoSuchMethodException {
        // Verify constructor exists with correct parameters
        java.lang.reflect.Constructor<?> constructor = ChromecastSession.class.getConstructor(
            android.app.Activity.class,
            ChromecastSession.Listener.class);
        assertNotNull("Constructor should exist with Activity and Listener params", constructor);
    }

    // ==================== Media Control Method Signature Tests ====================

    @Test
    public void testPauseMethodSignature() throws NoSuchMethodException {
        Method method = ChromecastSession.class.getMethod("pause");
        assertEquals("pause should return void", void.class, method.getReturnType());
        assertEquals("pause should take no parameters", 0, method.getParameterCount());
    }

    @Test
    public void testPlayMethodSignature() throws NoSuchMethodException {
        Method method = ChromecastSession.class.getMethod("play");
        assertEquals("play should return void", void.class, method.getReturnType());
        assertEquals("play should take no parameters", 0, method.getParameterCount());
    }

    @Test
    public void testSeekMethodSignature() throws NoSuchMethodException {
        Method method = ChromecastSession.class.getMethod("seek", long.class);
        assertEquals("seek should return void", void.class, method.getReturnType());
        assertEquals("seek should take 1 parameter", 1, method.getParameterCount());
        assertEquals("seek parameter should be long", long.class, method.getParameterTypes()[0]);
    }

    @Test
    public void testNextMethodSignature() throws NoSuchMethodException {
        Method method = ChromecastSession.class.getMethod("next");
        assertEquals("next should return void", void.class, method.getReturnType());
        assertEquals("next should take no parameters", 0, method.getParameterCount());
    }

    @Test
    public void testPrevMethodSignature() throws NoSuchMethodException {
        Method method = ChromecastSession.class.getMethod("prev");
        assertEquals("prev should return void", void.class, method.getReturnType());
        assertEquals("prev should take no parameters", 0, method.getParameterCount());
    }
}
