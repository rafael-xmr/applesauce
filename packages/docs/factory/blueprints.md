# Blueprints

## NoteBlueprint

The [`NoteBlueprint`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_factory.Blueprints.NoteBlueprint.html) can be used to create top level text notes (kind 1) and supports, quotes, emojis, and hashtags

## NoteReplyBlueprint

The [`NoteReplyBlueprint`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_factory.Blueprints.NoteReplyBlueprint.html) can be used to create note replies (kind 1) to top level text note (kind 1)

> [!IMPORTANT]
> The `NoteReplyBlueprint` only supports replying to kind 1 notes. if you need replies to other kinds use [`CommentBlueprint`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_factory.Blueprints.CommentBlueprint.html)

## CommentBlueprint

The [`CommentBlueprint`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_factory.Blueprints.CommentBlueprint.html) can be used to create [NIP-22](https://github.com/nostr-protocol/nips/blob/master/22.md) comments on any event kind

## ReactionBlueprint

The [`ReactionBlueprint`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_factory.Blueprints.ReactionBlueprint.html) can be used to create [NIP-25](https://github.com/nostr-protocol/nips/blob/master/25.md) reactions and supports the common `+` and `-` reactions along with [NIP-30](https://github.com/nostr-protocol/nips/blob/master/30.md) emojis

## ShareBlueprint

The [`ShareBlueprint`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_factory.Blueprints.ShareBlueprint.html) can be used to create [NIP-18](https://github.com/nostr-protocol/nips/blob/master/18.md) repost / share event

## DeleteBlueprint

The [`DeleteBlueprint`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_factory.Blueprints.DeleteBlueprint.html) can be used to create [NIP-09](https://github.com/nostr-protocol/nips/blob/master/09.md) delete event
