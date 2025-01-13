import { EventPacket, RxNostr } from "rx-nostr";
import { map, OperatorFunction, tap } from "rxjs";
import { logger } from "applesauce-core";
import { AddressPointerWithoutD } from "applesauce-core/helpers";

import { relaysRequest } from "./relay-request.js";
import { createFiltersFromAddressPointers } from "../helpers/address-pointer.js";

/** Makes a request to relays for every set of address pointers */
export function addressPointersRequest<T extends AddressPointerWithoutD>(
  rxNostr: RxNostr,
  id: string,
  relays?: string[],
): OperatorFunction<T[], EventPacket> {
  return (source) => {
    const log = logger.extend(`addressPointersRequest:${id}`);

    return source.pipe(
      // convert pointers to filters
      map(createFiltersFromAddressPointers),
      // make requests
      tap((filters) => {
        log(`Requesting`, filters, "from", relays);
      }),
      // make requests
      relaysRequest(rxNostr, id, relays),
      // log when complete
      tap({
        complete: () => {
          log(`Complete`);
        },
      }),
    );
  };
}
