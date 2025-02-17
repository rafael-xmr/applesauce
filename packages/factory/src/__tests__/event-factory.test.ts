import { describe, it, expect } from "vitest";
import { EventFactory } from "../event-factory.js";
import { kinds } from "nostr-tools";
import { setListTitle } from "../operations/index.js";

const factory = new EventFactory();

describe("EventFactory", () => {
  describe("runProcess", () => {
    it('should add "d" tags to parameterized replaceable events', async () => {
      expect(await EventFactory.runProcess({ kind: kinds.Bookmarksets }, {}, setListTitle("testing"))).toEqual({
        content: "",
        tags: [
          ["d", expect.any(String)],
          ["title", "testing"],
        ],
        created_at: expect.any(Number),
        kind: kinds.Bookmarksets,
      });
    });
  });

  describe("modify", () => {
    it("should add created_at", async () => {
      expect(await factory.modify({ kind: kinds.BookmarkList })).toEqual({
        kind: kinds.BookmarkList,
        created_at: expect.any(Number),
        content: "",
        tags: [],
      });
    });

    it("should override created_at", async () => {
      expect(await factory.modify({ kind: kinds.BookmarkList, created_at: 0 })).not.toEqual({
        kind: kinds.BookmarkList,
        created_at: 0,
      });
    });
  });
});
