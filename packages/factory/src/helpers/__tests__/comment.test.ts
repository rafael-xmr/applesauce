import { describe, expect, it } from "vitest";

import { createCommentTagsFromCommentPointer } from "../comment.js";

describe("comment helpers", () => {
  describe("createCommentTagsFromCommentPointer", () => {
    describe.each`
      root     | a      | e      | k
      ${true}  | ${"A"} | ${"E"} | ${"K"}
      ${false} | ${"a"} | ${"e"} | ${"k"}
    `("root ($root)", ({ root, a, e, k }) => {
      it('should create "e" tag for event pointer', () => {
        expect(createCommentTagsFromCommentPointer({ id: "event-id", kind: 1111 }, root)).toEqual([
          [e, "event-id"],
          [k, "1111"],
        ]);
      });

      it('should include hints in "e" tag', () => {
        expect(createCommentTagsFromCommentPointer({ id: "event-id", kind: 1111, relay: "relay" }, root)).toEqual([
          [e, "event-id", "relay"],
          [k, "1111"],
        ]);
      });

      it('should create an "a" tag for address pointers', () => {
        expect(
          createCommentTagsFromCommentPointer({ kind: 30023, pubkey: "pubkey", identifier: "article" }, root),
        ).toEqual([
          [a, "30023:pubkey:article"],
          [k, "30023"],
        ]);
      });

      it('should include hints in "a" tag', () => {
        expect(
          createCommentTagsFromCommentPointer(
            { kind: 30023, pubkey: "pubkey", identifier: "article", relay: "relay" },
            root,
          ),
        ).toEqual([
          [a, "30023:pubkey:article", "relay"],
          [k, "30023"],
        ]);
      });

      it('should create "e" tags for address pointers with ids', () => {
        expect(
          createCommentTagsFromCommentPointer(
            { kind: 30023, pubkey: "pubkey", identifier: "article", id: "event-id" },
            root,
          ),
        ).toEqual([
          [a, "30023:pubkey:article"],
          [e, "event-id", "", "pubkey"],
          [k, "30023"],
        ]);
      });

      it('should include hints in "e" tags for address pointers with ids', () => {
        expect(
          createCommentTagsFromCommentPointer(
            { kind: 30023, pubkey: "pubkey", identifier: "article", id: "event-id", relay: "relay" },
            root,
          ),
        ).toEqual([
          [a, "30023:pubkey:article", "relay"],
          [e, "event-id", "relay", "pubkey"],
          [k, "30023"],
        ]);
      });
    });
  });
});
