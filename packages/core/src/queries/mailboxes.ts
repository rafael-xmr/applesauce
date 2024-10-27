import { kinds } from "nostr-tools";
import { map } from "rxjs/operators";

import { getInboxes, getOutboxes } from "../helpers/mailboxes.js";
import { Query } from "../query-store/index.js";

export function MailboxesQuery(pubkey: string): Query<{ inboxes: string[]; outboxes: string[] } | undefined> {
  return {
    key: pubkey,
    run: (events) =>
      events.replaceable(kinds.RelayList, pubkey).pipe(
        map(
          (event) =>
            event && {
              inboxes: getInboxes(event),
              outboxes: getOutboxes(event),
            },
        ),
      ),
  };
}
