# Applesauce DVM

Helpers and blueprints for [NIP-90](https://github.com/nostr-protocol/nips/blob/master/90.md) data vending machines.

## Installation

```bash
npm install applesauce-dvm
```

## Usage

```ts
import { DVMClient } from "applesauce-dvm";
import { RelayPool, onlyEvents } from "applesauce-relay";
import { EventFactory } from "applesauce-factory";
import { SimpleSigner } from "applesauce-signers/signers";

// Create a relay pool for connections
const pool = new RelayPool();

// Create an event factory for signing and creating events
const signer = new SimpleSigner();
const factory = new EventFactory({ signer });

// Create a DVM client
const client = new DVMClient(
  factory,
  ["wss://relay.example.com/"],
  // A publish method that publishes to the relays
  async (relays, event) => {
    await lastValueFrom(pool.event(relays, event));
  },
  // A subscribe method that subscribes to the relays
  (relays, filters) => {
    return pool.req(relays, filters).pipe(onlyEvents());
  },
);

// Make a kind 5002 translation request
client.translate("Hello, world!").subscribe((event) => {
  console.log(event);
});
```
