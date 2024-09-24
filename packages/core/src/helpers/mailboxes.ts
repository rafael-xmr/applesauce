import { NostrEvent } from "nostr-tools";
import { safeRelayUrl } from "./relays.js";
import { MailboxesInboxes, MailboxesOutboxes } from "./symbols.js";

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
