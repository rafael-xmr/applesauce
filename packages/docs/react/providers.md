# Providers

## QueryStoreProvider

The [`QueryStoreProvider`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_react.QueryStoreProvider.html) can be used to provide a `QueryStore` and `EventStore` to the app

```tsx{5,7}
const eventStore = new EventStore();
const queryStore = new QueryStore(eventStore);

const root = (
  <QueryStoreProvider store={queryStore}>
    <App />
  </QueryStoreProvider>
);
```

Once your app is wrapped in the provider you can access the query store anywhere using the [`useQueryStore`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_react.Hooks.useQueryStore.html) hook

```tsx{2}
function UserName({ pubkey }: { pubkey: string }) {
  const store = useQueryStore();

  const [profile, setProfile] = useState();

  useEffect(() => {
    const sub = store.profile(pubkey).subscribe(setProfile);

    return () => sub.unsubscribe();
  }, [pubkey, store]);

  return <span>{profile?.display_name}</span>;
}
```

## FactoryProvider

The [FactoryProvider](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_react.FactoryProvider.html) can be used to provide an [EventFactory](https://hzrd149.github.io/applesauce/typedoc/classes/applesauce_factory.EventFactory.html) to components

## AccountsProvider

The [AccountsProvider](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_react.AccountsProvider.html) can be used to provide an [AccountManager](https://hzrd149.github.io/applesauce/typedoc/classes/applesauce_accounts.AccountManager.html) to components and allows them to use the [useActiveAccount](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_react.Hooks.useActiveAccount.html) and [useAccountManager](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_react.Hooks.useAccountManager.html) hooks
