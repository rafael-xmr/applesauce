import { bufferTime, filter, from, map, mergeMap, OperatorFunction, share } from "rxjs";
import { getReplaceableUID } from "applesauce-core/helpers";
import { EventPacket, RxNostr } from "rx-nostr";
import { nanoid } from "nanoid";

import { Loader } from "./loader.js";
import { LoadableAddressPointer } from "./replaceable-loader.js";
import { isLoadableAddressPointer } from "../helpers/address-pointer.js";
import { replaceableRequest } from "../operators/address-pointers-request.js";

export type SingleRelayReplaceableOptions = Partial<{
  /**
   * Wait X ms before making a request
   * @default 1000
   */
  bufferTime: number;
}>;

const defaultRelayReplaceableLoaderOptions = {
  bufferTime: 1000,
} as const;

/** Ensures an address pointer is only loaded once from a relay */
function singleRelayBatcher(
  opts?: SingleRelayReplaceableOptions,
): OperatorFunction<LoadableAddressPointer, LoadableAddressPointer[]> {
  return (source) => {
    const loaded = new Set<string>();
    const options = opts ? { ...defaultRelayReplaceableLoaderOptions, ...opts } : defaultRelayReplaceableLoaderOptions;

    return source.pipe(
      // buffer the requests, so we only send requests every second
      bufferTime(options.bufferTime),
      // ignore empty batches
      filter((batch) => batch.length > 0),
      // filter out duplicates
      map((batch) => {
        const filtered: LoadableAddressPointer[] = [];
        for (const pointer of batch) {
          const uid = getReplaceableUID(pointer.kind, pointer.pubkey, pointer.identifier);
          if (!loaded.has(uid)) {
            filtered.push(pointer);
            loaded.add(uid);
          } else if (pointer.force) filtered.push(pointer);
        }
        return filtered;
      }),
      // ignore empty batches
      filter((batch) => batch.length > 0),
    );
  };
}

/** A wrapper class around {@link singleRelayBatcher'}, {@link replaceableRequest}, and share */
export class SingleRelayReplaceableLoader extends Loader<LoadableAddressPointer, EventPacket> {
  constructor(rxNostr: RxNostr, relay: string, opts?: SingleRelayReplaceableOptions) {
    super((source) =>
      source.pipe(
        // ignore invalid address pointers
        filter(isLoadableAddressPointer),
        // batch and filter
        singleRelayBatcher(opts),
        // breakout the batches so they can complete
        mergeMap((pointers) => from([pointers]).pipe(replaceableRequest(rxNostr, nanoid(8), [relay]))),
        // share the response with all subscribers
        share(),
      ),
    );
  }
}
