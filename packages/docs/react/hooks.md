# React Hooks

## useObservable

The [`useObservable`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_react.Hooks.useObservable.html) hook is a thing wrapper around the `useObservableState` hook from [observable-hooks](https://observable-hooks.js.org/) that allows `undefined` to be passed

This is useful for subscribing to observables that are not created yet

```ts
const account = useActiveAccount(); // IAccount | null

const profileQuery = useMemo(() => {
  if (account) return queryStore.profile(account.pubkey);
  else return undefined;
}, [account]);

// profileQuery may be undefined
const profile = useObservable(profileQuery);
```

## useQueryStore

The [`useQueryStore`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_react.Hooks.useQueryStore.html) hook can be used at access the `QueryStore` from anywhere in the react tree

## useEventStore

The [`useEventStore`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_react.Hooks.useEventStore.html) hook can be used at access the `EventStore` from anywhere in the react tree

## useStoreQuery

The [`useStoreQuery`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_react.Hooks.useStoreQuery.html) hook requires the `QueryStoreProvider` and can be used to create and run a query in the `QueryStore` and subscribe to the results

```ts
function UserAvatar({ pubkey }: { pubkey: string }) {
  const profile = useStoreQuery(ProfileQuery, [pubkey]);
	// profile will be undefined until the event is loaded

	return <img src={profile?.picture}/>
}
```

## useEventFactory

The [`useEventFactory`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_react.Hooks.useEventFactory.html) hook can be used at access the `EventFactory` from anywhere in the react tree

## useActiveAccount

The [useActiveAccount](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_react.Hooks.useActiveAccount.html) hook requires the `AccountsProvider` and returns the currently active account or `undefined`

## useAccountManager

The [useAccountManager](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_react.Hooks.useAccountManager.html) hook requires the `AccountsProvider` and returns the `AccountManager` class
