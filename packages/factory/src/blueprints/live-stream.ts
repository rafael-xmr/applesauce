import { kinds, NostrEvent } from "nostr-tools";
import { createTextContentOperations, TextContentOptions } from "../operations/event/content.js";
import { EventFactory, EventBlueprint } from "../event-factory.js";
import { includeLiveStreamTag } from "../operations/event/live-stream.js";

/** A blueprint for creating a live stream message */
export function LiveChatMessageBlueprint(
  stream: NostrEvent,
  message: string,
  options?: TextContentOptions,
): EventBlueprint {
  return (ctx) =>
    EventFactory.runProcess(
      { kind: kinds.LiveChatMessage },
      ctx,
      includeLiveStreamTag(stream),
      ...createTextContentOperations(message, options),
    );
}
