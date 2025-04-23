import { QueryConstructor, QueryStore } from "applesauce-core";
import { getObservableValue, simpleTimeout } from "applesauce-core/observable";
import {
  ContactsQuery,
  MailboxesQuery,
  ProfileQuery,
  ReplaceableQuery,
  UserBlossomServersQuery,
} from "applesauce-core/queries";
import { kinds } from "nostr-tools";
import { ProfilePointer } from "nostr-tools/nip19";
import { filter } from "rxjs";

import { BLOSSOM_SERVER_LIST_KIND } from "applesauce-core/helpers";
import { LoadableAddressPointer } from "../helpers/address-pointer.js";
import { ReplaceableLoader } from "./replaceable-loader.js";

/** A special Promised based loader built on the {@link QueryStore} */
export class RequestLoader {
  requestTimeout = 10_000;
  replaceableLoader?: ReplaceableLoader;

  constructor(public store: QueryStore) {}

  // hacky method to run queries with timeouts
  protected async runWithTimeout<T extends unknown, Args extends Array<any>>(
    queryConstructor: QueryConstructor<T, Args>,
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
