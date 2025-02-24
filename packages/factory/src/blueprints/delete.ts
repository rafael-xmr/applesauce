import { kinds, NostrEvent } from "nostr-tools";

import { EventFactory, EventBlueprint } from "../event-factory.js";
import { setContent } from "../operations/event/content.js";
import { includeDeleteTags } from "../operations/event/delete.js";

/** A blueprint for a NIP-09 delete event */
export function DeleteBlueprint(events: NostrEvent[], reason?: string): EventBlueprint {
  return (ctx) =>
    EventFactory.runProcess(
      { kind: kinds.EventDeletion },
      ctx,
      reason ? setContent(reason) : undefined,
      includeDeleteTags(events),
    );
}
