import { kinds } from "nostr-tools";
import { MailboxesQuery, ProfileQuery, UserContactsQuery } from "applesauce-core/queries";
import { getObservableValue, simpleTimeout } from "applesauce-core/observable";
import { EventStore, QueryStore } from "applesauce-core";
import { ProfilePointer } from "nostr-tools/nip19";
import { filter, Observable } from "rxjs";

import { ReplaceableLoader } from "./replaceable-loader.js";

/** A special Promised based loader built on the {@link QueryStore} */
export class RequestLoader {
  requestTimeout = 10_000;
  replaceableLoader?: ReplaceableLoader;

  constructor(public store: QueryStore) {}

  // hacky method to run queries with timeouts
  protected async runWithTimeout<T extends unknown, Args extends Array<any>>(
    queryConstructor: (...args: Args) => {
      key: string;
      run: (events: EventStore, store: QueryStore) => Observable<T>;
    },
    ...args: Args
  ): Promise<NonNullable<T>> {
    return getObservableValue(
      this.store.createQuery(queryConstructor, ...args).pipe(
        filter((v) => v !== undefined && v !== null),
        simpleTimeout(this.requestTimeout),
      ),
    );
  }

  protected checkReplaceable() {
    if (!this.replaceableLoader) throw new Error("Missing ReplaceableLoader");
    return this.replaceableLoader;
  }

  /** Loads a pubkeys profile */
  profile(pointer: ProfilePointer, force?: boolean) {
    this.checkReplaceable().next({ kind: kinds.Metadata, pubkey: pointer.pubkey, relays: pointer.relays, force });
    return this.runWithTimeout(ProfileQuery, pointer.pubkey);
  }

  /** Loads a pubkeys profile */
  mailboxes(pointer: ProfilePointer, force?: boolean) {
    this.checkReplaceable().next({ kind: kinds.RelayList, pubkey: pointer.pubkey, relays: pointer.relays, force });
    return this.runWithTimeout(MailboxesQuery, pointer.pubkey);
  }

  /** Loads a pubkeys profile */
  contacts(pointer: ProfilePointer, force?: boolean) {
    this.checkReplaceable().next({ kind: kinds.Contacts, pubkey: pointer.pubkey, relays: pointer.relays, force });
    return this.runWithTimeout(UserContactsQuery, pointer.pubkey);
  }
}
