# Actions

Actions are async operations apps can perform using the `EventStore` as the known state, the `EventFactory` to build new events, and a `publish` method to publish or save the resulting events

## Action Hub

The `ActionHub` class is a simple manager that combines the event store, event factory, and publish methods into a single place and provides and easy way to run actions

```ts
import { ActionHub } from "applesauce-actions";

// custom publish logic
const publish = async (label: string, event: NostrEvent, explicitRelays?: string[]) => {
  console.log("Publishing", label, event);
  if (explicitRelays) {
    await app.relayPool.publish(event, explicitRelays);
  } else {
    await app.relayPool.publish(event, app.defaultRelays);
  }
};

// create a new action hub with an event store, event factory, and custom publish method
const hub = new ActionHub(eventStore, eventFactory, publish);
```

## What is an action

WIP

## Running actions

WIP

## Custom actions

WIP
