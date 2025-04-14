import { describe, expect, it } from "vitest";

import { createCommentTagsFromCommentPointer } from "../comment.js";

describe("comment helpers", () => {
  describe("createCommentTagsFromCommentPointer", () => {
    describe.each`
      root     | a      | e      | k      | p
      ${true}  | ${"A"} | ${"E"} | ${"K"} | ${"P"}
      ${false} | ${"a"} | ${"e"} | ${"k"} | ${"p"}
    `("root ($root)", ({ root, a, e, k, p }) => {
      it('should create "e" tag for event pointer', () => {
        expect(createCommentTagsFromCommentPointer({ type: "event", id: "event-id", kind: 1111 }, root)).toEqual(
          expect.arrayContaining([
            [e, "event-id"],
            [k, "1111"],
          ]),
        );
      });

      it('should include relay hint in "e" tag', () => {
        expect(
          createCommentTagsFromCommentPointer({ type: "event", id: "event-id", kind: 1111, relay: "relay" }, root),
        ).toEqual(
          expect.arrayContaining([
            [e, "event-id", "relay"],
            [k, "1111"],
          ]),
        );
      });

      it('should create an "a" tag for address pointer', () => {
        expect(
          createCommentTagsFromCommentPointer(
            { type: "address", kind: 30023, pubkey: "pubkey", identifier: "article" },
            root,
          ),
        ).toEqual(
          expect.arrayContaining([
            [a, "30023:pubkey:article"],
            [k, "30023"],
            [p, "pubkey"],
          ]),
        );
      });

      it('should include relay hint in "a" tag', () => {
        expect(
          createCommentTagsFromCommentPointer(
            { type: "address", kind: 30023, pubkey: "pubkey", identifier: "article", relay: "relay" },
            root,
          ),
        ).toEqual(
          expect.arrayContaining([
            [a, "30023:pubkey:article", "relay"],
            [k, "30023"],
            [p, "pubkey"],
          ]),
        );
      });

      it('should create "e" tag for address pointer with id', () => {
        expect(
          createCommentTagsFromCommentPointer(
            { type: "address", kind: 30023, pubkey: "pubkey", identifier: "article", id: "event-id" },
            root,
          ),
        ).toEqual(
          expect.arrayContaining([
            [a, "30023:pubkey:article"],
            [e, "event-id", "", "pubkey"],
            [k, "30023"],
            [p, "pubkey"],
          ]),
        );
      });

      it('should include relay hint in "e" tag for address pointer with id', () => {
        expect(
          createCommentTagsFromCommentPointer(
            { type: "address", kind: 30023, pubkey: "pubkey", identifier: "article", id: "event-id", relay: "relay" },
            root,
          ),
        ).toEqual(
          expect.arrayContaining([
            [a, "30023:pubkey:article", "relay"],
            [e, "event-id", "relay", "pubkey"],
            [k, "30023"],
            [p, "pubkey"],
          ]),
        );
      });
    });
  });
});
