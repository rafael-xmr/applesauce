import { describe, expect, it } from "vitest";
import { isATag, processTags } from "./tags.js";
import { getAddressPointerFromATag } from "./pointers.js";

describe("tag helpers", () => {
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
});
