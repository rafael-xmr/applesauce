# Loaders

The `applesauce-loaders` package contains a bunch of loader classes built on top of [rx-nostr](https://github.com/penpenpng/rx-nostr)

## Event Loader pattern

All the event loader classes generally follow the same pattern, you create a `new` instance and pass a `rxNostr` instance into them along with options

```ts
// create a loader for loading a timeline of events
const timeline = new TimelineLoader(rxNostr, ...args);

// create a loader for fetching replaceable events (profiles, lists, etc)
const replaceable = new ReplaceableLoader(rxNostr, ...args);
```

Once the loader is created you **MUST** subscribe to it to start it. otherwise it wont fetch any events

```ts
// returned value is a rxjs Subscription
const sub = timeline.subscribe((packet) => {
  console.log(packet.event, packet.from);
});

// at a later point, shut down the loader
sub.unsubscribe();
```

Then once the loader is created and started you can start passing data to it. the type of data it takes depends on the specific loader but generally its done by calling the `next` method

```ts
// load next page
timeline.next();

// load next page up to a timestamp
timeline.next(1738797143);

// load a profile event from relays
replaceable.next({ kind: 0, pubkey: "<pubkey>", relays: ["wss://relay.example.com"] });
```

## Loading from cache

Most of the loaders class can take a [cacheRequest](https://hzrd149.github.io/applesauce/typedoc/types/applesauce_loaders.CacheRequest.html) method that can be used to load events from a local cache. the method should return an rxjs `Observable<NostrEvent>` that completes

```js
function cacheRequest(filters: Filter[]) {
  // Return an observable to stream the results
  return new Observable(async (observer) => {
    const events = await cacheDatabase.getEventsForFilters(filters)

    for(let event of events){
      observer.next(event)
    }
    observer.complete()
  });
}

const replaceableLoader = new ReplaceableLoader(rxNostr, {
  cacheRequest: cacheRequest,
});
```

Additionally the loaders will use the `markFromCache` method from `applesauce-core` to mark the events as being from the cache, so you can safely add new events to the cache without creating a infinite loop

```js
import { isFromCache } from "applesauce-core/helpers";

const replaceableLoader = new ReplaceableLoader(rxNostr, {
  cacheRequest: cacheRequest,
});

replaceableLoader.subscribe((packet) => {
  if (!isFromCache(packet.event)) {
    // this is a new event, so add it to the cache
    cacheDatabase.addEvent(packet.event);
  }
});
```

## Replaceable loader

The `ReplaceableLoader` class can be used to load any replaceable event from any relay

```js
import { EventStore } from "applesauce-core";
import { ReplaceableLoader } from "applesauce-loaders/loaders";
import { createRxNostr, nip07Signer } from "rx-nostr";
import { verifier } from "rx-nostr-crypto";

export const eventStore = new EventStore();
export const rxNostr = createRxNostr({
  verifier,
  signer: nip07Signer(),
  connectionStrategy: "lazy-keep",
});

const replaceableLoader = new ReplaceableLoader(rxNostr, {
  // lookup relays are used as a fallback if the event cant be found
  lookupRelays: ["wss://purplepag.es/"],
});
```

Next to start the loader and subscribe to the relays you can call `.subscribe`

```js
replaceableLoader.subscribe((packet) => {
  // send all loaded events to the event store
  eventStore.add(packet.event, packet.from);
});
```

Once the loader has been started you can call `.next` to request the event

```js
// request a replaceable event from the loader
replaceableLoader.next({
  kind: 0,
  pubkey: "3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d",
  relays: ["wss://pyramid.fiatjaf.com/"],
});

// load a parameterized replaceable event
replaceableLoader.next({
  kind: 30000,
  pubkey: "3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d",
  identifier: "list of bad people",
  relays: ["wss://pyramid.fiatjaf.com/"],
});

// if no relays are provided only the cache and lookup relays will be checked
replaceableLoader.next({
  kind: 3,
  pubkey: "3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d",
});

// passing a new relay will cause it to be loaded again
replaceableLoader.next({
  kind: 0,
  pubkey: "3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d",
  relays: ["wss://relay.westernbtc.com/"],
});

// or force it to load it again from the same relays
replaceableLoader.next({
  kind: 0,
  pubkey: "3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d",
  relays: ["wss://pyramid.fiatjaf.com/"],
  force: true,
});
```

### Batching

The replaceable loader class batches and deduplicates requests under the hood, so there is no need to worry about spamming or requesting an event multiple times

```js
const replaceableLoader = new ReplaceableLoader(rxNostr);

// Only one request will be sent to the relay
for(let i = 0; i < 100: i++){
  replaceableLoader.next({
    kind: 0,
    pubkey: "3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d",
    relays: ["wss://pyramid.fiatjaf.com/"],
  })
}
```

## Timeline loader

## Tag value loader
