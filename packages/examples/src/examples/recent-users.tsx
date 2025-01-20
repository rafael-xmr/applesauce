import { useEffect } from "react";
import { Avatar, Container, Stack, Typography } from "@mui/material";
import { EventStore, QueryStore } from "applesauce-core";
import { QueryStoreProvider } from "applesauce-react";
import { SimplePool } from "nostr-tools";
import { useStoreQuery } from "applesauce-react/hooks";
import { ProfileQuery, TimelineQuery } from "applesauce-core/queries";

const eventStore = new EventStore();
const queryStore = new QueryStore(eventStore);

const pool = new SimplePool();

function User({ pubkey }: { pubkey: string }) {
  const profile = useStoreQuery(ProfileQuery, [pubkey]);

  return <Avatar src={profile?.picture} alt={profile?.display_name || profile?.name} />;
}

function RecentUsers() {
  useEffect(() => {
    const sub = pool.subscribeMany(["wss://relay.damus.io", "wss://nostrue.com"], [{ kinds: [0], limit: 100 }], {
      onevent: (event) => eventStore.add(event),
    });

    return () => sub.close();
  }, []);

  const events = useStoreQuery(TimelineQuery, [[{ kinds: [0] }]]);

  return (
    <Container>
      <Typography variant="h5" gutterBottom>
        Recent users
      </Typography>

      <Stack direction="row" flexWrap="wrap">
        {events?.map((event) => <User key={event.id} pubkey={event.pubkey} />)}
      </Stack>
    </Container>
  );
}

export default function App() {
  return (
    <QueryStoreProvider queryStore={queryStore}>
      <RecentUsers />
    </QueryStoreProvider>
  );
}
