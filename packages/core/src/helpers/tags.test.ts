import { describe, expect, it } from "vitest";
import { isATag, isNameValueTag, processTags } from "./tags.js";
import { getAddressPointerFromATag } from "./pointers.js";

describe("isNameValueTag", () => {
  it("should return true if tag has at least two indexes", () => {
    expect(isNameValueTag(["a", "30000:pubkey:list"])).toBe(true);
    expect(isNameValueTag(["title", "article", "other-value"])).toBe(true);
  });

  it("should ignore tags without values", () => {
    expect(isNameValueTag(["a"])).toBe(false);
    expect(isNameValueTag(["title"])).toBe(false);
  });
});

describe("processTags", () => {
  it("should filter out errors", () => {
    expect(
      processTags([["a", "bad coordinate"], ["e"], ["a", "30000:pubkey:list"]], getAddressPointerFromATag),
    ).toEqual([{ identifier: "list", kind: 30000, pubkey: "pubkey" }]);
  });

  it("should filter out undefined", () => {
    expect(
      processTags([["a", "bad coordinate"], ["e"], ["a", "30000:pubkey:list"]], (tag) =>
        isATag(tag) ? tag : undefined,
      ),
    ).toEqual([
      ["a", "bad coordinate"],
      ["a", "30000:pubkey:list"],
    ]);
  });
});
