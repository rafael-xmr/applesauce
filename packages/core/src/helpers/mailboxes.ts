import { NostrEvent } from "nostr-tools";
import { safeRelayUrl } from "./relays.js";

export const MailboxesInboxes = Symbol.for("mailboxes-inboxes");
export const MailboxesOutboxes = Symbol.for("mailboxes-outboxes");

// extend type
declare module "nostr-tools" {
  export interface Event {
    [MailboxesInboxes]?: Set<string>;
    [MailboxesOutboxes]?: Set<string>;
  }
}

export function getInboxes(event: NostrEvent) {
  if (!event[MailboxesInboxes]) {
    const inboxes = new Set<string>();

    for (const tag of event.tags) {
      if (tag[0] === "r" && tag[1] && (tag[2] === "read" || tag[2] === undefined)) {
        const url = safeRelayUrl(tag[1]);
        if (url) inboxes.add(url);
      }
    }

    event[MailboxesInboxes] = inboxes;
  }

  return event[MailboxesInboxes]!;
}

export function getOutboxes(event: NostrEvent) {
  if (!event[MailboxesOutboxes]) {
    const outboxes = new Set<string>();

    for (const tag of event.tags) {
      if (tag[0] === "r" && tag[1] && (tag[2] === "write" || tag[2] === undefined)) {
        const url = safeRelayUrl(tag[1]);
        if (url) outboxes.add(url);
      }
    }

    event[MailboxesOutboxes] = outboxes;
  }

  return event[MailboxesOutboxes]!;
}
