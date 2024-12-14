# Event Factory

The `EventFactory` is a class is used to provide a [Signer](../signers/signers.md) and relay hints to the [Blueprints](./blueprints.md)

## Creating a factory

When creating a new event factory you can pass a [context](https://hzrd149.github.io/applesauce/typedoc/types/applesauce_factory.EventFactoryContext.html) object in that is used by all blueprints

```ts
const signer = new SimpleSigner();

const factory = new EventFactory({
  // optionally pass a signer in (required for encryption)
  signer: signer,
  // optionally set a NIP-89 client
  client: {
    name: "My Awesome Client",
    address: {
      pubkey: "3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d",
      identifier: "awesome-client",
    },
  },
});
```

## Relay hints

Relay hints can ge added to all event tags that support them by passing in `getRelayHint` and `getPubkeyRelayHint` methods into the [context](https://hzrd149.github.io/applesauce/typedoc/types/applesauce_factory.EventFactoryContext.html)

```ts
const factory = new EventFactory({
  getRelayHint: async (event) => {
    // an async process to find the best relay hint for this event
    try {
      return await calculateRelayHint(event)
    }
    catch(){
      return undefined
    }
  },
  getPubkeyRelayHint: async (pubkey) => {
    // an async process to find a relay hint for this pubkey
    return loadPubkeyMailboxes(pubkey).then((mailboxes) => getOutboxes(mailboxes)[0]);
  },
});
```

## Using a blueprint

The [`factory.create`](https://hzrd149.github.io/applesauce/typedoc/classes/applesauce_factory.EventFactory.html#create) method can be used to create an event from a [Blueprints](./blueprints.md)

```ts
await factory.create(NoteBlueprint, "hello world");
```

## Quick helper methods

- [`factory.note`](https://hzrd149.github.io/applesauce/typedoc/classes/applesauce_factory.EventFactory.html#note) is a shortcut for `NoteBlueprint`
- [`factory.noteReply`](https://hzrd149.github.io/applesauce/typedoc/classes/applesauce_factory.EventFactory.html#noteReply) is a shortcut for `NoteReplyBlueprint`
- [`factory.comment`](https://hzrd149.github.io/applesauce/typedoc/classes/applesauce_factory.EventFactory.html#comment) is a shortcut for `CommentBlueprint`
- [`factory.reaction`](https://hzrd149.github.io/applesauce/typedoc/classes/applesauce_factory.EventFactory.html#reaction) is a shortcut for `ReactionBlueprint`
- [`factory.share`](https://hzrd149.github.io/applesauce/typedoc/classes/applesauce_factory.EventFactory.html#share) is a shortcut for `ShareBlueprint`
- [`factory.delete`](https://hzrd149.github.io/applesauce/typedoc/classes/applesauce_factory.EventFactory.html#delete) is a shortcut for `DeleteBlueprint`

## Manually creating an event

The [`factory.process`](https://hzrd149.github.io/applesauce/typedoc/classes/applesauce_factory.EventFactory.html#process) method can be used to create an event from an `EventTemplate` and [Operations](https://hzrd149.github.io/applesauce/typedoc/modules/applesauce_factory.Operations.html)

```ts
import { includeSingletonTag, setContent, includeAltTag } from "applesauce-factory/operations";

await factory.process(
  { kind: 1063 },
  setContent("the bitcoin whitepaper"),
  includeAltTag("File metadata"),
  includeSingletonTag(["x", "b1674191a88ec5cdd733e4240a81803105dc412d6c6708d53ab94fc248f4f553"]),
  includeSingletonTag(["size", "184292"]),
  includeSingletonTag(["m", "application/pdf"]),
  includeSingletonTag([
    "url",
    "https://cdn.example.com/b1674191a88ec5cdd733e4240a81803105dc412d6c6708d53ab94fc248f4f553.pdf",
  ]),
);
```
