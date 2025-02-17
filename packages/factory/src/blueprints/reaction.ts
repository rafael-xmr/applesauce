import { Emoji } from "applesauce-core/helpers";
import { kinds, NostrEvent } from "nostr-tools";

import { EventFactory, EventFactoryBlueprint } from "../event-factory.js";
import { includeReactionTags, setReactionContent } from "../operations/reaction.js";
import { includeContentEmojiTags } from "../operations/emojis.js";

/** blueprint for kind 7 reaction event */
export function ReactionBlueprint(event: NostrEvent, emoji: string | Emoji = "+"): EventFactoryBlueprint {
  return (ctx) =>
    EventFactory.runProcess(
      { kind: kinds.Reaction },
      ctx,
      setReactionContent(emoji),
      includeReactionTags(event),
      typeof emoji !== "string" ? includeContentEmojiTags([emoji]) : undefined,
    );
}
