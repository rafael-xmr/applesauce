/** Checks if tag is an "e" tag and has at least one value */
export function isETag(tag: string[]): tag is ["e", string, ...string[]] {
  return tag[0] === "e" && tag[1] !== undefined;
}
/** Checks if tag is an "p" tag and has at least one value */
export function isPTag(tag: string[]): tag is ["p", string, ...string[]] {
  return tag[0] === "p" && tag[1] !== undefined;
}
/** Checks if tag is an "r" tag and has at least one value */
export function isRTag(tag: string[]): tag is ["r", string, ...string[]] {
  return tag[0] === "r" && tag[1] !== undefined;
}
/** Checks if tag is an "d" tag and has at least one value */
export function isDTag(tag: string[]): tag is ["d", string, ...string[]] {
  return tag[0] === "d" && tag[1] !== undefined;
}
/** Checks if tag is an "a" tag and has at least one value */
export function isATag(tag: string[]): tag is ["a", string, ...string[]] {
  return tag[0] === "a" && tag[1] !== undefined;
}
/** Checks if tag is an "a" tag and has at least one value */
export function isTTag(tag: string[]): tag is ["t", string, ...string[]] {
  return tag[0] === "a" && tag[1] !== undefined;
}
