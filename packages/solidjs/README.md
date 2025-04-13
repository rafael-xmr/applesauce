# applesauce-solidjs

[SolidJS](https://www.solidjs.com/) hooks and providers for applesauce

## Installation

```bash
npm install applesauce-solidjs
```

## Example

```tsx
import { from } from "solid-js";
import { EventStore, QueryStore, Queries } from "applesauce-core";
import { QueryStoreProvider, useQueryStore } from "applesauce-solidjs/context";

const eventStore = new EventStore();
const queryStore = new QueryStore(eventStore);

function UserName({ pubkey }: { pubkey: string }) {
  const queryStore = useQueryStore();
  const profile = from(queryStore.createQuery(Queries.ProfileQuery, [pubkey]));

  return <span>{profile() ? profile().name : "loading..."}</span>;
}

function App() {
  return (
    <QueryStoreProvider queryStore={queryStore}>
      <h1>App</h1>

      <UserName pubkey="82341f882b6eabcd2ba7f1ef90aad961cf074af15b9ef44a09f9d2a8fbfbe6a2" />
    </QueryStoreProvider>
  );
}
```
