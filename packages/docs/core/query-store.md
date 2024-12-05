# QueryStore

The [`QueryStore`](https://hzrd149.github.io/applesauce/typedoc/classes/applesauce_core.QueryStore.html) class wraps the [`EventStore`](./event-store.md) and allows you to run complex [`Queries`](./queries.md) against it

The role of the query store is to keep track of all queries, wrap them in the rxjs [`share`](https://rxjs.dev/api/index/function/share) operator and ensure only one instance of each is created

> [!IMPORTANT]
> For performance reasons UI components should only subscribe to the `QueryStore` and NOT the `EventStore`

## Running a query

The [`queryStore.createQuery`](https://hzrd149.github.io/applesauce/typedoc/classes/applesauce_core.QueryStore.html#createQuery) can be used to create and register a query in the query store

Queries are not started until the they are subscribe to. and they are destroyed when all subscriptions are closed

```ts
// The first argument is the query constructor and the remaining are passed to the query
const observable = queryStore.createQuery(TimelineQuery, [{ kinds: [1] }]);

// start the query by subscribing to it
observable.subscribe((events) => {
  console.log(events);
});
```

## Performance

The query store keeps track of what queries have been created and will ensure that only a single instance is created

```ts
const notes = queryStore.createQuery(TimelineQuery, [{ kinds: [1] }]);

// lots of code...

const otherTimeline = queryStore.createQuery(TimelineQuery, [{ kinds: [1] }]);

// because the query with the same arguments was created before
// the second call will return the same observable
console.log(otherTimeline === notes);

// this will create a new query because the filter is different
const files = queryStore.createQuery(TimelineQuery, [{ kinds: [1063] }]);
```

## Prebuilt queries

The `QueryStore` instance has a few helper methods in order to easily create common queries

### Single event

The [`queryStore.event`](https://hzrd149.github.io/applesauce/typedoc/classes/applesauce_core.QueryStore.html#event) method creates a [`SingleEventQuery`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_core.Queries.SingleEventQuery.html) query

### Replaceable event

The [`queryStore.replaceable`](https://hzrd149.github.io/applesauce/typedoc/classes/applesauce_core.QueryStore.html#replaceable) method creates a [`ReplaceableQuery`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_core.Queries.ReplaceableQuery.html) query

### Profile

The [`queryStore.profile`](https://hzrd149.github.io/applesauce/typedoc/classes/applesauce_core.QueryStore.html#profile) method creates a [`ProfileQuery`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_core.Queries.ProfileQuery.html) query

### Timeline

The [`queryStore.timeline`](https://hzrd149.github.io/applesauce/typedoc/classes/applesauce_core.QueryStore.html#timeline) method creates a [`TimelineQuery`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_core.Queries.TimelineQuery.html) query

### Reactions

The [`queryStore.reactions`](https://hzrd149.github.io/applesauce/typedoc/classes/applesauce_core.QueryStore.html#reactions) method creates a [`ReactionsQuery`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_core.Queries.ReactionsQuery.html) query
