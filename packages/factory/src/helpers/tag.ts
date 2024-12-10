export function fillAndTrimTag(tag: (string | undefined | null)[], minLength = 2): string[] {
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
