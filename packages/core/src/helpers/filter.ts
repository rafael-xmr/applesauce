import { Filter, NostrEvent } from "nostr-tools";
import { getIndexableTags } from "./event.js";

// Copied from https://github.com/nbd-wtf/nostr-tools/blob/a61cde77eacc9518001f11d7f67f1a50ae05fd80/filter.ts
// And modified to use getIndexableTags
export function matchFilter(filter: Filter, event: NostrEvent): boolean {
  if (filter.ids && filter.ids.indexOf(event.id) === -1) {
    return false;
  }
  if (filter.kinds && filter.kinds.indexOf(event.kind) === -1) {
    return false;
  }
  if (filter.authors && filter.authors.indexOf(event.pubkey) === -1) {
    return false;
  }

  for (let f in filter) {
    if (f[0] === "#") {
      let tagName = f.slice(1);
      let values = filter[`#${tagName}`];
      if (values) {
        const tags = getIndexableTags(event);
        if (values.some((v) => !tags.has(tagName + ":" + v))) return false;
      }
    }
  }

  if (filter.since && event.created_at < filter.since) return false;
  if (filter.until && event.created_at > filter.until) return false;

  return true;
}

export function matchFilters(filters: Filter[], event: NostrEvent): boolean {
  for (let i = 0; i < filters.length; i++) {
    if (matchFilter(filters[i], event)) {
      return true;
    }
  }
  return false;
}
