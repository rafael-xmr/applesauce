import { describe, expect, it } from "vitest";
import { EventFactory } from "../event-factory.js";
import { NoteReplyBlueprint } from "./reply.js";
import { NostrEvent } from "nostr-tools";

describe("NoteReplyBlueprint", () => {
  const factory = new EventFactory();

  it("should handle simple note", async () => {
    const parent: NostrEvent = {
      id: "event-id",
      kind: 1,
      content: "GM",
      tags: [],
      created_at: 0,
      pubkey: "pubkey",
      sig: "sig",
    };
    expect(await factory.create(NoteReplyBlueprint, parent, "GM back")).toEqual(
      expect.objectContaining({
        content: "GM back",
        tags: [
          ["e", "event-id", "", "root", "pubkey"],
          ["e", "event-id", "", "reply", "pubkey"],
        ],
      }),
    );
  });
});
