import { NostrEvent } from "nostr-tools";
import { safeRelayUrl } from "./relays.js";
import { getOrComputeCachedValue } from "./cache.js";

export const MailboxesInboxesSymbol = Symbol.for("mailboxes-inboxes");
export const MailboxesOutboxesSymbol = Symbol.for("mailboxes-outboxes");

/**
 * Parses a 10002 event and stores the inboxes in the event using the {@link MailboxesInboxesSymbol} symbol
 */
export function getInboxes(event: NostrEvent) {
  return getOrComputeCachedValue(event, MailboxesInboxesSymbol, () => {
    const inboxes: string[] = [];

    for (const tag of event.tags) {
      if (tag[0] === "r" && tag[1] && (tag[2] === "read" || tag[2] === undefined)) {
        const url = safeRelayUrl(tag[1]);
        if (url && !inboxes.includes(url)) inboxes.push(url);
      }
    }

    return inboxes;
  });
}

/**
 * Parses a 10002 event and stores the outboxes in the event using the {@link MailboxesOutboxesSymbol} symbol
 */
export function getOutboxes(event: NostrEvent) {
  return getOrComputeCachedValue(event, MailboxesOutboxesSymbol, () => {
    const outboxes: string[] = [];

    for (const tag of event.tags) {
      if (tag[0] === "r" && tag[1] && (tag[2] === "write" || tag[2] === undefined)) {
        const url = safeRelayUrl(tag[1]);
        if (url && !outboxes.includes(url)) outboxes.push(url);
      }
    }

    return outboxes;
  });
}
