import { createRxOneshotReq, EventPacket, LazyFilter, RxNostr } from "rx-nostr";
import { map, mergeAll, OperatorFunction } from "rxjs";

/** Makes a request to relays for every set of filters */
export function relaysRequest(
  rxNostr: RxNostr,
  relays: string[],
  id?: string,
): OperatorFunction<LazyFilter | LazyFilter[], EventPacket> {
  return (source) =>
    source.pipe(
      map((filters) => {
        const req = createRxOneshotReq({ filters, rxReqId: id });
        return rxNostr.use(req, { on: { relays } });
      }),
      mergeAll(),
    );
}
