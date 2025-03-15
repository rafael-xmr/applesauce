import { kinds, NostrEvent } from "nostr-tools";
import { addPubkeyTag, removePubkeyTag } from "applesauce-factory/operations/tag";
import { IEventStore } from "applesauce-core";

import { Action } from "../action-hub.js";

function getFollowSetEvent(events: IEventStore, self: string, identifier: NostrEvent | string) {
  const set = typeof identifier === "string" ? events.getReplaceable(kinds.Followsets, self, identifier) : identifier;
  if (!set) throw new Error("Can't find follow set");
  if (set.kind !== kinds.Followsets) throw new Error("Event is not a follow set");
  return set;
}

/**
 * An action that adds a pubkey to a follow set
 * @param pubkey the pubkey to add to the set
 * @param identifier the "d" tag of the follow set
 * @param hidden set to true to add to hidden follows
 */
export function AddUserToFollowSet(pubkey: string, identifier: NostrEvent | string, hidden = false): Action {
  return async function* ({ events, factory, self }) {
    const follows = getFollowSetEvent(events, self, identifier);

    const operation = addPubkeyTag({ pubkey });

    const draft = await factory.modifyTags(follows, hidden ? { hidden: operation } : operation);
    yield await factory.sign(draft);
  };
}

/**
 * An action that removes a pubkey from a follow set
 * @param pubkey the pubkey to remove from the set
 * @param identifier the "d" tag of the follow set
 * @param hidden set to true to remove from hidden follows
 */
export function RemoveUserFromFollowSet(pubkey: string, identifier: NostrEvent | string, hidden = false): Action {
  return async function* ({ events, factory, self }) {
    const follows = getFollowSetEvent(events, self, identifier);

    const operation = removePubkeyTag(pubkey);

    const draft = await factory.modifyTags(follows, hidden ? { hidden: operation } : operation);
    yield await factory.sign(draft);
  };
}
