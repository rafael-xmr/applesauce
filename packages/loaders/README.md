# applesauce-loaders

A collection of loader classes to make loading common events from multiple relays easier.

## Replaceable event loader

The `ReplaceableLoader` class can be used to load profiles (kind 0), contact lists (kind 3), and any other replaceable (1xxxx) or parameterized replaceable event (3xxxx)

```ts
import { Observable } from "rxjs";
import { EventStore } from "applesauce-core";
import { ReplaceableLoader } from "applesauce-loaders/loaders";

export const eventStore = new EventStore();

// Create a method to let the loaders use nostr-tools relay pool
function nostrRequest(relays: string[], filters: Filter[]) {
  return new Observable((observer) => {
    const sub = pool.subscribe(filters, {
      onevent: (event) => observer.next(event),
      oneose: () => {
        sub.close();
        observer.complete();
      },
    });

    return () => sub.close();
  });
}

// create method to load events from the cache relay
function cacheRequest(filters: Filter[]) {
  return new Observable((observer) => {
    const sub = cacheRelay.subscribe(filters, {
      onevent: (event) => observer.next(event),
      oneose: () => {
        sub.close();
        observer.complete();
      },
    });
  });
}

const replaceableLoader = new ReplaceableLoader(rxNostr, {
  bufferTime: 1000,
  // check the cache first for events
  cacheRequest: cacheRequest,
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
