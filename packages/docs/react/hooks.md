# React Hooks

## useObservable

The [`useObservable`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_react.Hooks.useObservable.html) hook can be used to subscribe to the current and future values of an rxjs observable. its use internally in the `useStoreQuery` hook to subscribe to the query

## useQueryStore

The [`useQueryStore`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_react.Hooks.useQueryStore.html) hook can be used at access the [`QueryStore`](../core/query-store.md) from anywhere in the react tree

## useStoreQuery

The [`useStoreQuery`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_react.Hooks.useStoreQuery.html) hook can be used to run a [Query](../core/queries.md) in the [`QueryStore`](../core/query-store.md) and subscribe to the results

```ts
function UserAvatar({ pubkey }: { pubkey: string }) {
  const profile = useStoreQuery(ProfileQuery, [pubkey]);
	// profile will be undefined until the event is loaded

	return <img src={profile?.picture}/>
}
```
