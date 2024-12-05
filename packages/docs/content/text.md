# Text Content

## Parsing content

The [`getParsedContent`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_content.Text.getParsedContent.html) method can be used to parse and transform an event into the content syntax tree

## Cashing

Because parsing and transforming content is an expensive operation `getParsedContent` will cache the results on the event under a [Symbol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol), by default this is the [`TextNoteContentSymbol`](https://hzrd149.github.io/applesauce/typedoc/variables/applesauce_content.Text.TextNoteContentSymbol.html)

If your parsing or transforming different event kinds than kind 1, its recommended to create a new `Symbol` to and pass to `getParsedContent` to avoid cache collisions with the default kind 1 processor

## Links

TODO

## Mentions

The [`nostrMentions`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_content.Text.nostrMentions.html) transformer can be used to add [`Mention`](https://hzrd149.github.io/applesauce/typedoc/interfaces/applesauce_content.Nast.Mention.html) nodes to the tree

## Hashtags

The [`hashtags`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_content.Text.hashtags.html) transformer can be used to add [`Hashtag`](https://hzrd149.github.io/applesauce/typedoc/interfaces/applesauce_content.Nast.Hashtag.html) nodes to the tree

## Emojis

The [`emojis`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_content.Text.emojis.html) transformer will add [`Emoji`](https://hzrd149.github.io/applesauce/typedoc/interfaces/applesauce_content.Nast.Emoji.html) tags for any [NIP-30](https://github.com/nostr-protocol/nips/blob/master/30.md) emojis

## Galleries

The [`galleries`](https://hzrd149.github.io/applesauce/typedoc/functions/applesauce_content.Text.galleries.html) transformer will group image URLs into a [`Gallery`](https://hzrd149.github.io/applesauce/typedoc/interfaces/applesauce_content.Nast.Gallery.html) node

## Lightning invoices

TODO

## Cashu tokens and payment requests

TODO
