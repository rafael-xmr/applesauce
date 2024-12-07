import { EventPacket, RxNostr } from "rx-nostr";
import { map, OperatorFunction, tap } from "rxjs";
import { nanoid } from "nanoid";
import { logger } from "applesauce-core";
import { AddressPointerWithoutD } from "applesauce-core/helpers";

import { relaysRequest } from "./relay-request.js";
import { createFiltersFromAddressPointers } from "../helpers/address-pointer.js";

/** Makes a request to relays for every set of address pointers */
export function replaceableRequest<T extends AddressPointerWithoutD>(
  rxNostr: RxNostr,
  relays: string[],
  id?: string,
): OperatorFunction<T[], EventPacket> {
  return (source) => {
    id = id || nanoid(8);
    const log = logger.extend(`replaceableRequest:${id}`);

    return source.pipe(
      // convert pointers to filters
      map(createFiltersFromAddressPointers),
      // make requests
      tap((filters) => {
        log(`Requesting`, relays, filters);
      }),
      // make requests
      relaysRequest(rxNostr, relays, id),
      // log when complete
      tap({
        complete: () => {
          log(`Complete`);
        },
      }),
    );
  };
}
