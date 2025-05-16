# Notes

## Parsing

### Content

The [applesauce-content](https://hzrd149.github.io/applesauce/typedoc/modules/applesauce-content.html) package provides a set of utilities for parsing note content.

```ts
import { getParsedContent } from "applesauce-content/text";

const stringContent = "hello nostr!\nnostr:npub180cvv07tjdrrgpa0j7j7tmnyl2yr6yr7l8j4s3evf6u64th6gkwsyjh6w6";
const ats = getParsedContent(stringContent);

console.log(ats);
```

```json
{
  "type": "root",
  "event": undefined,
  "children": [
    { "type": "text", "value": "hello nostr!" },
    { "type": "text", "value": "\n" },
    {
      "type": "mention",
      "decoded": [Object],
      "encoded": "npub180cvv07tjdrrgpa0j7j7tmnyl2yr6yr7l8j4s3evf6u64th6gkwsyjh6w6"
    }
  ]
}
```

### Replies

The [getNip10References](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce-core.Helpers.getNip10References.html) method can be used to parse the [NIP-10](https://github.com/nostr-protocol/nips/blob/master/10.md) tags in a kind 1 reply

```js
import { getNip10References } from "applesauce-core/helpers";

const event = {
  content: "Yes, because it forces me to open another tab and wait a minute until the email arrives and I can login.",
  created_at: 1740081593,
  id: "000044e758c563a419b62cb6a23fba0b2f7f78facadf2092e56c42e1ccefd354",
  kind: 1,
  pubkey: "3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d",
  sig: "3f9371a3780fa28429b8c3f4553021d543145a630bf766b5a17f3d66e235c7437d8e0888cb39f60fdf970d72a704b3cd7904c3195dcd887188c4eb9fd7874c68",
  tags: [
    ["p", "3f68c31732066fc0cb565d450f7adbf57a0bc0ae8ea187922758b7a5285de638"],
    ["e", "0000d5f3364a65771487f2c0705e35e70d215a7c6d204a1ccb859011803d8010", "wss://aegis.utxo.one/", "root"],
    [
      "e",
      "1af3f034ee14cb7d4bf9268d4d2129880653ebe0d2fa1fcd86c427d4e7b15c78",
      "wss://nostr.mom/",
      "reply",
      "3f68c31732066fc0cb565d450f7adbf57a0bc0ae8ea187922758b7a5285de638",
    ],
    ["nonce", "4611686018427398522", "16"],
  ],
};

console.log(getNip10References(event));
```

Should return a [ThreadReferences](https://hzrd149.github.io/applesauce/typedoc/types/applesauce-core.Helpers.ThreadReferences.html) object

```json
{
  "root": {
    "e": { "id": "0000d5f3364a65771487f2c0705e35e70d215a7c6d204a1ccb859011803d8010", "relays": ["wss://aegis.utxo.one/"] },
  },
  "reply": {
    "e": { "id": "1af3f034ee14cb7d4bf9268d4d2129880653ebe0d2fa1fcd86c427d4e7b15c78", "relays": ["wss://nostr.mom/"] },
  },
};
```

## Loading

Generally the best way to load bulk notes is to use a [TimelineLoader](https://hzrd149.github.io/applesauce/typedoc/classes/applesauce-loaders.TimelineLoader.html) class

```ts
const pubkeys = ["<pubkey1>", "<pubkey2>"];
const relays = ["wss://relay.example.com"];

const loader = new TimelineLoader(rxNostr, TimelineLoader.simpleFilterMap(relays, [{ kinds: [1], authors: pubkeys }]), {
  // limit each page to 100 events
  limit: 100,
});

loader.subscribe((packet) => {
  console.log(packet.event);
});

// load first page
loader.next();
```

The `SingleEventLoader` can be used to load single notes

```ts
const loader = new SingleEventLoader(rxNostr);

// start the loader
loader.subscribe((packet) => {
  console.log(packet.event);
});

// load the single event from the relays
loader.next({
  id: "70ef7dc9cbd406e779547fe912dbdc4de7170744c3be4e00c04ae11679f21977",
  relays: ["wss://pyramid.fiatjaf.com/"],
});
```

## Factory

The [NoteBlueprint](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce-factory.Blueprints.NoteBlueprint.html) blueprint can be used to create a kind 1 note

```ts
import { NoteBlueprint } from "applesauce-factory/blueprints";

// create a simple hello world note
const note = await factory.create(NoteBlueprint, "hello world");

// create a note with an emoji
const note = await factory.create(NoteBlueprint, "hello world :smile:", {
  emojis: [{ name: "smile", url: "https://example.com/smile.png" }],
});
```

The [NoteReplyBlueprint](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce-factory.Blueprints.NoteReplyBlueprint.html) can be used to create a kind 1 reply

::: info
The `NoteReplyBlueprint` can only be used to create replies for kind 1 events. if you need replies to other kinds of events you should use [Comments](./comments.md)
:::

```ts
import { NoteReplyBlueprint } from "applesauce-factory/blueprints";

// parent event
const event = { id: "" };

// create a simple hello world note
const note = await factory.create(NoteReplyBlueprint, event, "GM");
```
