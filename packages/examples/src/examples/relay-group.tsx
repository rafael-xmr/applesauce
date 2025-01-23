import { useEffect, useState } from "react";
import { Button, Container, FormControl, FormHelperText, Input, InputLabel, Stack } from "@mui/material";
import { decodeGroupPointer, getSeenRelays, GroupPointer } from "applesauce-core/helpers";
import { EventStore, QueryStore } from "applesauce-core";
import { SimplePool } from "nostr-tools";
import { useStoreQuery } from "applesauce-react/hooks";
import { TimelineQuery } from "applesauce-core/queries";
import { npubEncode } from "nostr-tools/nip19";
import { QueryStoreProvider } from "applesauce-react";

const eventStore = new EventStore();
const queryStore = new QueryStore(eventStore);

const pool = new SimplePool();

function ChatLog({ pointer }: { pointer: GroupPointer }) {
  const [status, setStatus] = useState("connecting...");
  const url = `wss://${pointer.relay}`;

  useEffect(() => {
    const sub = pool.subscribeMany([url], [{ kinds: [9], "#h": [pointer.id] }], {
      onevent: (event) => {
        setStatus("connected");
        eventStore.add(event, url);
      },
      onclose: () => setStatus("closed"),
    });
    return () => sub.close();
  }, [pointer, url]);

  const messages = useStoreQuery(TimelineQuery, [{ kinds: [9], "#h": [pointer.id] }])?.filter((event) =>
    getSeenRelays(event)?.has(url),
  );

  return (
    <Stack direction="column" spacing={1}>
      <center>{status}</center>
      {messages?.map((message) => (
        <p key={message.id}>
          {npubEncode(message.pubkey).slice(0, 10)}: {message.content}
        </p>
      ))}
    </Stack>
  );
}

export default function RelayGroupExample() {
  const [identifier, setIdentifier] = useState("");

  const [pointer, setPointer] = useState<GroupPointer>();

  const load = () => {
    try {
      setPointer(decodeGroupPointer(identifier));
    } catch (error) {}
  };

  return (
    <QueryStoreProvider queryStore={queryStore}>
      <Container>
        <Stack direction="row" spacing={2} padding={2} width="600px" alignItems="center">
          <FormControl size="medium">
            <InputLabel htmlFor="group-id">Group Identifier</InputLabel>
            <Input
              id="group-id"
              aria-describedby="group-helper"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
            <FormHelperText id="group-helper">The NIP-29 group identifier</FormHelperText>
          </FormControl>
          <Button onClick={load} variant="contained">
            Load
          </Button>
        </Stack>

        {pointer && <ChatLog pointer={pointer} />}
      </Container>
    </QueryStoreProvider>
  );
}
