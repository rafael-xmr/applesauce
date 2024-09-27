import { kinds } from "nostr-tools";

import { getInboxes, getOutboxes } from "../../helpers/mailboxes.js";
import { Query } from "../index.js";

export function MailboxesQuery(pubkey: string): Query<{ inboxes: Set<string>; outboxes: Set<string> } | undefined> {
  return {
    key: pubkey,
    run: (events) =>
      events.replaceable(kinds.RelayList, pubkey).map(
        (event) =>
          event && {
            inboxes: getInboxes(event),
            outboxes: getOutboxes(event),
          },
      ),
  };
}
