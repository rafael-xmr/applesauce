# applesauce-loaders

A collection of observable based loaders built on top of [rx-nostr](https://penpenpng.github.io/rx-nostr/)

## Replaceable event loader

The `ReplaceableLoader` class can be used to load profiles (kind 0), contact lists (kind 3), and any other replaceable (1xxxx) or parameterized replaceable event (3xxxx)

```ts
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
  bufferTime: 1000,
  // cache relays will always be checked first
  cacheRelays: ["ws://localhost:4869/"],
  // lookup relays are used as a fallback if the event cant be found
  lookupRelays: ["wss://purplepag.es/"],
});

// start the loader by subscribing to it
replaceableLoader.subscribe((packet) => {
  // send all loaded events to the event store
  eventStore.add(packet.event, packet.from);
});

// start loading some replaceable events
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
