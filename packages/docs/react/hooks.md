# React Hooks

## useObservable

TODO

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
