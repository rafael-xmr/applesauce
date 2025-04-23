import { map } from "rxjs/operators";

import { Query } from "../query-store/index.js";
import { BLOSSOM_SERVER_LIST_KIND, getBlossomServersFromList } from "../helpers/blossom.js";

export function UserBlossomServersQuery(pubkey: string): Query<URL[] | undefined> {
  return (store) =>
    store.replaceable(BLOSSOM_SERVER_LIST_KIND, pubkey).pipe(map((event) => event && getBlossomServersFromList(event)));
}
