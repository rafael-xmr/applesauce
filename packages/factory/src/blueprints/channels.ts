import { kinds, NostrEvent } from "nostr-tools";

import { createTextContentOperations, TextContentOptions } from "../operations/content.js";
import { EventFactory, EventFactoryBlueprint } from "../event-factory.js";
import { includeNoteThreadingNotifyTags, includeNoteThreadingTags } from "../operations/note.js";
import { includeChannelPointerTag } from "../operations/channels.js";

/** Creates a NIP-28 channel message */
export function ChannelMessageBlueprint(
  channel: NostrEvent,
  message: string,
  options?: TextContentOptions,
): EventFactoryBlueprint {
  return (ctx) =>
    EventFactory.runProcess(
      { kind: kinds.ChannelMessage },
      ctx,
      includeChannelPointerTag(channel),
      ...createTextContentOperations(message, options),
    );
}

/** Creates a NIP-28 channel message reply */
export function ChannelMessageReplyBlueprint(
  parent: NostrEvent,
  message: string,
  options?: TextContentOptions,
): EventFactoryBlueprint {
  return (ctx) =>
    EventFactory.runProcess(
      { kind: kinds.ChannelMessage },
      ctx,
      includeNoteThreadingTags(parent),
      includeNoteThreadingNotifyTags(parent),
      ...createTextContentOperations(message, options),
    );
}
