# Custom Queries

A custom query method is simply a function that returns a [`Query`](https://hzrd149.github.io/applesauce/typedoc/types/applesauce_core.Query.html) object

For example here is a custom query that will subscribe to and parse a [NIP-78](https://github.com/nostr-protocol/nips/blob/master/78.md) app event that contains json

```ts
import { map } from "rxjs/operators";

function AppSettingsQuery<T>(pubkey: string): Query<T> {
  return {
    key: pubkey,
    run: (events) =>
      events.replaceable(30078, pubkey, "app-settings").pipe(
        map((event) => {
          if (!event) return undefined;
          return JSON.parse(event.content, defaultSettings) as T;
        }),
      ),
  };
}

const sub = queryStore
  .runQuery(AppSettingsQuery)("3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d")
  .subscribe((json) => {
    // json will either be undefined or { theme: string }
    if (json) console.log("updated data", json);
  });

eventStore.add({
  kind: 30078,
  content: '{"theme": "dark"}',
  // rest of event
});
```
