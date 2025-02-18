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

  it("should fix nostr mentions", async () => {
    expect(
      await factory.create(
        NoteBlueprint,
        "cool nevent1qvzqqqqqqypzqwlsccluhy6xxsr6l9a9uhhxf75g85g8a709tprjcn4e42h053vaqyd8wumn8ghj7mr0vd4kymmc9enxjct5dfskvtnrdakj7qgmwaehxw309aex2mrp0yh8wetnw3jhymnzw33jucm0d5hsqgqqqr52tv55e4ndqjumlcp7lvvk76lmnac2zcyj37lq4c9n0p0sd5fcvsgq",
      ),
    ).toEqual(
      expect.objectContaining({
        content:
          "cool nostr:nevent1qvzqqqqqqypzqwlsccluhy6xxsr6l9a9uhhxf75g85g8a709tprjcn4e42h053vaqyd8wumn8ghj7mr0vd4kymmc9enxjct5dfskvtnrdakj7qgmwaehxw309aex2mrp0yh8wetnw3jhymnzw33jucm0d5hsqgqqqr52tv55e4ndqjumlcp7lvvk76lmnac2zcyj37lq4c9n0p0sd5fcvsgq",
        tags: [
          [
            "q",
            "0000e8a5b294cd66d04b9bfe03efb196f6bfb9f70a160928fbe0ae0b3785f06d",
            "wss://lockbox.fiatjaf.com/",
            "3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d",
          ],
        ],
        kind: 1,
      }),
    );
  });
});
