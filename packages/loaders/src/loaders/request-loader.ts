import { kinds } from "nostr-tools";
import {
  MailboxesQuery,
  ProfileQuery,
  ReplaceableQuery,
  UserBlossomServersQuery,
  ContactsQuery,
} from "applesauce-core/queries";
import { getObservableValue, simpleTimeout } from "applesauce-core/observable";
import { IEventStore, QueryStore } from "applesauce-core";
import { ProfilePointer } from "nostr-tools/nip19";
import { filter, Observable } from "rxjs";

import { ReplaceableLoader } from "./replaceable-loader.js";
import { LoadableAddressPointer } from "../helpers/address-pointer.js";
import { BLOSSOM_SERVER_LIST_KIND } from "applesauce-core/helpers";

/** A special Promised based loader built on the {@link QueryStore} */
export class RequestLoader {
  requestTimeout = 10_000;
  replaceableLoader?: ReplaceableLoader;

  constructor(public store: QueryStore) {}

  // hacky method to run queries with timeouts
  protected async runWithTimeout<T extends unknown, Args extends Array<any>>(
    queryConstructor: (...args: Args) => {
      key: string;
      run: (events: IEventStore, store: QueryStore) => Observable<T>;
    },
    ...args: Args
  ): Promise<NonNullable<T>> {
    return getObservableValue(
      this.store.createQuery(queryConstructor, ...args).pipe(
        // ignore undefined and null values
        filter((v) => v !== undefined && v !== null),
        // timeout with an error is not values
        simpleTimeout(this.requestTimeout),
      ),
    );
  }

  protected checkReplaceable() {
    if (!this.replaceableLoader) throw new Error("Missing ReplaceableLoader");
    return this.replaceableLoader;
  }

  /** Requests a single replaceable event */
  replaceable(pointer: LoadableAddressPointer, force?: boolean) {
    this.checkReplaceable().next({ ...pointer, force });
    return this.runWithTimeout(ReplaceableQuery, pointer.kind, pointer.pubkey, pointer.identifier);
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
    return this.runWithTimeout(ContactsQuery, pointer.pubkey);
  }

  /** Loads a pubkeys blossom servers */
  blossomServers(pointer: ProfilePointer, force?: boolean) {
    this.checkReplaceable().next({
      kind: BLOSSOM_SERVER_LIST_KIND,
      pubkey: pointer.pubkey,
      relays: pointer.relays,
      force,
    });
    return this.runWithTimeout(UserBlossomServersQuery, pointer.pubkey);
  }
}
