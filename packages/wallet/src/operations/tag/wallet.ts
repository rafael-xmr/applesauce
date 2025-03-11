import { bytesToHex } from "@noble/hashes/utils";
import { TagOperation } from "applesauce-factory";
import { ensureSingletonTag } from "applesauce-factory/helpers";

/** Sets the "mint" tags in a wallet event */
export function setMintTags(mints: string[]): TagOperation {
  return (tags) => [
    // remove all existing mint tags
    ...tags.filter((t) => t[0] !== "mint"),
    // add new mint tags
    ...mints.map((mint) => ["mint", mint]),
  ];
}

/** Sets the "privkey" tag on a wallet event */
export function setPrivateKeyTag(privateKey: Uint8Array): TagOperation {
  return (tags) => ensureSingletonTag(tags, ["privkey", bytesToHex(privateKey)], true);
}
