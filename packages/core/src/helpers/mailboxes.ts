import { NostrEvent } from "nostr-tools";
import { safeRelayUrl } from "./relays.js";

export const MailboxesInboxesSymbol = Symbol.for("mailboxes-inboxes");
export const MailboxesOutboxesSymbol = Symbol.for("mailboxes-outboxes");
declare module "nostr-tools" {
  export interface Event {
    [MailboxesInboxesSymbol]?: Set<string>;
    [MailboxesOutboxesSymbol]?: Set<string>;
  }
}

/**
 * Parses a 10002 event and stores the inboxes in the event using the {@link MailboxesInboxesSymbol} symbol
 */
export function getInboxes(event: NostrEvent) {
  if (!event[MailboxesInboxesSymbol]) {
    const inboxes = new Set<string>();

    for (const tag of event.tags) {
      if (tag[0] === "r" && tag[1] && (tag[2] === "read" || tag[2] === undefined)) {
        const url = safeRelayUrl(tag[1]);
        if (url) inboxes.add(url);
      }
    }

    event[MailboxesInboxesSymbol] = inboxes;
  }

  return event[MailboxesInboxesSymbol]!;
}

/**
 * Parses a 10002 event and stores the outboxes in the event using the {@link MailboxesOutboxesSymbol} symbol
 */
export function getOutboxes(event: NostrEvent) {
  if (!event[MailboxesOutboxesSymbol]) {
    const outboxes = new Set<string>();

    for (const tag of event.tags) {
      if (tag[0] === "r" && tag[1] && (tag[2] === "write" || tag[2] === undefined)) {
        const url = safeRelayUrl(tag[1]);
        if (url) outboxes.add(url);
      }
    }

    event[MailboxesOutboxesSymbol] = outboxes;
  }

  return event[MailboxesOutboxesSymbol]!;
}
