import { kinds, NostrEvent } from "nostr-tools";
import { EventFactory, EventBlueprint } from "../event-factory.js";
import { includeShareTags, setShareContent, setShareKind } from "../operations/event/share.js";

/** Blueprint for a NIP-18 repost event */
export function ShareBlueprint(event: NostrEvent): EventBlueprint {
  return (ctx) =>
    EventFactory.runProcess(
      { kind: kinds.Repost },
      ctx,
      setShareKind(event),
      setShareContent(event),
      includeShareTags(event),
    );
}
