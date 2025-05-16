import { kinds } from "nostr-tools";
import { map } from "rxjs/operators";

import { getInboxes, getOutboxes } from "../helpers/mailboxes.js";
import { Query } from "../query-store/index.js";

/** A query that gets and parses the inbox and outbox relays for a pubkey */
export function MailboxesQuery(pubkey: string): Query<{ inboxes: string[]; outboxes: string[] } | undefined> {
  return (events) =>
    events.replaceable(kinds.RelayList, pubkey).pipe(
      map(
        (event) =>
          event && {
            inboxes: getInboxes(event),
            outboxes: getOutboxes(event),
          },
      ),
    );
}
