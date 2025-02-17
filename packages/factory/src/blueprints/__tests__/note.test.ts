import { describe, expect, it } from "vitest";
import { EventFactory } from "../../event-factory.js";
import { NoteBlueprint } from "../note.js";

let factory = new EventFactory();

describe("NoteBlueprint", () => {
  it("should create a short text note", async () => {
    expect(await factory.create(NoteBlueprint, "hello world")).toEqual(
      expect.objectContaining({ content: "hello world", tags: [], kind: 1 }),
    );
  });

  it("should convert @ mentions", async () => {
    expect(
      await factory.create(NoteBlueprint, "hello @npub180cvv07tjdrrgpa0j7j7tmnyl2yr6yr7l8j4s3evf6u64th6gkwsyjh6w6"),
    ).toEqual(
      expect.objectContaining({
        content: "hello nostr:npub180cvv07tjdrrgpa0j7j7tmnyl2yr6yr7l8j4s3evf6u64th6gkwsyjh6w6",
        tags: [["p", "3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d"]],
        kind: 1,
      }),
    );
  });
});
