export function fillAndTrimTag(tag: (string | undefined | null)[], minLength = 2): string[] {
  for (let i = tag.length - 1; i >= 0; i--) {
    if (i >= minLength && (tag[i] === undefined || tag[i] === null || tag[i] === "")) {
      delete tag[i];
      continue;
    }

    if (tag[i] === undefined || tag[i] === null) tag[i] = "";
  }
  return tag as string[];
}
