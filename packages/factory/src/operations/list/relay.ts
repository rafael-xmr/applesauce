import { TagOperation } from "./list.js";

/** Adds a relay tag from a list */
export function addRelayTag(url: string | URL, tagName = "relay"): TagOperation {
  url = typeof url === "string" ? url : String(url);
  return (tags) => [...tags, [tagName, url]];
}
/** Removes a relay tag to a list */
export function removeRelayTag(url: string | URL, tagName = "relay"): TagOperation {
  url = typeof url === "string" ? url : String(url);
  return (tags) => tags.filter((t) => !(t[0] === tagName && t[1] === url));
}
