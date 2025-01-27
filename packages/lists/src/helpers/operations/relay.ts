import { TagOperation } from "applesauce-factory/operations";

export function addRelayTag(url: string | URL): TagOperation {
  url = typeof url === "string" ? url : String(url);
  return (tags) => [...tags, ["relay", url]];
}
export function removeRelayTag(url: string | URL): TagOperation {
  url = typeof url === "string" ? url : String(url);
  return (tags) => tags.filter((t) => !(t[0] === "relay" && t[1] === url));
}
