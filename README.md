# @gameleap/capacitor-chromecast

This is a plugin for Capacitor that enables Chromecast functionality for iOS and Android.

## Install

```bash
npm install @gameleap/capacitor-chromecast
npx cap sync
```

## API

<docgen-index>

* [`initialize(...)`](#initialize)
* [`requestSession()`](#requestsession)
* [`launchMedia(...)`](#launchmedia)
* [`loadMedia(...)`](#loadmedia)
* [`loadMediaWithHeaders(...)`](#loadmediawithheaders)
* [`mediaPause()`](#mediapause)
* [`mediaPlay()`](#mediaplay)
* [`mediaSeek(...)`](#mediaseek)
* [`mediaNext()`](#medianext)
* [`mediaPrev()`](#mediaprev)
* [`sessionStop()`](#sessionstop)
* [`sessionLeave()`](#sessionleave)
* [`startRouteScan(...)`](#startroutescan)
* [`stopRouteScan()`](#stoproutescan)
* [`selectRoute(...)`](#selectroute)
* [`sendMessage(...)`](#sendmessage)
* [`addMessageListener(...)`](#addmessagelistener)
* [`removeMessageListener(...)`](#removemessagelistener)
* [`networkDiagnostic()`](#networkdiagnostic)
* [`addListener(string, ...)`](#addlistenerstring-)
* [Interfaces](#interfaces)
* [Type Aliases](#type-aliases)

</docgen-index>

<docgen-api>
<!--Update the source file JSDoc comments and rerun docgen to update the docs below-->

### initialize(...)

```typescript
initialize(options?: InitializeOptions | undefined) => Promise<void>
```

Initialize the Chromecast SDK with optional app ID.
If no app ID is provided, the default media receiver is used.

| Param         | Type                                                            |
| ------------- | --------------------------------------------------------------- |
| **`options`** | <code><a href="#initializeoptions">InitializeOptions</a></code> |

--------------------


### requestSession()

```typescript
requestSession() => Promise<SessionObject>
```

Request a Chromecast session. This will show the device picker dialog.

**Returns:** <code>Promise&lt;<a href="#sessionobject">SessionObject</a>&gt;</code>

--------------------


### launchMedia(...)

```typescript
launchMedia(options: { mediaUrl: string; }) => Promise<{ success: boolean; }>
```

Simple method to launch media on the current session.
For more control, use loadMedia instead.

| Param         | Type                               |
| ------------- | ---------------------------------- |
| **`options`** | <code>{ mediaUrl: string; }</code> |

**Returns:** <code>Promise&lt;{ success: boolean; }&gt;</code>

--------------------


### loadMedia(...)

```typescript
loadMedia(options: LoadMediaOptions) => Promise<MediaObject>
```

Load media with full control over playback options.

| Param         | Type                                                          |
| ------------- | ------------------------------------------------------------- |
| **`options`** | <code><a href="#loadmediaoptions">LoadMediaOptions</a></code> |

**Returns:** <code>Promise&lt;<a href="#mediaobject">MediaObject</a>&gt;</code>

--------------------


### loadMediaWithHeaders(...)

```typescript
loadMediaWithHeaders(options: LoadMediaWithHeadersOptions) => Promise<MediaObject>
```

Load media with authentication headers for protected content.

| Param         | Type                                                                                |
| ------------- | ----------------------------------------------------------------------------------- |
| **`options`** | <code><a href="#loadmediawithheadersoptions">LoadMediaWithHeadersOptions</a></code> |

**Returns:** <code>Promise&lt;<a href="#mediaobject">MediaObject</a>&gt;</code>

--------------------


### mediaPause()

```typescript
mediaPause() => Promise<void>
```

Pause the current media.

--------------------


### mediaPlay()

```typescript
mediaPlay() => Promise<void>
```

Play/resume the current media.

--------------------


### mediaSeek(...)

```typescript
mediaSeek(options: { currentTime: number; }) => Promise<void>
```

Seek to a position in the current media.

| Param         | Type                                  |
| ------------- | ------------------------------------- |
| **`options`** | <code>{ currentTime: number; }</code> |

--------------------


### mediaNext()

```typescript
mediaNext() => Promise<void>
```

Skip to next item in queue.

--------------------


### mediaPrev()

```typescript
mediaPrev() => Promise<void>
```

Go to previous item in queue.

--------------------


### sessionStop()

```typescript
sessionStop() => Promise<void>
```

Stop the current session and stop casting on the receiver.

--------------------


### sessionLeave()

```typescript
sessionLeave() => Promise<void>
```

Leave the current session but keep the receiver playing.

--------------------


### startRouteScan(...)

```typescript
startRouteScan(options?: { timeout?: number | undefined; } | undefined) => Promise<{ routes: RouteInfo[]; }>
```

Start scanning for available Chromecast devices.

| Param         | Type                               |
| ------------- | ---------------------------------- |
| **`options`** | <code>{ timeout?: number; }</code> |

**Returns:** <code>Promise&lt;{ routes: RouteInfo[]; }&gt;</code>

--------------------


### stopRouteScan()

```typescript
stopRouteScan() => Promise<void>
```

Stop scanning for devices.

--------------------


### selectRoute(...)

```typescript
selectRoute(options: { routeId: string; }) => Promise<SessionObject>
```

Connect to a specific device by route ID.

| Param         | Type                              |
| ------------- | --------------------------------- |
| **`options`** | <code>{ routeId: string; }</code> |

**Returns:** <code>Promise&lt;<a href="#sessionobject">SessionObject</a>&gt;</code>

--------------------


### sendMessage(...)

```typescript
sendMessage(options: { namespace: string; message: string; }) => Promise<SendMessageResult>
```

Send a custom message to the receiver.

| Param         | Type                                                 |
| ------------- | ---------------------------------------------------- |
| **`options`** | <code>{ namespace: string; message: string; }</code> |

**Returns:** <code>Promise&lt;<a href="#sendmessageresult">SendMessageResult</a>&gt;</code>

--------------------


### addMessageListener(...)

```typescript
addMessageListener(options: { namespace: string; }) => Promise<void>
```

Add a listener for messages from the receiver on a specific namespace.

| Param         | Type                                |
| ------------- | ----------------------------------- |
| **`options`** | <code>{ namespace: string; }</code> |

--------------------


### removeMessageListener(...)

```typescript
removeMessageListener(options: { namespace: string; }) => Promise<void>
```

Remove a message listener for a specific namespace.

| Param         | Type                                |
| ------------- | ----------------------------------- |
| **`options`** | <code>{ namespace: string; }</code> |

--------------------


### networkDiagnostic()

```typescript
networkDiagnostic() => Promise<NetworkDiagnosticResult>
```

Get network diagnostic information.

**Returns:** <code>Promise&lt;<a href="#networkdiagnosticresult">NetworkDiagnosticResult</a>&gt;</code>

--------------------


### addListener(string, ...)

```typescript
addListener(eventName: string, listenerFunc: ListenerCallback) => Promise<PluginListenerHandle> & PluginListenerHandle
```

Add a listener for Chromecast events.

Available events:
- SESSION_LISTENER: Fired when a session is rejoined
- SESSION_UPDATE: Fired when session state changes
- SESSION_STARTED: Fired when a new session starts
- SESSION_ENDED: Fired when session ends
- SESSION_RESUMED: Fired when session is resumed
- SESSION_START_FAILED: Fired when session fails to start
- RECEIVER_LISTENER: Fired when receiver availability changes
- MEDIA_LOAD: Fired when media is loaded
- MEDIA_UPDATE: Fired when media state changes
- RECEIVER_MESSAGE: Fired when a custom message is received
- SETUP: Fired when plugin is set up

| Param              | Type                                                          |
| ------------------ | ------------------------------------------------------------- |
| **`eventName`**    | <code>string</code>                                           |
| **`listenerFunc`** | <code><a href="#listenercallback">ListenerCallback</a></code> |

**Returns:** <code>Promise&lt;<a href="#pluginlistenerhandle">PluginListenerHandle</a>&gt; & <a href="#pluginlistenerhandle">PluginListenerHandle</a></code>

--------------------


### Interfaces


#### InitializeOptions

| Prop                      | Type                                                                     |
| ------------------------- | ------------------------------------------------------------------------ |
| **`appId`**               | <code>string</code>                                                      |
| **`autoJoinPolicy`**      | <code>'tab_and_origin_scoped' \| 'origin_scoped' \| 'page_scoped'</code> |
| **`defaultActionPolicy`** | <code>'create_session' \| 'cast_this_tab'</code>                         |


#### SessionObject

| Prop              | Type                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------- |
| **`appId`**       | <code>string</code>                                                                               |
| **`displayName`** | <code>string</code>                                                                               |
| **`sessionId`**   | <code>string</code>                                                                               |
| **`appImages`**   | <code><a href="#array">Array</a>&lt;{ url: string }&gt;</code>                                    |
| **`receiver`**    | <code>{ friendlyName: string; label: string; volume: { level: number; muted: boolean; }; }</code> |
| **`media`**       | <code>MediaObject[]</code>                                                                        |
| **`status`**      | <code>string</code>                                                                               |


#### Array

| Prop         | Type                | Description                                                                                            |
| ------------ | ------------------- | ------------------------------------------------------------------------------------------------------ |
| **`length`** | <code>number</code> | Gets or sets the length of the array. This is a number one higher than the highest index in the array. |

| Method             | Signature                                                                                                                     | Description                                                                                                                                                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **toString**       | () =&gt; string                                                                                                               | Returns a string representation of an array.                                                                                                                                                                                                |
| **toLocaleString** | () =&gt; string                                                                                                               | Returns a string representation of an array. The elements are converted to string using their toLocalString methods.                                                                                                                        |
| **pop**            | () =&gt; T \| undefined                                                                                                       | Removes the last element from an array and returns it. If the array is empty, undefined is returned and the array is not modified.                                                                                                          |
| **push**           | (...items: T[]) =&gt; number                                                                                                  | Appends new elements to the end of an array, and returns the new length of the array.                                                                                                                                                       |
| **concat**         | (...items: <a href="#concatarray">ConcatArray</a>&lt;T&gt;[]) =&gt; T[]                                                       | Combines two or more arrays. This method returns a new array without modifying any existing arrays.                                                                                                                                         |
| **concat**         | (...items: (T \| <a href="#concatarray">ConcatArray</a>&lt;T&gt;)[]) =&gt; T[]                                                | Combines two or more arrays. This method returns a new array without modifying any existing arrays.                                                                                                                                         |
| **join**           | (separator?: string \| undefined) =&gt; string                                                                                | Adds all the elements of an array into a string, separated by the specified separator string.                                                                                                                                               |
| **reverse**        | () =&gt; T[]                                                                                                                  | Reverses the elements in an array in place. This method mutates the array and returns a reference to the same array.                                                                                                                        |
| **shift**          | () =&gt; T \| undefined                                                                                                       | Removes the first element from an array and returns it. If the array is empty, undefined is returned and the array is not modified.                                                                                                         |
| **slice**          | (start?: number \| undefined, end?: number \| undefined) =&gt; T[]                                                            | Returns a copy of a section of an array. For both start and end, a negative index can be used to indicate an offset from the end of the array. For example, -2 refers to the second to last element of the array.                           |
| **sort**           | (compareFn?: ((a: T, b: T) =&gt; number) \| undefined) =&gt; this                                                             | Sorts an array in place. This method mutates the array and returns a reference to the same array.                                                                                                                                           |
| **splice**         | (start: number, deleteCount?: number \| undefined) =&gt; T[]                                                                  | Removes elements from an array and, if necessary, inserts new elements in their place, returning the deleted elements.                                                                                                                      |
| **splice**         | (start: number, deleteCount: number, ...items: T[]) =&gt; T[]                                                                 | Removes elements from an array and, if necessary, inserts new elements in their place, returning the deleted elements.                                                                                                                      |
| **unshift**        | (...items: T[]) =&gt; number                                                                                                  | Inserts new elements at the start of an array, and returns the new length of the array.                                                                                                                                                     |
| **indexOf**        | (searchElement: T, fromIndex?: number \| undefined) =&gt; number                                                              | Returns the index of the first occurrence of a value in an array, or -1 if it is not present.                                                                                                                                               |
| **lastIndexOf**    | (searchElement: T, fromIndex?: number \| undefined) =&gt; number                                                              | Returns the index of the last occurrence of a specified value in an array, or -1 if it is not present.                                                                                                                                      |
| **every**          | &lt;S extends T&gt;(predicate: (value: T, index: number, array: T[]) =&gt; value is S, thisArg?: any) =&gt; this is S[]       | Determines whether all the members of an array satisfy the specified test.                                                                                                                                                                  |
| **every**          | (predicate: (value: T, index: number, array: T[]) =&gt; unknown, thisArg?: any) =&gt; boolean                                 | Determines whether all the members of an array satisfy the specified test.                                                                                                                                                                  |
| **some**           | (predicate: (value: T, index: number, array: T[]) =&gt; unknown, thisArg?: any) =&gt; boolean                                 | Determines whether the specified callback function returns true for any element of an array.                                                                                                                                                |
| **forEach**        | (callbackfn: (value: T, index: number, array: T[]) =&gt; void, thisArg?: any) =&gt; void                                      | Performs the specified action for each element in an array.                                                                                                                                                                                 |
| **map**            | &lt;U&gt;(callbackfn: (value: T, index: number, array: T[]) =&gt; U, thisArg?: any) =&gt; U[]                                 | Calls a defined callback function on each element of an array, and returns an array that contains the results.                                                                                                                              |
| **filter**         | &lt;S extends T&gt;(predicate: (value: T, index: number, array: T[]) =&gt; value is S, thisArg?: any) =&gt; S[]               | Returns the elements of an array that meet the condition specified in a callback function.                                                                                                                                                  |
| **filter**         | (predicate: (value: T, index: number, array: T[]) =&gt; unknown, thisArg?: any) =&gt; T[]                                     | Returns the elements of an array that meet the condition specified in a callback function.                                                                                                                                                  |
| **reduce**         | (callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) =&gt; T) =&gt; T                           | Calls the specified callback function for all the elements in an array. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.                      |
| **reduce**         | (callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) =&gt; T, initialValue: T) =&gt; T          |                                                                                                                                                                                                                                             |
| **reduce**         | &lt;U&gt;(callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) =&gt; U, initialValue: U) =&gt; U | Calls the specified callback function for all the elements in an array. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.                      |
| **reduceRight**    | (callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) =&gt; T) =&gt; T                           | Calls the specified callback function for all the elements in an array, in descending order. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function. |
| **reduceRight**    | (callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) =&gt; T, initialValue: T) =&gt; T          |                                                                                                                                                                                                                                             |
| **reduceRight**    | &lt;U&gt;(callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) =&gt; U, initialValue: U) =&gt; U | Calls the specified callback function for all the elements in an array, in descending order. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function. |


#### ConcatArray

| Prop         | Type                |
| ------------ | ------------------- |
| **`length`** | <code>number</code> |

| Method    | Signature                                                          |
| --------- | ------------------------------------------------------------------ |
| **join**  | (separator?: string \| undefined) =&gt; string                     |
| **slice** | (start?: number \| undefined, end?: number \| undefined) =&gt; T[] |


#### MediaObject

| Prop                 | Type                                                                                                                                                                                                                                            |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`currentItemId`**  | <code>number</code>                                                                                                                                                                                                                             |
| **`currentTime`**    | <code>number</code>                                                                                                                                                                                                                             |
| **`customData`**     | <code><a href="#record">Record</a>&lt;string, unknown&gt;</code>                                                                                                                                                                                |
| **`mediaSessionId`** | <code>number</code>                                                                                                                                                                                                                             |
| **`playbackRate`**   | <code>number</code>                                                                                                                                                                                                                             |
| **`playerState`**    | <code>'IDLE' \| 'PLAYING' \| 'PAUSED' \| 'BUFFERING' \| 'UNKNOWN'</code>                                                                                                                                                                        |
| **`idleReason`**     | <code>'CANCELLED' \| 'ERROR' \| 'FINISHED' \| 'INTERRUPTED'</code>                                                                                                                                                                              |
| **`isAlive`**        | <code>boolean</code>                                                                                                                                                                                                                            |
| **`volume`**         | <code>{ level: number; muted: boolean; }</code>                                                                                                                                                                                                 |
| **`media`**          | <code>{ contentId: string; contentType: string; customData: <a href="#record">Record</a>&lt;string, unknown&gt;; duration: number; streamType: 'BUFFERED' \| 'LIVE' \| 'OTHER'; metadata?: <a href="#mediametadata">MediaMetadata</a>; }</code> |
| **`sessionId`**      | <code>string</code>                                                                                                                                                                                                                             |


#### MediaMetadata

| Prop               | Type                                                           |
| ------------------ | -------------------------------------------------------------- |
| **`metadataType`** | <code>number</code>                                            |
| **`title`**        | <code>string</code>                                            |
| **`subtitle`**     | <code>string</code>                                            |
| **`images`**       | <code><a href="#array">Array</a>&lt;{ url: string }&gt;</code> |


#### LoadMediaOptions

| Prop                 | Type                                                                            |
| -------------------- | ------------------------------------------------------------------------------- |
| **`contentId`**      | <code>string</code>                                                             |
| **`customData`**     | <code><a href="#record">Record</a>&lt;string, unknown&gt;</code>                |
| **`contentType`**    | <code>string</code>                                                             |
| **`duration`**       | <code>number</code>                                                             |
| **`streamType`**     | <code>'buffered' \| 'live' \| 'other' \| 'BUFFERED' \| 'LIVE' \| 'OTHER'</code> |
| **`autoPlay`**       | <code>boolean</code>                                                            |
| **`currentTime`**    | <code>number</code>                                                             |
| **`metadata`**       | <code><a href="#mediametadata">MediaMetadata</a></code>                         |
| **`textTrackStyle`** | <code><a href="#texttrackstyle">TextTrackStyle</a></code>                       |


#### TextTrackStyle

| Prop             | Type                |
| ---------------- | ------------------- |
| **`fontScale`**  | <code>number</code> |
| **`fontFamily`** | <code>string</code> |


#### LoadMediaWithHeadersOptions

| Prop              | Type                                                            |
| ----------------- | --------------------------------------------------------------- |
| **`authHeaders`** | <code><a href="#record">Record</a>&lt;string, string&gt;</code> |
| **`authToken`**   | <code>string</code>                                             |


#### RouteInfo

| Prop                 | Type                 |
| -------------------- | -------------------- |
| **`id`**             | <code>string</code>  |
| **`name`**           | <code>string</code>  |
| **`description`**    | <code>string</code>  |
| **`isNearbyDevice`** | <code>boolean</code> |


#### SendMessageResult

| Prop          | Type                 |
| ------------- | -------------------- |
| **`success`** | <code>boolean</code> |
| **`error`**   | <code>string</code>  |


#### NetworkDiagnosticResult

| Prop                          | Type                 |
| ----------------------------- | -------------------- |
| **`networkConnected`**        | <code>boolean</code> |
| **`networkType`**             | <code>string</code>  |
| **`networkState`**            | <code>string</code>  |
| **`isWiFi`**                  | <code>boolean</code> |
| **`warning`**                 | <code>string</code>  |
| **`error`**                   | <code>string</code>  |
| **`googlePlayServices`**      | <code>boolean</code> |
| **`gmsError`**                | <code>string</code>  |
| **`castConnectionAvailable`** | <code>boolean</code> |


#### PluginListenerHandle

| Prop         | Type                                      |
| ------------ | ----------------------------------------- |
| **`remove`** | <code>() =&gt; Promise&lt;void&gt;</code> |


### Type Aliases


#### Record

Construct a type with a set of properties K of type T

<code>{ [P in K]: T; }</code>


#### ListenerCallback

<code>(err: any, ...args: any[]): void</code>

</docgen-api>
