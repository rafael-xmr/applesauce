import { getReplaceableUID, getTagValue } from "applesauce-core/helpers";
import { NostrEvent } from "nostr-tools";
import { isParameterizedReplaceableKind } from "nostr-tools/kinds";
import {
  COMMENT_KIND,
  CommentPointer,
  getCommentRootPointer,
  isCommentAddressPointer,
  isCommentEventPointer,
} from "applesauce-core/helpers/comment";

import { fillAndTrimTag } from "./tag.js";

/** Create a set fo tags for a single CommentPointer */
export function createCommentTagsFromCommentPointer(pointer: CommentPointer, root = false): string[][] {
  if (isCommentEventPointer(pointer)) {
    return [
      fillAndTrimTag([root ? "E" : "e", pointer.id, pointer.relay, pointer.pubkey]),
      [root ? "K" : "k", String(pointer.kind)],
    ];
  } else if (isCommentAddressPointer(pointer)) {
    return [
      fillAndTrimTag([
        root ? "A" : "a",
        getReplaceableUID(pointer.kind, pointer.pubkey, pointer.identifier),
        pointer.relay,
      ]),
      pointer.id ? fillAndTrimTag([root ? "E" : "e", pointer.id, pointer.relay, pointer.pubkey]) : undefined,
      [root ? "K" : "k", String(pointer.kind)],
    ].filter((t) => !!t);
  } else {
    return [
      [root ? "I" : "i", pointer.identifier],
      [root ? "K" : "k", pointer.kind],
    ];
  }

  throw new Error("Unknown comment pointer kind");
}

/** Returns an array of NIP-22 tags for a kind 1111 reply event */
export function createCommentTagsForReply(parent: NostrEvent, relayHint?: string) {
  const tags: string[][] = [];

  let parentPointer: CommentPointer;
  if (isParameterizedReplaceableKind(parent.kind)) {
    const identifier = getTagValue(parent, "d");
    if (!identifier) throw new Error("Event missing identifier");
    parentPointer = { id: parent.id, pubkey: parent.pubkey, kind: parent.kind, relay: relayHint, identifier };
  } else {
    parentPointer = { id: parent.id, pubkey: parent.pubkey, kind: parent.kind, relay: relayHint };
  }

  // add root tags
  if (parent.kind === COMMENT_KIND) {
    // replying to a comment
    const pointer = getCommentRootPointer(parent);
    if (!pointer) throw new Error("Comment missing root pointer");

    // recreate the root tags
    tags.push(...createCommentTagsFromCommentPointer(pointer, true));
  } else {
    // replying directly to root
    tags.push(...createCommentTagsFromCommentPointer(parentPointer, true));
  }

  // add reply tags
  tags.push(...createCommentTagsFromCommentPointer(parentPointer, false));

  return tags;
}
