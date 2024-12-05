# Helpers

`applesauce-core` comes with a [bunch](https://hzrd149.github.io/applesauce/typedoc/modules/applesauce_core.Helpers.html) of methods to get data from events

> [!WARNING]
> Some helper methods my throw errors. so make sure to have error handling and use the `isValid*` helpers to filter out invalid events

## Events

- [`isEvent`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_core.Helpers.isEvent.html) Checks if an object is a nostr event
- [`markFromCache`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_core.Helpers.markFromCache.html) Marks an event as being from the cache
- [`isFromCache`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_core.Helpers.isFromCache.html) Checks if an event is marked from cache
- [`getTagValue`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_core.Helpers.getTagValue.html) Gets the value of the first tag matching the name
- [`getIndexableTags`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_core.Helpers.getIndexableTags.html) Get a `Set` of all indexable tags on the event

## Profiles

- [`getProfileContent`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_core.Helpers.getProfileContent.html) Returns the parsed profile content for a kind 0 event
- [`isValidProfile`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_core.Helpers.isValidProfile.html) Checks if the content of the kind 0 event is valid JSON

## Mailboxes

- [`getInboxes`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_core.Helpers.getInboxes.html) Gets the inbox relays from a `10002` event
- [`getOutboxes`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_core.Helpers.getOutboxes.html) Gets the outbox relays from a `10002` event

## Event relays

- [`addSeenRelay`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_core.Helpers.addSeenRelay.html) Adds a relay to the list of relay the event was seen on
- [`getSeenRelays`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_core.Helpers.getSeenRelays.html) Get the list of relays this event was seen on

## Zaps

- [`isValidZap`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_core.Helpers.isValidZap.html) Checks if an event is a valid zap and can be parsed
- [`getZapSender`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_core.Helpers.getZapSender.html) Gets the senders pubkey
- [`getZapRecipient`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_core.Helpers.getZapRecipient.html) Gets the pubkey of the user who received the zap
- [`getZapPayment`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_core.Helpers.getZapPayment.html) Gets the parsed bolt11 invoice
- [`getZapAddressPointer`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_core.Helpers.getZapAddressPointer.html) Gets the address pointer of the zap
- [`getZapEventPointer`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_core.Helpers.getZapEventPointer.html) Gets the event pointer of the zap
- [`getZapRequest`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_core.Helpers.getZapRequest.html) Gets the zap request event inside the zap event

## Lightning

- [`parseBolt11`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_core.Helpers.parseBolt11.html) Parses a bolt11 lightning invoice
- [`parseLNURLOrAddress`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_core.Helpers.parseLNURLOrAddress.html) Parses a LNURL or lightning address into a LNURLp

## Pointers

- [`getEventPointerFromTag`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_core.Helpers.getEventPointerFromTag.html) Creates an `EventPointer` from a standard "e" tag
- [`getAddressPointerFromTag`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_core.Helpers.getAddressPointerFromTag.html) Creates an `AddressPointer` from a standard "a" tag
- [`getProfilePointerFromTag`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_core.Helpers.getProfilePointerFromTag.html) Creates an `ProfilePointer` from a standard "p" tag

## Delete events

- [`getDeleteIds`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_core.Helpers.getDeleteIds.html) Gets a list of referenced event ids
- [`getDeleteCoordinates`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_core.Helpers.getDeleteCoordinates.html) Get the list of replaceable event coordinates the event is referencing
- [`createDeleteEvent`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_core.Helpers.createDeleteEvent.html) Creates a draft delete event for a list of events

## Emojis

- [`getPackName`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_core.Helpers.getPackName.html) Gets the emoji pack name
- [`getEmojis`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_core.Helpers.getEmojis.html) Get all emojis in an emoji pack
- [`getEmojiTag`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_core.Helpers.getEmojiTag.html) CGets an "emoji" tag that matches an emoji code

## URLs

- [`getURLFilename`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_core.Helpers.getURLFilename.html) returns the filename part fo the path in a URL
- [`isAudioURL`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_core.Helpers.isAudioURL.html) Checks if the URL ends with a audio file extension
- [`isVideoURL`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_core.Helpers.isVideoURL.html) Checks if the URL ends with a video file extension
- [`isImageURL`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_core.Helpers.isImageURL.html) Checks if the URL ends with a image file extension
- [`isStreamURL`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_core.Helpers.isStreamURL.html) Checks if the URL ends with a stream file extension

## Tags

- [`isETag`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_core.Helpers.isETag.html) Checks if tag is an "e" tag and has at least one value
- [`isATag`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_core.Helpers.isATag.html) Checks if tag is an "a" tag and has at least one value
- [`isPTag`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_core.Helpers.isPTag.html) Checks if tag is an "p" tag and has at least one value
- [`isDTag`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_core.Helpers.isDTag.html) Checks if tag is an "d" tag and has at least one value
- [`isRTag`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_core.Helpers.isRTag.html) Checks if tag is an "r" tag and has at least one value
- [`isTTag`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_core.Helpers.isTTag.html) Checks if tag is an "t" tag and has at least one value

## Filters

- [`isFilterEqual`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_core.Helpers.isFilterEqual.html) Check if two filters are equal

## Time

- [`unixNow`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_core.Helpers.unixNow.html) Returns the current unix timestamp
