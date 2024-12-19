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

/** A pipeline that filters and maps each tag */
type TagPipe = {
  <A>(tags: string[][], ta: (tag: string[]) => A | undefined): A[];
  <A, B>(tags: string[][], ta: (tag: string[]) => A | undefined, ab: (a: A) => B | undefined): B[];
  <A, B, C>(
    tags: string[][],
    ta: (tag: string[]) => A | undefined,
    ab: (a: A) => B | undefined,
    bc: (b: B) => C | undefined,
  ): C[];
  <A, B, C, D>(
    tags: string[][],
    ta: (tag: string[]) => A | undefined,
    ab: (a: A) => B | undefined,
    bc: (b: B) => C | undefined,
    cd: (c: C) => D | undefined,
  ): D[];
  <A, B, C, D, E>(
    tags: string[][],
    ta: (tag: string[]) => A | undefined,
    ab: (a: A) => B | undefined,
    bc: (b: B) => C | undefined,
    cd: (c: C) => D | undefined,
    de: (d: D) => E | undefined,
  ): E[];
  <A, B, C, D, E, F>(
    tags: string[][],
    ta: (tag: string[]) => A | undefined,
    ab: (a: A) => B | undefined,
    bc: (b: B) => C | undefined,
    cd: (c: C) => D | undefined,
    de: (d: D) => E | undefined,
    ef: (e: E) => F | undefined,
  ): F[];
  <A, B, C, D, E, F, G>(
    tags: string[][],
    ta: (tag: string[]) => A | undefined,
    ab: (a: A) => B | undefined,
    bc: (b: B) => C | undefined,
    cd: (c: C) => D | undefined,
    de: (d: D) => E | undefined,
    ef: (e: E) => F | undefined,
    fg: (f: F) => G | undefined,
  ): G[];
};

/** Filter and transform tags */
export const processTags: TagPipe = (tags: string[][], ...fns: Function[]) => {
  return fns.reduce((step, fn) => {
    const next: unknown[] = [];

    for (const value of step) {
      try {
        const result = fn(value);
        if (result === undefined) continue; // value is undefined, ignore

        next.push(result);
      } catch (error) {
        // failed to process value, ignore
      }
    }

    return next;
  }, tags as unknown[]);
};
