/** Replaces null and undefined with "" in tags and trims them down to a set length if they ends with "" */
export function fillAndTrimTag(tag: (string | undefined | null)[], minLength = 2): string[] {
  // clone array
  tag = tag.slice();

  for (let i = tag.length - 1; i >= 0; i--) {
    if (tag[i] === undefined || tag[i] === null || tag[i] === "") {
      if (i + 1 === tag.length && i >= minLength) {
        // this is the last index, remove it
        tag.pop();
      } else {
        // blank tag
        tag[i] = "";
      }
    }
  }

  return tag as string[];
}

/** Ensures a single named tag exists */
export function ensureSingletonTag(tags: string[][], tag: [string, ...string[]], replace = true): string[][] {
  const existing = tags.find((t) => t[0] === tag[0]);

  if (existing) {
    if (replace) return tags.map((t) => (t === existing ? tag : t));
    else return tags;
  } else {
    return [...tags, tag];
  }
}

/** Ensures a single named / value tag exists */
export function ensureNamedValueTag(
  tags: string[][],
  tag: [string, string, ...string[]],
  replace = true,
  matcher?: (a: string, b: string) => boolean,
): string[][] {
  const existing = tags.find((t) => t[0] === tag[0] && t[1] && (matcher ? matcher(t[1], tag[1]) : t[1] === tag[1]));

  if (existing) {
    if (replace) return tags.map((t) => (t === existing ? tag : t));
    else return tags;
  } else {
    return [...tags, tag];
  }
}
