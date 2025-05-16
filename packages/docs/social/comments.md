# Comments

## Helpers

`getCommentRootPointer` and `getCommentReplyPointer` methods can be used to get a NIP-22 comments root pointer and reply pointer

## Queries

The [RepliesQuery](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce-core.Queries.RepliesQuery.html) can be used to subscribe to all comments on an event or all replies to a comment

```ts
queryStore.createQuery(RepliesQuery, event).subscribe((replies) => {
  console.log(replies);
});
```

## Loading

Generally the best way to load comments is to use a [TimelineLoader](https://hzrd149.github.io/applesauce/typedoc/classes/applesauce-loaders.TimelineLoader.html)

```ts
const rootPointer: EventPointer = { id: "<event-id>", relays: ["wss://relay.eample.com"] };

// Create a timeline loader to load all k:1111 events with #E
const thread = new TimelineLoader(
  rxNostr,
  TimelineLoader.simpleFilterMap(threadRelays, [{ kinds: [1111], "#E": [rootPointer.id] }]),
);

thread.subscribe((packet) => {
  console.log(packet.event);
});
```

## Factory

The [CommentBlueprint](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce-factory.Blueprints.CommentBlueprint.html) blueprint can be used to create a comment on any event or as a reply to another comment

```ts
import { CommentBlueprint } from "applesauce-factory/blueprints";

const note = {
  kind: 1063,
  content: "cool file",
  // ... rest of event
};

// create comment for kind 1063 note
const comment = await factory.create(CommentBlueprint, note, "looks cool");

// create a reply to first comment
const reply = await factory.create(CommentBlueprint, comment, "yeah i made it today");
```
