# Actions

Actions are common pre-built async operations apps can perform. they use the `EventStore` as state, the `EventFactory` to build new events, and a `publish` method to publish or save the resulting events

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

// start using action hub
```

:::info
For performance reasons, its recommended to only create a single `ActionHub` instance for your whole app
:::

## What is an action

An [Action](https://hzrd149.github.io/applesauce/typedoc/types/applesauce_actions.Action.html) is an async method that reads from the event store and preforms actions by creating events using the event factory and event publisher

You can see the full list of built-in actions in the [reference](https://hzrd149.github.io/applesauce/typedoc/modules/applesauce_actions.Actions.html)

## Running actions

[ActionHub.run](https://hzrd149.github.io/applesauce/typedoc/classes/applesauce_actions.ActionHub.html#run) can be used to run actions once an action hub is created

:::warning
To avoid overriding replaceable events, actions will throw if an existing replaceable event cant be found
:::

Here are a few simple examples

```ts
import { FollowUser } from "applesauce-actions/actions";

// create a new contact list event
try {
  await hub.run(NewContacts);
} catch (err) {
  // this will throw if a contact list already exists
}

// follow a user
await hub.run(
  FollowUser,
  "3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d",
  "wss://pyramid.fiatjaf.com/",
);
```

## Custom actions

Custom actions are simply methods that take custom arguments and return an async method

```ts
import { Action } from "applesauce-actions";
import { updateProfileContent } from "applesauce-factory/operations/event";

function CustomSetNameAction(newName = "fiatjaf"): Action {
  return async ({ events, factory, self, publish }) => {
    // get the profile event
    const profile = events.getReplaceable(0, self);

    // throw if the profile event cant be found
    if (!profile) throw new Error("Cant find profile");

    // create a new unsigned profile event with a new name
    const draft = await factory.modify(profile, updateProfileContent({ name: newName }));

    // request the user to sign the event
    const signed = await factory.sign(draft);

    // ask the app the publish the app
    await publish("Set profile name", signed);
  };
}
```
