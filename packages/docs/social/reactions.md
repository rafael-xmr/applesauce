# Reactions

## Queries

The [ReactionsQuery](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce-core.Queries.ReactionsQuery.html) is a simple query that can be used to get all reaction events for an event

```js
// kind 1 short text note event
const note = {...}

// subscribe to the query to get the replies
queryStore.createQuery(ReactionsQuery, note).subscribe(replies => {
  if(replies) console.log(replies)
})

// adding events to the store will update the query
eventStore.add({kind: 7, ...})
```

## Loading

The [TagValueLoader](https://hzrd149.github.io/applesauce/typedoc/classes/applesauce-loaders.TagValueLoader.html) class can be used to load reactions in batches for an event.

```ts
import { TagValueLoader } from "applesauce-loaders";

// create a loader that loads all kind 7 events that have an #e tag referencing the event
const loader = new TagValueLoader(rxNostr, "e", { name: "reactions", kinds: [7] });

// start the loader by subscribing to it
loader.subscribe((packet) => {
  console.log(packet.event);
});

// pass event pointers to the loader to load reactions
loader.next({ id: "<event-id>", relays: ["wss://relay.example.com"] });

// you can call the .next method as many times as you like and it do its best to batch the requests
loader.next({
  id: "00007250d4212fa11c6cc10bb8459e1705fb62c23f8c014bcd25cec8c0d97fe4",
  relays: ["wss://relay.example.com"],
});
```

## Factory

The [ReactionBlueprint](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce-factory.Blueprints.ReactionBlueprint.html) blueprint can be used to create a kind 7 reaction event.

```ts
import { ReactionBlueprint } from "applesauce-factory/blueprints";

const event = {
  content:
    "I just realized nostr:npub1dergggklka99wwrs92yz8wdjs952h2ux2ha2ed598ngwu9w7a6fsh9xzpc doesn't like anything.",
  created_at: 1739716293,
  id: "000075e40142753d4daacd971d7f024140daad4fb6cccd49dfa758c8546f75f6",
  kind: 1,
  pubkey: "3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d",
  sig: "48e1e90319a9f486fc1920253f180ad2b36be1acd61be77b07e32f344046cd5f62838b1a86dccaa8c6ccb959d06842b943df5b092cee11420793f64793cf337c",
  tags: [
    ["p", "6e468422dfb74a5738702a8823b9b28168abab8655faacb6853cd0ee15deee93"],
    ["nonce", "13980", "16"],
  ],
};

// create a like reaction
let like = await eventFactory.create(ReactionBlueprint, event, "+");

// create down vote
let dislike = await eventFactory.create(ReactionBlueprint, event, "-");

// create an emoji reaction
let like = await eventFactory.create(ReactionBlueprint, event, "🧡");

// create a custom emoji reaction
let like = await eventFactory.create(ReactionBlueprint, event, {
  // the shortcode of the emoji without the ::
  name: "shakingeyes",
  // the URL of the emoji image
  url: "https://i.nostr.build/nWZ7a.gif",
});
```
