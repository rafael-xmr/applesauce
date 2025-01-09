# Nostr Connect

The [`NostrConnectSigner`](https://hzrd149.github.io/applesauce/typedoc/classes/applesauce_signer.NostrConnectSigner.html) is a client side implementation of a [NIP-46](https://github.com/nostr-protocol/nips/blob/master/46.md) remote signer

## Connecting to a remote signer

```js
import { NostrConnectSigner } from "applesauce-signer";

const signer = new NostrConnectSigner({
  remote: "<remote signer pubkey>",

  // called when the client needs to open a subscription to the relays
  async onSubOpen(filters, relays, onEvent) {
    // subscribe to some relays
    await connectToSomeRelays(relays, filters, (event) => {
      onEvent(event);
    });
  },

  // called when the signer wants to close the subscription
  async onSubClose() {},

  async onPublishEvent(event, relays) {
    // publish the event to the relays
    for (let relay of relays) {
      pool.getRelay(relay).publish(event);
    }
  },
});

// start the connection process
signer.connect().then(() => {
  console.log("Connected!");

  // get the users pubkey
  signer.getPublicKey().then((pubkey) => {
    console.log("Users pubkey is", pubkey);
  });
});
```

## Initiating connection from client

To start a connection from the client side you can use the `getNostrConnectURI` and `waitForSigner` methods to wait for the remote signer to connect

```ts
const signer = new NostrConnectSigner({
  async onSubOpen(filters, relays, onEvent) {},
  async onSubClose() {},
  async onPublishEvent(event, relays) {},
});

// get the nostrconnect:// URI
console.log(signer.getNostrConnectURI());

// wait for the remote signer to connect
signer.waitForSigner().then(() => {
  console.log("Connected!");

  // get the users pubkey
  signer.getPublicKey().then((pubkey) => {
    console.log("Users pubkey is", pubkey);
  });
});
```

## Handling bunker URIs

There are two methods to handle `bunker://` URIs. `NostrConnectSigner.fromBunkerURI` can be used to create a new signer from a bunker URI, and `NostrConnectSigner.parseBunkerURI` can be used to parse a bunker URI

```js
const signer = await NostrConnectSigner.fromBunkerURI(
  "bunker://266815e0c9210dfa324c6cba3573b14bee49da4209a9456f9484e5106cd408a5?relay=wss://relay.nsec.app&secret=d9aa70",
  {
    permissions: NostrConnectSigner.buildSigningPermissions([0, 1, 3, 10002]),
    async onSubOpen(filters, relays, onEvent) {},
    async onSubClose() {},
    async onPublishEvent(event, relays) {},
  },
);
```

## Permissions

You can use the static `NostrConnectSigner.buildSigningPermissions` method to create an array of signing permissions for a set of event kinds

Then those permissions can be passed to either the `getNostrConnectURI` method or `connect` when starting the connection
