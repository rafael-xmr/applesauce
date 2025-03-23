import { kinds, NostrEvent } from "nostr-tools";
import { addPubkeyTag, removePubkeyTag } from "applesauce-factory/operations/tag";
import { IEventStore } from "applesauce-core";

import { Action } from "../action-hub.js";
import { ProfilePointer } from "nostr-tools/nip19";
import {
  modifyHiddenTags,
  modifyPublicTags,
  setListDescription,
  setListImage,
  setListTitle,
} from "applesauce-factory/operations/event";

export type FollowSetInformation = {
  title?: string;
  description?: string;
  image?: string;
};

function getFollowSetEvent(events: IEventStore, self: string, identifier: NostrEvent | string) {
  const set = typeof identifier === "string" ? events.getReplaceable(kinds.Followsets, self, identifier) : identifier;
  if (!set) throw new Error("Can't find follow set");
  if (set.kind !== kinds.Followsets) throw new Error("Event is not a follow set");
  return set;
}

/**
 * An action that creates a new follow set
 * @param identifier the "d" tag of the follow set
 * @param pubkeys the pubkeys to add to the follow set
 * @param hidden set to true to create a hidden follow set
 * @throws if a follow set already exists
 */
export function CreateFollowSet(
  identifier: string,
  pubkeys: (string | ProfilePointer)[],
  info?: FollowSetInformation,
  hidden = false,
): Action {
  return async function* ({ events, factory, self }) {
    const existing = events.getReplaceable(kinds.Followsets, self, identifier);
    if (existing) throw new Error("Follow set already exists");

    const operations = pubkeys.map((p) => addPubkeyTag(p));
    const draft = await factory.build(
      { kind: kinds.Followsets },

      // set list information
      info?.title ? setListTitle(info.title) : undefined,
      info?.description ? setListDescription(info.description) : undefined,
      info?.image ? setListImage(info.image) : undefined,

      // add pubkey tags
      hidden ? modifyHiddenTags(...operations) : modifyPublicTags(...operations),
    );

    yield await factory.sign(draft);
  };
}

/**
 * An action that adds a pubkey to a follow set
 * @param pubkey the pubkey to add to the set
 * @param identifier the "d" tag of the follow set
 * @param hidden set to true to add to hidden follows
 * @throws if the follow set does not exist
 */
export function AddUserToFollowSet(
  pubkey: (string | ProfilePointer)[] | string | ProfilePointer,
  identifier: NostrEvent | string,
  hidden = false,
): Action {
  return async function* ({ events, factory, self }) {
    const follows = getFollowSetEvent(events, self, identifier);

    const operations = Array.isArray(pubkey) ? pubkey.map((p) => addPubkeyTag(p)) : addPubkeyTag(pubkey);

    const draft = await factory.modifyTags(follows, hidden ? { hidden: operations } : operations);
    yield await factory.sign(draft);
  };
}

/**
 * An action that removes a pubkey from a follow set
 * @param pubkey the pubkey to remove from the set
 * @param identifier the "d" tag of the follow set
 * @param hidden set to true to remove from hidden follows
 * @throws if the follow set does not exist
 */
export function RemoveUserFromFollowSet(
  pubkey: (string | ProfilePointer)[] | string | ProfilePointer,
  identifier: NostrEvent | string,
  hidden = false,
): Action {
  return async function* ({ events, factory, self }) {
    const follows = getFollowSetEvent(events, self, identifier);

    const operations = Array.isArray(pubkey) ? pubkey.map((p) => removePubkeyTag(p)) : removePubkeyTag(pubkey);

    const draft = await factory.modifyTags(follows, hidden ? { hidden: operations } : operations);
    yield await factory.sign(draft);
  };
}

/**
 * An action that updates the title, description, or image of a follow set
 * @param identifier the "d" tag of the follow set
 * @param info the new information for the follow set
 * @throws if the follow set does not exist
 */
export function UpdateFollowSetInformation(identifier: string, info: FollowSetInformation): Action {
  return async function* ({ events, factory, self }) {
    const follows = getFollowSetEvent(events, self, identifier);

    const draft = await factory.modify(
      follows,

      info?.title ? setListTitle(info.title) : undefined,
      info?.description ? setListDescription(info.description) : undefined,
      info?.image ? setListImage(info.image) : undefined,
    );

    yield await factory.sign(draft);
  };
}
