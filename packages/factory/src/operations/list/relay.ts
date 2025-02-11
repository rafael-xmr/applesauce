import { isSameURL, normalizeURL } from "applesauce-core/helpers";
import { addNameValueTag } from "./common.js";
import { TagOperation } from "./list.js";

/** Adds a relay tag from a list */
export function addRelayTag(url: string | URL, tagName = "relay", replace = true): TagOperation {
  url = normalizeURL(url).toString();

  return addNameValueTag([tagName, url], replace, (a, b) => isSameURL(a, b));
}

/** Removes all relay tags matching the relay */
export function removeRelayTag(url: string | URL, tagName = "relay"): TagOperation {
  url = normalizeURL(url).toString();

  return (tags) =>
    tags.filter((t) => !(t[0] === tagName && t[1] && URL.canParse(t[1]) && new URL(t[1]).toString() === url));
}
