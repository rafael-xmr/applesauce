# Reactions

## Parsing

## Loading

The [TagValueLoader](https://hzrd149.github.io/applesauce/typedoc/classes/applesauce_loaders.TagValueLoader.html) class can be used to load reactions from an event.

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

The [ReactionBlueprint](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_factory.Blueprints.ReactionBlueprint.html) blueprint can be used to create a kind 7 reaction event.

```ts
import { ReactionBlueprint } from "applesauce-factory/blueprints";
```
