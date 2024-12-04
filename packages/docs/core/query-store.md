# QueryStore

The [`QueryStore`](https://hzrd149.github.io/applesauce/typedoc/classes/applesauce_core.QueryStore.html) class wraps the [`EventStore`](./event-store.md) and allows you to run complex [`Queries`](./queries.md) against it

The role of the query store is to keep track of all queries, wrap them in the rxjs [`share`](https://rxjs.dev/api/index/function/share) operator and ensure only one instance of each is created

> [!IMPORTANT]
> For performance reasons UI components should only subscribe to the `QueryStore` and NOT the `EventStore`
