import { createRxOneshotReq, EventPacket, LazyFilter, RxNostr } from "rx-nostr";
import { mergeMap, OperatorFunction } from "rxjs";

/** Makes a request to relays for every set of filters */
export function relaysRequest(
  rxNostr: RxNostr,
  id: string,
  relays?: string[],
): OperatorFunction<LazyFilter | LazyFilter[], EventPacket> {
  return (source) =>
    source.pipe(
      mergeMap((filters) => {
        const req = createRxOneshotReq({ filters, rxReqId: id });
        return rxNostr.use(req, { on: { relays } });
      }),
    );
}
