import { kinds, NostrEvent } from "nostr-tools";

import { createTextContentOperations, TextContentOptions } from "../operations/event/content.js";
import { EventFactory, EventBlueprint } from "../event-factory.js";
import { includeNoteThreadingNotifyTags, includeNoteThreadingTags } from "../operations/event/note.js";
import { includeChannelPointerTag } from "../operations/event/channels.js";

/** Creates a NIP-28 channel message */
export function ChannelMessageBlueprint(
  channel: NostrEvent,
  message: string,
  options?: TextContentOptions,
): EventBlueprint {
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
): EventBlueprint {
  return (ctx) =>
    EventFactory.runProcess(
      { kind: kinds.ChannelMessage },
      ctx,
      includeNoteThreadingTags(parent),
      includeNoteThreadingNotifyTags(parent),
      ...createTextContentOperations(message, options),
    );
}
