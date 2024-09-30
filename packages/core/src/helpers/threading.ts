import { NostrEvent } from "nostr-tools";
import { AddressPointer, EventPointer } from "nostr-tools/nip19";
import { getAddressPointerFromTag, getEventPointerFromTag } from "./pointers.js";

export type ThreadReferences = {
  root?:
    | { e: EventPointer; a: undefined }
    | { e: undefined; a: AddressPointer }
    | { e: EventPointer; a: AddressPointer };
  reply?:
    | { e: EventPointer; a: undefined }
    | { e: undefined; a: AddressPointer }
    | { e: EventPointer; a: AddressPointer };
};

export const Nip10ThreadRefsSymbol = Symbol.for("nip10-thread-refs");
declare module "nostr-tools" {
  export interface Event {
    [Nip10ThreadRefsSymbol]?: ThreadReferences;
  }
}

/** Parses NIP-10 tags and handles legacy behavior */
export function interpretThreadTags(event: NostrEvent) {
  const eTags = event.tags.filter((t) => t[0] === "e" && t[1]);
  const aTags = event.tags.filter((t) => t[0] === "a" && t[1]);

  // find the root and reply tags.
  let rootETag = eTags.find((t) => t[3] === "root");
  let replyETag = eTags.find((t) => t[3] === "reply");

  let rootATag = aTags.find((t) => t[3] === "root");
  let replyATag = aTags.find((t) => t[3] === "reply");

  if (!rootETag || !replyETag) {
    // a direct reply does not need a "reply" reference
    // https://github.com/nostr-protocol/nips/blob/master/10.md

    // this is not necessarily to spec. but if there is only one id (root or reply) then assign it to both
    // this handles the cases where a client only set a "reply" tag and no root
    rootETag = replyETag = rootETag || replyETag;
  }
  if (!rootATag || !replyATag) {
    rootATag = replyATag = rootATag || replyATag;
  }

  if (!rootETag && !replyETag) {
    // legacy behavior
    // https://github.com/nostr-protocol/nips/blob/master/10.md#positional-e-tags-deprecated
    const legacyETags = eTags.filter((t) => {
      // ignore it if there is a marker
      if (t[3]) return false;
      return true;
    });

    if (legacyETags.length >= 1) {
      // first tag is the root
      rootETag = legacyETags[0];
      // last tag is reply
      replyETag = legacyETags[legacyETags.length - 1] ?? rootETag;
    }
  }

  return {
    root: rootETag || rootATag ? { e: rootETag, a: rootATag } : undefined,
    reply: replyETag || replyATag ? { e: replyETag, a: replyATag } : undefined,
  } as {
    root?: { e: string[]; a: undefined } | { e: undefined; a: string[] } | { e: string[]; a: string[] };
    reply?: { e: string[]; a: undefined } | { e: undefined; a: string[] } | { e: string[]; a: string[] };
  };
}

/** Returns the parsed NIP-10 tags for an event */
export function getNip10References(event: NostrEvent): ThreadReferences {
  let refs = event[Nip10ThreadRefsSymbol];

  if (!refs) {
    const e = event;
    const tags = interpretThreadTags(e);

    refs = event[Nip10ThreadRefsSymbol] = {
      root: tags.root && {
        e: tags.root.e && getEventPointerFromTag(tags.root.e),
        a: tags.root.a && getAddressPointerFromTag(tags.root.a),
      },
      reply: tags.reply && {
        e: tags.reply.e && getEventPointerFromTag(tags.reply.e),
        a: tags.reply.a && getAddressPointerFromTag(tags.reply.a),
      },
    } as ThreadReferences;
  }

  return refs;
}
