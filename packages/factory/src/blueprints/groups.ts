import { GROUP_MESSAGE_KIND, GroupPointer } from "applesauce-core/helpers";
import { NostrEvent } from "nostr-tools";

import { createTextContentOperations, TextContentOptions } from "../operations/content.js";
import { EventFactory, EventFactoryBlueprint } from "../event-factory.js";
import { includeGroupHTag, includeGroupPreviousTags } from "../operations/groups.js";

/** A blueprint for a NIP-29 group message */
export function GroupMessageBlueprint(
  group: GroupPointer,
  content: string,
  options?: { previous: NostrEvent[] } & TextContentOptions,
): EventFactoryBlueprint {
  return (ctx) =>
    EventFactory.runProcess(
      { kind: GROUP_MESSAGE_KIND },
      ctx,
      // include group id "h" tag
      includeGroupHTag(group),
      // include "previous" events tags
      options?.previous && includeGroupPreviousTags(options.previous),
      // set text content
      ...createTextContentOperations(content, options),
    );
}
