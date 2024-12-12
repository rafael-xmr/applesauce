# Operations

Operations a single steps in the process of building events

## Content

- [`setContent`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_factory.Operations.setContent.html) Override the event content
- [`setEncryptedContent`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_factory.Operations.setEncryptedContent.html) Encrypts the content to a pubkey
- [`repairContentNostrLinks`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_factory.Operations.repairContentNostrLinks.html) Replaces any `@npub` or bare `npub` mentions with `nostr:` prefix
- [`tagPubkeyMentionedInContent`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_factory.Operations.tagPubkeyMentionedInContent.html) "p" tag any pubkey mentioned in the content using nostr: links. should be used after `repairContentNostrLinks`
- [`createTextContentOperations`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_factory.Operations.createTextContentOperations.html) Creates an array of operators for common text content in kind 1 notes

## Comment

- [`includeCommentTags`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_factory.Operations.includeCommentTags.html) Includes [NIP-22](https://github.com/nostr-protocol/nips/blob/master/22.md) tags

## Emoji

- [`includeContentEmojiTags`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_factory.Operations.includeContentEmojiTags.html) Includes any [NIP-30](https://github.com/nostr-protocol/nips/blob/master/30.md) `emoji` tags for custom emojis in the `content`

## Hashtags

- [`includeContentHashtags`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_factory.Operations.includeContentHashtags.html) Includes "t" tags for any hashtag used in the `content`

## Quotes

- [`includeQuoteTags`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_factory.Operations.includeQuoteTags.html) Includes "q" tags for any event quoted in the `content`

## Notes

- [`includeNoteReplyTags`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_factory.Operations.includeNoteReplyTags.html) Includes [NIP-10](https://github.com/nostr-protocol/nips/blob/master/10.md) `emoji` tags for note replies
