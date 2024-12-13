import { kinds, NostrEvent } from "nostr-tools";
import { createTextContentOperations, TextContentOptions } from "../operations/content.js";
import { EventFactory, EventFactoryBlueprint } from "../event-factory.js";
import { includeLiveStreamTag } from "../operations/live-stream.js";

/** A blueprint for creating a live stream message */
export function LiveChatMessageBlueprint(
  stream: NostrEvent,
  message: string,
  options?: TextContentOptions,
): EventFactoryBlueprint {
  return (ctx) =>
    EventFactory.runProcess(
      { kind: kinds.LiveChatMessage },
      ctx,
      includeLiveStreamTag(stream),
      ...createTextContentOperations(message, options),
    );
}
