package com.tbachir.plugins.chromecast;

import static org.junit.Assert.*;

import com.google.android.gms.cast.MediaInfo;
import com.google.android.gms.cast.MediaMetadata;
import com.google.android.gms.cast.MediaStatus;
import org.json.JSONException;
import org.json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;

/**
 * Unit tests for ChromecastUtilities.
 */
@RunWith(RobolectricTestRunner.class)
public class ChromecastUtilitiesTest {

    // ==================== getMediaIdleReason Tests ====================

    @Test
    public void testGetMediaIdleReason_Cancelled() {
        assertEquals("CANCELLED", ChromecastUtilities.getMediaIdleReason(MediaStatus.IDLE_REASON_CANCELED));
    }

    @Test
    public void testGetMediaIdleReason_Error() {
        assertEquals("ERROR", ChromecastUtilities.getMediaIdleReason(MediaStatus.IDLE_REASON_ERROR));
    }

    @Test
    public void testGetMediaIdleReason_Finished() {
        assertEquals("FINISHED", ChromecastUtilities.getMediaIdleReason(MediaStatus.IDLE_REASON_FINISHED));
    }

    @Test
    public void testGetMediaIdleReason_Interrupted() {
        assertEquals("INTERRUPTED", ChromecastUtilities.getMediaIdleReason(MediaStatus.IDLE_REASON_INTERRUPTED));
    }

    @Test
    public void testGetMediaIdleReason_None() {
        assertNull(ChromecastUtilities.getMediaIdleReason(MediaStatus.IDLE_REASON_NONE));
    }

    @Test
    public void testGetMediaIdleReason_Unknown() {
        assertNull(ChromecastUtilities.getMediaIdleReason(-999));
    }

    // ==================== getMediaPlayerState Tests ====================

    @Test
    public void testGetMediaPlayerState_Buffering() {
        assertEquals("BUFFERING", ChromecastUtilities.getMediaPlayerState(MediaStatus.PLAYER_STATE_BUFFERING));
    }

    @Test
    public void testGetMediaPlayerState_Loading() {
        assertEquals("BUFFERING", ChromecastUtilities.getMediaPlayerState(MediaStatus.PLAYER_STATE_LOADING));
    }

    @Test
    public void testGetMediaPlayerState_Idle() {
        assertEquals("IDLE", ChromecastUtilities.getMediaPlayerState(MediaStatus.PLAYER_STATE_IDLE));
    }

    @Test
    public void testGetMediaPlayerState_Paused() {
        assertEquals("PAUSED", ChromecastUtilities.getMediaPlayerState(MediaStatus.PLAYER_STATE_PAUSED));
    }

    @Test
    public void testGetMediaPlayerState_Playing() {
        assertEquals("PLAYING", ChromecastUtilities.getMediaPlayerState(MediaStatus.PLAYER_STATE_PLAYING));
    }

    @Test
    public void testGetMediaPlayerState_Unknown() {
        assertEquals("UNKNOWN", ChromecastUtilities.getMediaPlayerState(MediaStatus.PLAYER_STATE_UNKNOWN));
    }

    @Test
    public void testGetMediaPlayerState_Invalid() {
        assertNull(ChromecastUtilities.getMediaPlayerState(-999));
    }

    // ==================== getRepeatMode Tests ====================

    @Test
    public void testGetRepeatMode_Off() {
        assertEquals("REPEAT_OFF", ChromecastUtilities.getRepeatMode(MediaStatus.REPEAT_MODE_REPEAT_OFF));
    }

    @Test
    public void testGetRepeatMode_All() {
        assertEquals("REPEAT_ALL", ChromecastUtilities.getRepeatMode(MediaStatus.REPEAT_MODE_REPEAT_ALL));
    }

    @Test
    public void testGetRepeatMode_Single() {
        assertEquals("REPEAT_SINGLE", ChromecastUtilities.getRepeatMode(MediaStatus.REPEAT_MODE_REPEAT_SINGLE));
    }

    @Test
    public void testGetRepeatMode_AllAndShuffle() {
        assertEquals("REPEAT_ALL_AND_SHUFFLE", ChromecastUtilities.getRepeatMode(MediaStatus.REPEAT_MODE_REPEAT_ALL_AND_SHUFFLE));
    }

    @Test
    public void testGetRepeatMode_Invalid() {
        assertNull(ChromecastUtilities.getRepeatMode(-999));
    }

    // ==================== getAndroidRepeatMode Tests ====================

    @Test
    public void testGetAndroidRepeatMode_Off() throws JSONException {
        assertEquals(MediaStatus.REPEAT_MODE_REPEAT_OFF, ChromecastUtilities.getAndroidRepeatMode("REPEAT_OFF"));
    }

    @Test
    public void testGetAndroidRepeatMode_All() throws JSONException {
        assertEquals(MediaStatus.REPEAT_MODE_REPEAT_ALL, ChromecastUtilities.getAndroidRepeatMode("REPEAT_ALL"));
    }

    @Test
    public void testGetAndroidRepeatMode_Single() throws JSONException {
        assertEquals(MediaStatus.REPEAT_MODE_REPEAT_SINGLE, ChromecastUtilities.getAndroidRepeatMode("REPEAT_SINGLE"));
    }

    @Test
    public void testGetAndroidRepeatMode_AllAndShuffle() throws JSONException {
        assertEquals(MediaStatus.REPEAT_MODE_REPEAT_ALL_AND_SHUFFLE, ChromecastUtilities.getAndroidRepeatMode("REPEAT_ALL_AND_SHUFFLE"));
    }

    @Test(expected = JSONException.class)
    public void testGetAndroidRepeatMode_Invalid() throws JSONException {
        ChromecastUtilities.getAndroidRepeatMode("INVALID_MODE");
    }

    // ==================== getAndroidMetadataName Tests ====================

    @Test
    public void testGetAndroidMetadataName_Title() {
        assertEquals(MediaMetadata.KEY_TITLE, ChromecastUtilities.getAndroidMetadataName("title"));
    }

    @Test
    public void testGetAndroidMetadataName_Subtitle() {
        assertEquals(MediaMetadata.KEY_SUBTITLE, ChromecastUtilities.getAndroidMetadataName("subtitle"));
    }

    @Test
    public void testGetAndroidMetadataName_Artist() {
        assertEquals(MediaMetadata.KEY_ARTIST, ChromecastUtilities.getAndroidMetadataName("artist"));
    }

    @Test
    public void testGetAndroidMetadataName_AlbumName() {
        assertEquals(MediaMetadata.KEY_ALBUM_TITLE, ChromecastUtilities.getAndroidMetadataName("albumName"));
    }

    @Test
    public void testGetAndroidMetadataName_AlbumArtist() {
        assertEquals(MediaMetadata.KEY_ALBUM_ARTIST, ChromecastUtilities.getAndroidMetadataName("albumArtist"));
    }

    @Test
    public void testGetAndroidMetadataName_Composer() {
        assertEquals(MediaMetadata.KEY_COMPOSER, ChromecastUtilities.getAndroidMetadataName("composer"));
    }

    @Test
    public void testGetAndroidMetadataName_SeriesTitle() {
        assertEquals(MediaMetadata.KEY_SERIES_TITLE, ChromecastUtilities.getAndroidMetadataName("seriesTitle"));
    }

    @Test
    public void testGetAndroidMetadataName_Season() {
        assertEquals(MediaMetadata.KEY_SEASON_NUMBER, ChromecastUtilities.getAndroidMetadataName("season"));
    }

    @Test
    public void testGetAndroidMetadataName_Episode() {
        assertEquals(MediaMetadata.KEY_EPISODE_NUMBER, ChromecastUtilities.getAndroidMetadataName("episode"));
    }

    @Test
    public void testGetAndroidMetadataName_Unknown() {
        assertEquals("customKey", ChromecastUtilities.getAndroidMetadataName("customKey"));
    }

    // ==================== getClientMetadataName Tests ====================

    @Test
    public void testGetClientMetadataName_Title() {
        assertEquals("title", ChromecastUtilities.getClientMetadataName(MediaMetadata.KEY_TITLE));
    }

    @Test
    public void testGetClientMetadataName_Subtitle() {
        assertEquals("subtitle", ChromecastUtilities.getClientMetadataName(MediaMetadata.KEY_SUBTITLE));
    }

    @Test
    public void testGetClientMetadataName_Artist() {
        assertEquals("artist", ChromecastUtilities.getClientMetadataName(MediaMetadata.KEY_ARTIST));
    }

    @Test
    public void testGetClientMetadataName_AlbumTitle() {
        assertEquals("albumName", ChromecastUtilities.getClientMetadataName(MediaMetadata.KEY_ALBUM_TITLE));
    }

    @Test
    public void testGetClientMetadataName_Unknown() {
        assertEquals("customKey", ChromecastUtilities.getClientMetadataName("customKey"));
    }

    // ==================== getMetadataType Tests ====================

    @Test
    public void testGetMetadataType_StringFields() {
        assertEquals("string", ChromecastUtilities.getMetadataType(MediaMetadata.KEY_TITLE));
        assertEquals("string", ChromecastUtilities.getMetadataType(MediaMetadata.KEY_SUBTITLE));
        assertEquals("string", ChromecastUtilities.getMetadataType(MediaMetadata.KEY_ARTIST));
        assertEquals("string", ChromecastUtilities.getMetadataType(MediaMetadata.KEY_ALBUM_ARTIST));
        assertEquals("string", ChromecastUtilities.getMetadataType(MediaMetadata.KEY_ALBUM_TITLE));
        assertEquals("string", ChromecastUtilities.getMetadataType(MediaMetadata.KEY_COMPOSER));
        assertEquals("string", ChromecastUtilities.getMetadataType(MediaMetadata.KEY_SERIES_TITLE));
        assertEquals("string", ChromecastUtilities.getMetadataType(MediaMetadata.KEY_STUDIO));
    }

    @Test
    public void testGetMetadataType_IntFields() {
        assertEquals("int", ChromecastUtilities.getMetadataType(MediaMetadata.KEY_DISC_NUMBER));
        assertEquals("int", ChromecastUtilities.getMetadataType(MediaMetadata.KEY_EPISODE_NUMBER));
        assertEquals("int", ChromecastUtilities.getMetadataType(MediaMetadata.KEY_SEASON_NUMBER));
        assertEquals("int", ChromecastUtilities.getMetadataType(MediaMetadata.KEY_TRACK_NUMBER));
        assertEquals("int", ChromecastUtilities.getMetadataType(MediaMetadata.KEY_WIDTH));
        assertEquals("int", ChromecastUtilities.getMetadataType(MediaMetadata.KEY_HEIGHT));
    }

    @Test
    public void testGetMetadataType_DoubleFields() {
        assertEquals("double", ChromecastUtilities.getMetadataType(MediaMetadata.KEY_LOCATION_LATITUDE));
        assertEquals("double", ChromecastUtilities.getMetadataType(MediaMetadata.KEY_LOCATION_LONGITUDE));
    }

    @Test
    public void testGetMetadataType_DateFields() {
        assertEquals("date", ChromecastUtilities.getMetadataType(MediaMetadata.KEY_BROADCAST_DATE));
        assertEquals("date", ChromecastUtilities.getMetadataType(MediaMetadata.KEY_CREATION_DATE));
        assertEquals("date", ChromecastUtilities.getMetadataType(MediaMetadata.KEY_RELEASE_DATE));
    }

    @Test
    public void testGetMetadataType_MsFields() {
        assertEquals("ms", ChromecastUtilities.getMetadataType(MediaMetadata.KEY_SECTION_DURATION));
        assertEquals("ms", ChromecastUtilities.getMetadataType(MediaMetadata.KEY_SECTION_START_ABSOLUTE_TIME));
        assertEquals("ms", ChromecastUtilities.getMetadataType(MediaMetadata.KEY_SECTION_START_TIME_IN_CONTAINER));
        assertEquals("ms", ChromecastUtilities.getMetadataType(MediaMetadata.KEY_SECTION_START_TIME_IN_MEDIA));
    }

    @Test
    public void testGetMetadataType_Custom() {
        assertEquals("custom", ChromecastUtilities.getMetadataType("customField"));
    }

    // ==================== getHexColor Tests ====================

    @Test
    public void testGetHexColor_Black() {
        assertEquals("#ff000000", ChromecastUtilities.getHexColor(0xFF000000));
    }

    @Test
    public void testGetHexColor_White() {
        assertEquals("#ffffffff", ChromecastUtilities.getHexColor(0xFFFFFFFF));
    }

    @Test
    public void testGetHexColor_Red() {
        assertEquals("#ffff0000", ChromecastUtilities.getHexColor(0xFFFF0000));
    }

    @Test
    public void testGetHexColor_Green() {
        assertEquals("#ff00ff00", ChromecastUtilities.getHexColor(0xFF00FF00));
    }

    @Test
    public void testGetHexColor_Blue() {
        assertEquals("#ff0000ff", ChromecastUtilities.getHexColor(0xFF0000FF));
    }

    // ==================== createError Tests ====================

    @Test
    public void testCreateError() throws JSONException {
        JSONObject error = ChromecastUtilities.createError("test_code", "Test message");
        assertEquals("test_code", error.getString("code"));
        assertEquals("Test message", error.getString("description"));
    }

    @Test
    public void testCreateError_EmptyCode() throws JSONException {
        JSONObject error = ChromecastUtilities.createError("", "Test message");
        assertEquals("", error.getString("code"));
        assertEquals("Test message", error.getString("description"));
    }

    @Test
    public void testCreateError_EmptyMessage() throws JSONException {
        JSONObject error = ChromecastUtilities.createError("test_code", "");
        assertEquals("test_code", error.getString("code"));
        assertEquals("", error.getString("description"));
    }

    // ==================== createMediaInfo Tests ====================

    @Test
    public void testCreateMediaInfo_BasicVideo() {
        JSONObject customData = new JSONObject();
        JSONObject metadata = new JSONObject();
        JSONObject textTrackStyle = new JSONObject();

        MediaInfo mediaInfo = ChromecastUtilities.createMediaInfo(
            "https://example.com/video.mp4",
            customData,
            "video/mp4",
            3600000, // 1 hour
            "buffered",
            metadata,
            textTrackStyle
        );

        assertNotNull(mediaInfo);
        assertEquals("https://example.com/video.mp4", mediaInfo.getContentId());
        assertEquals("video/mp4", mediaInfo.getContentType());
        assertEquals(MediaInfo.STREAM_TYPE_BUFFERED, mediaInfo.getStreamType());
        assertEquals(3600000, mediaInfo.getStreamDuration());
    }

    @Test
    public void testCreateMediaInfo_LiveStream() {
        JSONObject customData = new JSONObject();
        JSONObject metadata = new JSONObject();
        JSONObject textTrackStyle = new JSONObject();

        MediaInfo mediaInfo = ChromecastUtilities.createMediaInfo(
            "https://example.com/stream.m3u8",
            customData,
            "application/x-mpegURL",
            0,
            "live",
            metadata,
            textTrackStyle
        );

        assertNotNull(mediaInfo);
        assertEquals(MediaInfo.STREAM_TYPE_LIVE, mediaInfo.getStreamType());
    }

    @Test
    public void testCreateMediaInfo_UnknownStreamType() {
        JSONObject customData = new JSONObject();
        JSONObject metadata = new JSONObject();
        JSONObject textTrackStyle = new JSONObject();

        MediaInfo mediaInfo = ChromecastUtilities.createMediaInfo(
            "https://example.com/video.mp4",
            customData,
            "video/mp4",
            0,
            "unknown",
            metadata,
            textTrackStyle
        );

        assertNotNull(mediaInfo);
        assertEquals(MediaInfo.STREAM_TYPE_NONE, mediaInfo.getStreamType());
    }

    @Test
    public void testCreateMediaInfo_WithMetadata() throws JSONException {
        JSONObject customData = new JSONObject();
        JSONObject metadata = new JSONObject();
        metadata.put("metadataType", MediaMetadata.MEDIA_TYPE_MOVIE);
        metadata.put("title", "Test Movie");
        metadata.put("subtitle", "A test movie");
        JSONObject textTrackStyle = new JSONObject();

        MediaInfo mediaInfo = ChromecastUtilities.createMediaInfo(
            "https://example.com/movie.mp4",
            customData,
            "video/mp4",
            7200000,
            "buffered",
            metadata,
            textTrackStyle
        );

        assertNotNull(mediaInfo);
        assertNotNull(mediaInfo.getMetadata());
        assertEquals(MediaMetadata.MEDIA_TYPE_MOVIE, mediaInfo.getMetadata().getMediaType());
        assertEquals("Test Movie", mediaInfo.getMetadata().getString(MediaMetadata.KEY_TITLE));
    }

    // ==================== Metadata Mapping Bidirectional Tests ====================

    @Test
    public void testMetadataMapping_Bidirectional() {
        // Test that converting to Android and back gives original value
        String[] clientNames = {
            "title",
            "subtitle",
            "artist",
            "albumName",
            "albumArtist",
            "composer",
            "seriesTitle",
            "season",
            "episode"
        };

        for (String clientName : clientNames) {
            String androidName = ChromecastUtilities.getAndroidMetadataName(clientName);
            String backToClient = ChromecastUtilities.getClientMetadataName(androidName);
            assertEquals("Bidirectional mapping failed for: " + clientName, clientName, backToClient);
        }
    }

    // ==================== setQueueItems Tests ====================

    @Test
    public void testSetQueueItems_Null() {
        ChromecastUtilities.setQueueItems(null);
        // Should not throw
    }

    // ==================== Repeat Mode Bidirectional Tests ====================

    @Test
    public void testRepeatMode_Bidirectional() throws JSONException {
        int[] androidModes = {
            MediaStatus.REPEAT_MODE_REPEAT_OFF,
            MediaStatus.REPEAT_MODE_REPEAT_ALL,
            MediaStatus.REPEAT_MODE_REPEAT_SINGLE,
            MediaStatus.REPEAT_MODE_REPEAT_ALL_AND_SHUFFLE
        };

        for (int androidMode : androidModes) {
            String clientMode = ChromecastUtilities.getRepeatMode(androidMode);
            assertNotNull("Repeat mode should not be null for: " + androidMode, clientMode);
            int backToAndroid = ChromecastUtilities.getAndroidRepeatMode(clientMode);
            assertEquals("Bidirectional mapping failed for mode: " + androidMode, androidMode, backToAndroid);
        }
    }
}
