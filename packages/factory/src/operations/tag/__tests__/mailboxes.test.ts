import { describe, expect, it } from "vitest";
import { addInboxRelay, addOutboxRelay, removeInboxRelay, removeOutboxRelay } from "../mailboxes.js";

describe("addOutboxRelay", () => {
  it('should add a new "r" tag', () => {
    expect(addOutboxRelay("wss://outbox.com")([], {})).toEqual([["r", "wss://outbox.com/", "write"]]);
  });

  it('should update "read" tag', () => {
    expect(addOutboxRelay("wss://outbox.com")([["r", "wss://outbox.com/", "read"]], {})).toEqual([
      ["r", "wss://outbox.com/"],
    ]);
  });
});

describe("removeOutboxRelay", () => {
  it('should remove "r" tag if "write"', () => {
    expect(removeOutboxRelay("wss://outbox.com")([["r", "wss://outbox.com/", "write"]], {})).toEqual([]);
  });

  it('should update tag to "read"', () => {
    expect(removeOutboxRelay("wss://outbox.com")([["r", "wss://outbox.com"]], {})).toEqual([
      ["r", "wss://outbox.com/", "read"],
    ]);
  });
});

describe("addInboxRelay", () => {
  it('should add a new "r" tag', () => {
    expect(addInboxRelay("wss://inbox.com")([], {})).toEqual([["r", "wss://inbox.com/", "read"]]);
  });

  it('should update "write" tag', () => {
    expect(addInboxRelay("wss://inbox.com")([["r", "wss://inbox.com/", "write"]], {})).toEqual([
      ["r", "wss://inbox.com/"],
    ]);
  });
});

describe("removeInboxRelay", () => {
  it('should remove "r" tag if "read"', () => {
    expect(removeInboxRelay("wss://inbox.com")([["r", "wss://inbox.com/", "read"]], {})).toEqual([]);
  });

  it('should update tag to "write"', () => {
    expect(removeInboxRelay("wss://inbox.com")([["r", "wss://inbox.com"]], {})).toEqual([
      ["r", "wss://inbox.com/", "write"],
    ]);
  });
});
