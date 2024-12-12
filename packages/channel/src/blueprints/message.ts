import { EventFactory, EventFactoryBlueprint } from "applesauce-factory";
import {
  createTextContentOperations,
  includeNoteThreadingNotifyTags,
  includeNoteThreadingTags,
  TextContentOptions,
} from "applesauce-factory/operations";
import { kinds, NostrEvent } from "nostr-tools";

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
      includeNoteThreadingTags(channel),
      includeNoteThreadingNotifyTags(channel),
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
