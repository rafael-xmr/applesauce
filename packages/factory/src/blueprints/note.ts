import { kinds } from "nostr-tools";
import { EventFactory, EventFactoryBlueprint } from "../event-factory.js";
import { createTextContentOperations, TextContentOptions } from "../operations/content.js";

/** Short text note (kind 1) blueprint */
export function NoteBlueprint(content: string, options?: TextContentOptions): EventFactoryBlueprint {
  return (ctx) =>
    EventFactory.runProcess({ kind: kinds.ShortTextNote }, ctx, ...createTextContentOperations(content, options));
}
