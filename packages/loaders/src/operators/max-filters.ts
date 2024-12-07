import { LazyFilter } from "rx-nostr";
import { mergeMap, OperatorFunction } from "rxjs";

import { reduceToBatches } from "../helpers/array.js";

/** Splits a batch of filters into multiple requests if necessary */
export function splitMaxFiltersPerRequest(maxFiltersPerRequest: number): OperatorFunction<LazyFilter[], LazyFilter[]> {
  return (source) =>
    source.pipe(
      // batch the filters into sets no larger than maxFiltersPerRequest
      mergeMap((filters) => reduceToBatches(filters, maxFiltersPerRequest)),
    );
}
