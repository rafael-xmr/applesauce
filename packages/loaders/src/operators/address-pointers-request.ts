import { EventPacket, RxNostr } from "rx-nostr";
import { map, OperatorFunction } from "rxjs";
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
    return source.pipe(
      // convert pointers to filters
      map(createFiltersFromAddressPointers),
      // make requests
      relaysRequest(rxNostr, id, relays),
    );
  };
}
