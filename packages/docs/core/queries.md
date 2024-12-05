# Queries

Queries are methods that construct complex observable pipelines off of the [`EventStore`](./event-store.md)

They are run inside the [`QueryStore`](./query-store.md) which ensures there are not duplicate queries

## SingleEventQuery

The [`SingleEventQuery`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_core.Queries.SingleEventQuery.html) can be used to subscribes to a single event

## MultipleEventsQuery

The [`MultipleEventsQuery`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_core.Queries.MultipleEventsQuery.html) can be used to subscribes to a multiple events

## ReplaceableQuery

The [`ReplaceableQuery`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_core.Queries.ReplaceableQuery.html) can be used to subscribes to the latest version of a replaceable event

## ReplaceableSetQuery

The [`ReplaceableSetQuery`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_core.Queries.ReplaceableSetQuery.html) can be used to subscribe to an array of `AddressPointer`

## TimelineQuery

The [`TimelineQuery`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_core.Queries.TimelineQuery.html) can be used to subscribe a sorted array of events that match filters

## ProfileQuery

Th [`ProfileQuery`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_core.Queries.ProfileQuery.html) can be used to subscribe to a single pubkeys profile ( kind 0 )

## MailboxesQuery

Th [`MailboxesQuery`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_core.Queries.MailboxesQuery.html) can be used to subscribe to a single pubkeys mailboxes ( kind 10002 )

## ReactionsQuery

The [`ReactionsQuery`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_core.Queries.ReactionsQuery.html) can be used to subscribe to all [NIP-25](https://github.com/nostr-protocol/nips/blob/master/25.md) reactions to an event
