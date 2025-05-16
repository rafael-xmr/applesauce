# React Hooks

## useObservable

The [`useObservable`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce-react.Hooks.useObservable.html) hook is a thing wrapper around the `useObservableState` hook from [observable-hooks](https://observable-hooks.js.org/) that allows `undefined` to be passed

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

The [`useQueryStore`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce-react.Hooks.useQueryStore.html) hook can be used at access the `QueryStore` from anywhere in the react tree

## useEventStore

The [`useEventStore`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce-react.Hooks.useEventStore.html) hook can be used at access the `EventStore` from anywhere in the react tree

## useStoreQuery

The [`useStoreQuery`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce-react.Hooks.useStoreQuery.html) hook requires the `QueryStoreProvider` and can be used to create and run a query in the `QueryStore` and subscribe to the results

```ts
function UserAvatar({ pubkey }: { pubkey: string }) {
  const profile = useStoreQuery(ProfileQuery, [pubkey]);
	// profile will be undefined until the event is loaded

	return <img src={profile?.picture}/>
}
```

## useEventFactory

The [`useEventFactory`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce-react.Hooks.useEventFactory.html) hook can be used at access the `EventFactory` from anywhere in the react tree

## useActiveAccount

The [useActiveAccount](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce-react.Hooks.useActiveAccount.html) hook requires the `AccountsProvider` and returns the currently active account or `undefined`

## useAccountManager

The [useAccountManager](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce-react.Hooks.useAccountManager.html) hook requires the `AccountsProvider` and returns the `AccountManager` class

## useRenderedContent

The [useRenderedContent](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce-react.Hooks.useRenderedContent.html) hook can be used to parse and render an events `content` into a JSX tree

::: info
The components directory should be defined outside of the component itself to avoid unnecessary re-renders
:::

```js
const event = { content: "hello world #grownostr", tags: [["t", "grownostr"]] };

// a directory of optional components to use when rendering the content
const components = {
  // render hashtags inline
  hashtag: ({ node }) => <a href={`/hashtag/${node.hashtag}`}>{node.name}</a>,
  // custom NIP-30 emojis
  emoji: ({ node }) => <img src={node.url} style={{ width: "1.1em" }} />,
};

// A simple component to render an event
function SimpleNote({ event }) {
  const content = useRenderedContent(event, components);

  return (
    <div>
      <div>
        {event.pubkey} {event.created_at}
      </div>
      {content}
    </div>
  );
}

// render the event
<SimpleNote event={event} />;
```
