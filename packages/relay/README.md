# Applesauce Relay

`applesauce-relay` is a nostr relay communication framework built on top of [RxJS](https://rxjs.dev/)

## Installation

```bash
npm install applesauce-relay
```

## Features

- [x] NIP-01
- [x] Client negentropy sync
- [x] Relay pool and groups
- [x] Write tests
- [ ] Reconnection logic
- [ ] NIP-11 limitations
- [ ] NIP-45 COUNT

## Examples

### Single Relay

```typescript
import { Relay } from "./relay";

// Connect to a single relay
const relay = new Relay("wss://relay.example.com");

// Subscribe to events
relay
  .req({
    kinds: [1],
    limit: 10,
  })
  .subscribe((response) => {
    if (response === "EOSE") {
      console.log("End of stored events");
    } else {
      console.log("Received event:", response);
    }
  });

// Publish an event
const event = {
  kind: 1,
  content: "Hello Nostr!",
  created_at: Math.floor(Date.now() / 1000),
  tags: [],
  // ... other required fields
};

relay.event(event).subscribe((response) => {
  console.log(`Published:`, response.ok);
});
```

### Relay Pool

```typescript
import { RelayPool } from "./pool";

// Create a pool and connect to multiple relays
const pool = new RelayPool();
const relays = ["wss://relay1.example.com", "wss://relay2.example.com"];

// Subscribe to events from multiple relays
pool
  .req(relays, {
    kinds: [1],
    limit: 10,
  })
  .subscribe((response) => {
    if (response === "EOSE") {
      console.log("End of stored events");
    } else {
      console.log("Received event:", response);
    }
  });

// Publish to multiple relays
pool.event(relays, event).subscribe((response) => {
  console.log(`Published to ${response.from}:`, response.ok);
});
```

### Relay Group

```typescript
import { RelayPool } from "./pool";

const pool = new RelayPool();
const relays = ["wss://relay1.example.com", "wss://relay2.example.com"];

// Create a group (automatically deduplicates events)
const group = pool.group(relays);

// Subscribe to events
group
  .req({
    kinds: [1],
    limit: 10,
  })
  .subscribe((response) => {
    console.log("Received:", response);
  });

// Publish to all relays in group
group.event(event).subscribe((response) => {
  console.log(`Published to ${response.from}:`, response.ok);
});
```
