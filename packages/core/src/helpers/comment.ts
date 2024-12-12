import { NostrEvent } from "nostr-tools";

import { ExternalPointer, ExternalIdentifiers, getExternalPointerFromTag } from "./external-id.js";
import { getOrComputeCachedValue } from "./cache.js";
import { getAddressPointerFromATag } from "./pointers.js";
import { safeRelayUrl } from "./relays.js";

export const COMMENT_KIND = 1111;

type CommentEventPointer = {
  id: string;
  kind: number;
  pubkey?: string;
  relay?: string;
};
type CommentAddressPointer = {
  // address pointer can have optional event id if there is an "E" or "e" tag
  id?: string;
  kind: number;
  pubkey: string;
  identifier: string;
  relay?: string;
};

type CommentExternalPointer = ExternalPointer<keyof ExternalIdentifiers>;

export type CommentPointer = CommentEventPointer | CommentAddressPointer | CommentExternalPointer;

export const CommentRootPointerSymbol = Symbol.for("comment-root-pointer");
export const CommentReplyPointerSymbol = Symbol.for("comment-reply-pointer");

/**
 * Gets the EventPointer from an array of tags
 * @throws
 */
export function getCommentEventPointer(tags: string[][], root = false): CommentEventPointer | null {
  const tag = tags.find((t) => t[0] === (root ? "E" : "e"));
  const kind = tags.find((t) => t[0] === (root ? "K" : "k"))?.[1];

  if (tag) {
    if (!kind) throw new Error("Missing kind tag");

    const pointer: CommentPointer = {
      id: tag[1],
      kind: parseInt(kind),
      pubkey: tag[3] || undefined,
      relay: tag[2] && (safeRelayUrl(tag[2]) ?? undefined),
    };

    return pointer;
  }
  return null;
}

/**
 * Gets the AddressPointer from an array of tags
 * @throws
 */
export function getCommentAddressPointer(tags: string[][], root = false): CommentAddressPointer | null {
  const tag = tags.find((t) => t[0] === (root ? "A" : "a"));
  const id = tags.find((t) => t[0] === (root ? "E" : "e"))?.[1];
  const kind = tags.find((t) => t[0] === (root ? "K" : "k"))?.[1];

  if (tag) {
    if (!kind) throw new Error("Missing kind tag");

    const pointer: CommentAddressPointer = {
      id,
      ...getAddressPointerFromATag(tag),
      kind: parseInt(kind),
    };

    return pointer;
  }
  return null;
}

/**
 * Gets the ExternalPointer from an array of tags
 * @throws
 */
export function getCommentExternalPointer(tags: string[][], root = false): CommentExternalPointer | null {
  const tag = tags.find((t) => t[0] === (root ? "I" : "i"));
  const kind = tags.find((t) => t[0] === (root ? "K" : "k"))?.[1];

  if (tag) {
    if (!kind) throw new Error("Missing kind tag");

    const pointer = getExternalPointerFromTag(tag);
    return pointer;
  }
  return null;
}

/**
 * Returns the root pointer for a comment
 * @throws
 */
export function getCommentRootPointer(comment: NostrEvent): CommentPointer | null {
  if (comment.kind !== COMMENT_KIND) throw new Error("Event is not a comment");

  return getOrComputeCachedValue(comment, CommentRootPointerSymbol, () => {
    // check for address pointer first since it can also have E tags
    const A = getCommentAddressPointer(comment.tags, true);
    if (A) return A;

    const E = getCommentEventPointer(comment.tags, true);
    if (E) return E;

    const I = getCommentExternalPointer(comment.tags, true);
    if (I) return I;

    return null;
  });
}

/**
 * Returns the reply pointer for a comment
 * @throws
 */
export function getCommentReplyPointer(comment: NostrEvent): CommentPointer | null {
  if (comment.kind !== COMMENT_KIND) throw new Error("Event is not a comment");

  return getOrComputeCachedValue(comment, CommentReplyPointerSymbol, () => {
    // check for address pointer first since it can also have E tags
    const A = getCommentAddressPointer(comment.tags, false);
    if (A) return A;

    const E = getCommentEventPointer(comment.tags, false);
    if (E) return E;

    const I = getCommentExternalPointer(comment.tags, false);
    if (I) return I;

    return null;
  });
}

export function isCommentEventPointer(pointer: any): pointer is CommentEventPointer {
  return (
    Reflect.has(pointer, "id") &&
    Reflect.has(pointer, "kind") &&
    !Reflect.has(pointer, "identifier") &&
    typeof pointer.kind === "number"
  );
}

export function isCommentAddressPointer(pointer: any): pointer is CommentAddressPointer {
  return (
    Reflect.has(pointer, "identifier") &&
    Reflect.has(pointer, "pubkey") &&
    Reflect.has(pointer, "kind") &&
    typeof pointer.kind === "number"
  );
}
