import { describe, it, expect } from "vitest";
import { fillAndTrimTag } from "../tag.js";

describe("fillAndTrimTag", () => {
  describe("replace values", () => {
    it("should handle array with undefined values", () => {
      const input = [undefined, "test", undefined];
      expect(fillAndTrimTag(input, Infinity)).toEqual(["", "test", ""]);
    });

    it("should replace array with null values", () => {
      const input = [null, "test", null];
      expect(fillAndTrimTag(input, Infinity)).toEqual(["", "test", ""]);
    });

    it("should ignore empty strings", () => {
      const input = ["", "test", ""];
      expect(fillAndTrimTag(input, Infinity)).toEqual(["", "test", ""]);
    });

    it("should handle mixed empty values", () => {
      const input = [null, undefined, "", "test", undefined, null];
      expect(fillAndTrimTag(input, Infinity)).toEqual(["", "", "", "test", "", ""]);
    });
  });

  describe("trim", () => {
    it("should remove trailing undefined values when length > minLength", () => {
      const input = ["test1", "test2", undefined, undefined];
      expect(fillAndTrimTag(input)).toEqual(["test1", "test2"]);
    });

    it("should remove trailing null values when length > minLength", () => {
      const input = ["test1", "test2", null, null];
      expect(fillAndTrimTag(input)).toEqual(["test1", "test2"]);
    });

    it("should remove trailing empty strings when length > minLength", () => {
      const input = ["test1", "test2", "", ""];
      expect(fillAndTrimTag(input, 2)).toEqual(["test1", "test2"]);
    });

    it("should keep array as is when no empty/null/undefined values", () => {
      const input = ["test1", "test2", "test3"];
      expect(fillAndTrimTag(input, 1)).toEqual(["test1", "test2", "test3"]);
    });

    it("should respect custom minLength parameter", () => {
      const input = ["test1", "test2", "test3", undefined];
      expect(fillAndTrimTag(input, 3)).toEqual(["test1", "test2", "test3"]);
      expect(fillAndTrimTag(input, 4)).toEqual(["test1", "test2", "test3", ""]);
    });

    it("should handle empty array", () => {
      const input: (string | undefined | null)[] = [];
      expect(fillAndTrimTag(input)).toEqual([]);
    });

    it("should not remove trailing empty values when array length equals minLength", () => {
      const input = ["test", undefined];
      expect(fillAndTrimTag(input, 2)).toEqual(["test", ""]);
    });
  });
});
