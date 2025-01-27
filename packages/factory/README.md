# applesauce-factory

applesauce event factory is a package for easily creating or modifying nostr events

[Documentation](https://hzrd149.github.io/applesauce/typedoc/modules/applesauce_factory.html)

## Creating a short text note

```js
import { EventFactory } from "applesauce-factory";
import { NoteBlueprint } from "applesauce-factory/blueprints";

const factory = new EventFactory({
  // config options,
  // see https://hzrd149.github.io/applesauce/typedoc/types/applesauce_factory.EventFactoryContext.html
});

const unsignedEvent = await factory.create(
  NoteBlueprint,
  "hello nostr:npub180cvv07tjdrrgpa0j7j7tmnyl2yr6yr7l8j4s3evf6u64th6gkwsyjh6w6 #introductions",
);

console.log(unsignedEvent);
{
  kind: 1,
  content: "hello nostr:npub180cvv07tjdrrgpa0j7j7tmnyl2yr6yr7l8j4s3evf6u64th6gkwsyjh6w6 #introductions",
  created_at: 0,
  tags: [['p', '3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d'], ['t', 'introductions']]
}
```

## Creating a comment

```js
import { EventFactory } from "applesauce-factory";
import { CommentBlueprint } from "applesauce-factory/blueprints";

const originalEvent = {id: 'caa65d8b3b11d887da7188f3fe75c33d7be80d3df8c46f241a275b9075888674', kind: 30023, ...}

const factory = new EventFactory();

const unsignedEvent = await factory.create(
  CommentBlueprint,
  "great article",
);

console.log(unsignedEvent);
{
  kind: 1111,
  content: "great article",
  tags: [
    ["A", "30023:3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d:ad84e3b3"],
    [
      "E",
      "caa65d8b3b11d887da7188f3fe75c33d7be80d3df8c46f241a275b9075888674",
      "",
      "3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d",
    ],
    ["K", "30023"],
    ["a", "30023:3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d:ad84e3b3"],
    [
      "e",
      "caa65d8b3b11d887da7188f3fe75c33d7be80d3df8c46f241a275b9075888674",
      "",
      "3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d",
    ],
    ["k", "30023"],
    ["p", "3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d"],
  ],
}
```
