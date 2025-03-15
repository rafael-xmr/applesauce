import { kinds } from "nostr-tools";
import { addPubkeyTag, removePubkeyTag } from "applesauce-factory/operations/tag";
import { IEventStore } from "applesauce-core";

import { Action } from "../action-hub.js";

function getFollowSetEvent(events: IEventStore, self: string, identifier: string) {
  return events.getReplaceable(kinds.Followsets, self, identifier);
}

/**
 * An action that adds a pubkey to a follow set
 * @param pubkey the pubkey to add to the set
 * @param identifier the "d" tag of the follow set
 * @param hidden set to true to add to hidden follows
 */
export function AddUserToFollowSet(pubkey: string, identifier: string, hidden = false): Action {
  return async function* ({ events, factory, self }) {
    const follows = getFollowSetEvent(events, self, identifier);
    if (!follows) throw new Error("Can't find follow set");

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
export function RemoveUserFromFollowSet(pubkey: string, identifier: string, hidden = false): Action {
  return async function* ({ events, factory, self }) {
    const follows = getFollowSetEvent(events, self, identifier);
    if (!follows) throw new Error("Can't find follow set");

    const operation = removePubkeyTag(pubkey);

    const draft = await factory.modifyTags(follows, hidden ? { hidden: operation } : operation);
    yield await factory.sign(draft);
  };
}
