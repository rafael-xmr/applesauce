import { describe, expect, it } from "vitest";
import {
  addCoordinateTag,
  addEventTag,
  addNameValueTag,
  addPubkeyTag,
  removeCoordinateTag,
  removeEventTag,
} from "../common.js";

describe("addEventTag", () => {
  describe("pubkey as string", () => {
    it('should add "p" tag', async () => {
      expect(await addPubkeyTag("123")([["d", "list"]], {})).toEqual([
        ["d", "list"],
        ["p", "123"],
      ]);
    });

    it("should add relay hint", async () => {
      const hint = () => `wss://relay.com`;
      expect(await addPubkeyTag("123")([["d", "list"]], { getPubkeyRelayHint: hint })).toEqual([
        ["d", "list"],
        ["p", "123", "wss://relay.com"],
      ]);
    });

    it("should add duplicate tags when replace=false", async () => {
      expect(
        await addPubkeyTag("123", false)(
          [
            ["d", "list"],
            ["p", "123"],
            ["p", "456"],
          ],
          {},
        ),
      ).toEqual([
        ["d", "list"],
        ["p", "123"],
        ["p", "456"],
        ["p", "123"],
      ]);
    });
  });

  describe("ProfilePointer", () => {
    it('should add "p" tag', async () => {
      expect(await addPubkeyTag({ pubkey: "123" })([["d", "list"]], {})).toEqual([
        ["d", "list"],
        ["p", "123"],
      ]);
    });

    it("should add relay hint", async () => {
      const hint = () => `wss://relay.com`;
      expect(await addPubkeyTag({ pubkey: "123" })([["d", "list"]], { getPubkeyRelayHint: hint })).toEqual([
        ["d", "list"],
        ["p", "123", "wss://relay.com"],
      ]);
    });

    it("should not add relay hint if pointer already has one", async () => {
      const hint = () => `wss://relay.com`;
      expect(
        await addPubkeyTag({ pubkey: "123", relays: ["wss://custom-relay.com"] })([["d", "list"]], {
          getPubkeyRelayHint: hint,
        }),
      ).toEqual([
        ["d", "list"],
        ["p", "123", "wss://custom-relay.com"],
      ]);
    });

    it("should add duplicate tags when replace=false", async () => {
      expect(
        await addPubkeyTag({ pubkey: "123", relays: ["wss://relay.com"] }, false)(
          [
            ["d", "list"],
            ["p", "123"],
            ["p", "456"],
          ],
          {},
        ),
      ).toEqual([
        ["d", "list"],
        ["p", "123"],
        ["p", "456"],
        ["p", "123", "wss://relay.com"],
      ]);
    });
  });
});

describe("addEventTag", () => {
  it('should add "e" tag', async () => {
    expect(await addEventTag("123")([["d", "list"]], {})).toEqual([
      ["d", "list"],
      ["e", "123"],
    ]);
  });

  it("should add relay hint", async () => {
    const hint = () => `wss://relay.com`;
    expect(await addEventTag("123")([["d", "list"]], { getEventRelayHint: hint })).toEqual([
      ["d", "list"],
      ["e", "123", "wss://relay.com"],
    ]);
  });

  it("should replace existing", async () => {
    const hint = () => `wss://relay.com`;
    expect(
      await addEventTag("123")(
        [
          ["d", "list"],
          ["e", "123"],
          ["e", "456"],
        ],
        { getEventRelayHint: hint },
      ),
    ).toEqual([
      ["d", "list"],
      ["e", "456"],
      ["e", "123", "wss://relay.com"],
    ]);
  });

  it("should add duplicate tag if replace=false", async () => {
    expect(
      await addEventTag("123", false)(
        [
          ["d", "list"],
          ["e", "123"],
          ["e", "456"],
        ],
        {},
      ),
    ).toEqual([
      ["d", "list"],
      ["e", "123"],
      ["e", "456"],
      ["e", "123"],
    ]);
  });

  it("should add relay hint if EventPoint dose not have one", async () => {
    const hint = () => `wss://relay.com`;
    expect(await addEventTag({ id: "123" })([["d", "list"]], { getEventRelayHint: hint })).toEqual([
      ["d", "list"],
      ["e", "123", "wss://relay.com"],
    ]);
  });

  it("should note add relay hint if EventPoint has one", async () => {
    const hint = () => `wss://relay.com`;
    expect(
      await addEventTag({ id: "123", relays: ["wss://custom.com"] })([["d", "list"]], { getEventRelayHint: hint }),
    ).toEqual([
      ["d", "list"],
      ["e", "123", "wss://custom.com"],
    ]);
  });
});

describe("removeEventTag", () => {
  it('should remove all occurrences of "e" tag for event id', async () => {
    const tags = [
      ["e", "event-id"],
      ["e", "event-id"],
      ["e", "event-2"],
      ["d", "title"],
    ];

    expect(removeEventTag("event-id")(tags, {})).toEqual([
      ["e", "event-2"],
      ["d", "title"],
    ]);
  });
});

describe("addCoordinateTag", () => {
  describe("string", () => {
    it('should add an "a" tag', async () => {
      expect(await addCoordinateTag("30002:pubkey:relays")([["d", "favorites"]], {})).toEqual([
        ["d", "favorites"],
        ["a", "30002:pubkey:relays"],
      ]);
    });

    it("should add relay hints", async () => {
      const hint = () => `wss://my.relay.com`;
      expect(await addCoordinateTag("30002:pubkey:relays")([["d", "favorites"]], { getPubkeyRelayHint: hint })).toEqual(
        [
          ["d", "favorites"],
          ["a", "30002:pubkey:relays", "wss://my.relay.com"],
        ],
      );
    });

    it("should add duplicate it replace=false", async () => {
      expect(
        await addCoordinateTag("30002:pubkey:relays", false)(
          [
            ["d", "favorites"],
            ["a", "30002:pubkey:relays"],
          ],
          {},
        ),
      ).toEqual([
        ["d", "favorites"],
        ["a", "30002:pubkey:relays"],
        ["a", "30002:pubkey:relays"],
      ]);
    });

    it("should replace existing tag", async () => {
      const hint = () => `wss://relay.com`;
      expect(
        await addCoordinateTag("30002:pubkey:relays")(
          [
            ["d", "favorites"],
            ["a", "30002:pubkey:relays"],
          ],
          { getPubkeyRelayHint: hint },
        ),
      ).toEqual([
        ["d", "favorites"],
        ["a", "30002:pubkey:relays", "wss://relay.com"],
      ]);
    });
  });

  describe("AddressPointer", () => {
    it('should add an "a" tag', async () => {
      expect(
        await addCoordinateTag({ kind: 30002, pubkey: "pubkey", identifier: "relays" })([["d", "favorites"]], {}),
      ).toEqual([
        ["d", "favorites"],
        ["a", "30002:pubkey:relays"],
      ]);
    });

    it("should add relay hint", async () => {
      const hint = () => `wss://my.relay.com`;
      expect(
        await addCoordinateTag({ kind: 30002, pubkey: "pubkey", identifier: "relays" })([["d", "favorites"]], {
          getPubkeyRelayHint: hint,
        }),
      ).toEqual([
        ["d", "favorites"],
        ["a", "30002:pubkey:relays", "wss://my.relay.com"],
      ]);
    });

    it("should not add relay hint if pointer already has one", async () => {
      const hint = () => `wss://my.relay.com`;
      expect(
        await addCoordinateTag({
          kind: 30002,
          pubkey: "pubkey",
          identifier: "relays",
          relays: ["wss://custom-relay.com"],
        })([["d", "favorites"]], {
          getPubkeyRelayHint: hint,
        }),
      ).toEqual([
        ["d", "favorites"],
        ["a", "30002:pubkey:relays", "wss://custom-relay.com"],
      ]);
    });

    it("should replace existing", async () => {
      expect(
        await addCoordinateTag({ kind: 30002, pubkey: "pubkey", identifier: "relays", relays: ["wss://relay.com"] })(
          [
            ["d", "favorites"],
            ["a", "30002:pubkey:relays"],
          ],
          {},
        ),
      ).toEqual([
        ["d", "favorites"],
        ["a", "30002:pubkey:relays", "wss://relay.com"],
      ]);
    });

    it("should add duplicate tag if replace=false", async () => {
      expect(
        await addCoordinateTag({ kind: 30002, pubkey: "pubkey", identifier: "relays" }, false)(
          [
            ["d", "favorites"],
            ["a", "30002:pubkey:relays"],
          ],
          {},
        ),
      ).toEqual([
        ["d", "favorites"],
        ["a", "30002:pubkey:relays"],
        ["a", "30002:pubkey:relays"],
      ]);
    });
  });
});

describe("removeCoordinateTag", () => {
  it("should remove all occurrences", () => {
    expect(
      removeCoordinateTag("30002:pubkey:relays")(
        [
          ["d", "list"],
          ["a", "30002:pubkey:relays"],
        ],
        {},
      ),
    ).toEqual([["d", "list"]]);
  });
});

describe("addNameValueTag", () => {
  it("should replace existing tag", () => {
    expect(
      addNameValueTag(["relay", "wss://relay.com"])(
        [
          ["d", "list"],
          ["relay", "wss://relay.com", "old-tag"],
        ],
        {},
      ),
    ).toEqual([
      ["d", "list"],
      ["relay", "wss://relay.com"],
    ]);
  });

  it("should add duplicate if replace=false", () => {
    expect(
      addNameValueTag(["relay", "wss://relay.com", "new-tag"], false)(
        [
          ["d", "list"],
          ["relay", "wss://relay.com", "old-tag"],
        ],
        {},
      ),
    ).toEqual([
      ["d", "list"],
      ["relay", "wss://relay.com", "old-tag"],
      ["relay", "wss://relay.com", "new-tag"],
    ]);
  });
});
