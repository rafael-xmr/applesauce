import { describe, expect, it } from "vitest";
import { addRelayTag } from "./relay.js";

describe("addRelayTag", () => {
  it("should replace existing relay tag", () => {
    expect(addRelayTag("wss://relay.com/")([["relay", "wss://relay.com/", "old-data"]], {})).toEqual([
      ["relay", "wss://relay.com/"],
    ]);
  });

  it("should replace existing relay tag with different URL format", () => {
    expect(addRelayTag("wss://relay.com/")([["relay", "wss://relay.com", "old-data"]], {})).toEqual([
      ["relay", "wss://relay.com/"],
    ]);
  });

  it("should not ignore pathnames", () => {
    expect(addRelayTag("wss://relay.com/")([["relay", "wss://relay.com/inbox", "old-data"]], {})).toEqual([
      ["relay", "wss://relay.com/inbox", "old-data"],
      ["relay", "wss://relay.com/"],
    ]);
  });
});
