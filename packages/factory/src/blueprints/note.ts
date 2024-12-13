import { kinds } from "nostr-tools";
import { ZapSplit } from "applesauce-core/helpers";

import { EventFactory, EventFactoryBlueprint } from "../event-factory.js";
import { createTextContentOperations, TextContentOptions } from "../operations/content.js";
import { setZapSplit } from "../operations/zap.js";

export type NoteBlueprintOptions = TextContentOptions & { splits?: Omit<ZapSplit, "percent" | "relay">[] };

/** Short text note (kind 1) blueprint */
export function NoteBlueprint(content: string, options?: NoteBlueprintOptions): EventFactoryBlueprint {
  return (ctx) =>
    EventFactory.runProcess(
      { kind: kinds.ShortTextNote },
      ctx,
      ...createTextContentOperations(content, options),
      options?.splits ? setZapSplit(options.splits) : undefined,
    );
}
