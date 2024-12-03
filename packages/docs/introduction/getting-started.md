# Getting Started

There are three main components that makeup the applesauce libraries: [Helpers](https://hzrd149.github.io/applesauce/typedoc/modules/applesauce_core.Helpers.html), the [EventStore](https://hzrd149.github.io/applesauce/typedoc/classes/applesauce_core.EventStore.html), and [Queries](https://hzrd149.github.io/applesauce/typedoc/modules/applesauce_core.Queries.html)

## Helpers

Helper methods are the core of the library and serve to extract and parse nostr events

A few good example methods are [getProfileContent](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_core.Helpers.getProfileContent.html) which returns the parsed content of a kind:0 event and [getOutboxes](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_core.Helpers.getOutboxes.html) which returns an array of outbox _(write)_ relays from a kind:10002 relay list event

## EventStore

## Queries

Queries combine the `EventStore` with the helper methods. using queries you can subscribe to the event store and get the parsed profile content or users relays

```ts
// Get the parsed profile content for a pubkey and subscribe to any changes
const sub = queryStore
  .runQuery(ProfileQuery)("3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d")
  .subscribe((profile) => {
    console.log(profile);
  });
```

## QueryStore

The `QueryStore` is built on top of the `EventStore` and handles managing and running the queries. its primary role is to ensure that only a single query for each filter is created and that it is wrapped in the rxjs [share](https://rxjs.dev/api/index/function/share) operator for performance reasons
