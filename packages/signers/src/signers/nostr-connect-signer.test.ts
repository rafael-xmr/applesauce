import { describe, expect, it, vi } from "vitest";

import { NostrConnectSigner } from "./nostr-connect-signer.js";
import { SimpleSigner } from "./simple-signer.js";

describe("NostrConnectSigner", () => {
  describe("connection", () => {
    it("should call subscription method with filters", async () => {
      const relays = ["wss://relay.signer.com"];
      const subscription = vi.fn().mockReturnValue({ subscribe: vi.fn() });
      const publish = vi.fn(async () => {});
      const client = new SimpleSigner();
      const remote = new SimpleSigner();

      const signer = new NostrConnectSigner(subscription, publish, {
        relays,
        remote: await remote.getPublicKey(),
        signer: client,
      });

      signer.connect();

      expect(subscription).toHaveBeenCalledWith([{ "#p": [await client.getPublicKey()], kinds: [24133] }], relays);
    });
  });
});
