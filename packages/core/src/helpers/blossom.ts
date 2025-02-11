import { isNameValueTag, processTags } from "./tags.js";

export const BLOSSOM_SERVER_LIST_KIND = 10063;

/** Check if two servers are the same */
export function areBlossomServersEqual(a: string | URL, b: string | URL): boolean {
  const hostnameA = new URL("/", a).toString();
  const hostnameB = new URL("/", b).toString();
  return hostnameA === hostnameB;
}

/** Checks if a string is a sha256 hash */
export function isSha256(str: string): boolean {
  return !!str.match(/^[0-9a-f]{64}$/);
}

/** Returns an ordered array of servers found in a server list event (10063) */
export function getBlossomServersFromList(event: { tags: string[][] } | string[][]): URL[] {
  const tags = Array.isArray(event) ? event : event.tags;

  return processTags(tags, (tag) => {
    if (isNameValueTag(tag, "server") && URL.canParse(tag[1])) return new URL("/", tag[1]);
    else return undefined;
  });
}
