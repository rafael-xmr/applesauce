# Providers

The [`QueryStoreProvider`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_react.QueryStoreProvider.html) can be used to provide a [`QueryStore`](../core/query-store.md) to the app

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
