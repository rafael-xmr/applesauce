# Notes

## Helpers

## Content

The [applesauce-content](https://hzrd149.github.io/applesauce/typedoc/modules/applesauce_content.html) package provides a set of utilities for parsing note content.

```ts
import { getParsedContent } from "applesauce-content/text";

const stringContent = "hello nostr!\nnostr:npub180cvv07tjdrrgpa0j7j7tmnyl2yr6yr7l8j4s3evf6u64th6gkwsyjh6w6";
const ats = getParsedContent(stringContent);

console.log(ats);
/*
{
  type: 'root',
  event: undefined,
  children: [
    { type: 'text', value: 'hello nostr!' },
    { type: 'text', value: '\n' },
    {
      type: 'mention',
      decoded: [Object],
      encoded: 'npub180cvv07tjdrrgpa0j7j7tmnyl2yr6yr7l8j4s3evf6u64th6gkwsyjh6w6'
    }
  ]
}
*/
```

## Loading

Generally the best way to load notes is to use a [TimelineLoader](https://hzrd149.github.io/applesauce/typedoc/classes/applesauce_loaders.TimelineLoader.html) class

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

## Factory

The [NoteBlueprint](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_factory.Blueprints.NoteBlueprint.html) blueprint can be used to create a kind 1 note

```ts
import { NoteBlueprint } from "applesauce-factory/blueprints";

// create a simple hello world note
const note = await factory.create(NoteBlueprint, "hello world");

// create a note with an emoji
const note = await factory.create(NoteBlueprint, "hello world :smile:", {
  emojis: [{ name: "smile", url: "https://example.com/smile.png" }],
});
```
