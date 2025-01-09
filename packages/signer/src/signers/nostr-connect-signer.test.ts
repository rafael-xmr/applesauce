import { describe, expect, it, vi } from "vitest";

import { NostrConnectSigner } from "./nostr-connect-signer.js";
import { SimpleSigner } from "./simple-signer.js";

describe("NostrConnectSigner", () => {
  describe("connection", () => {
    it("should call onSubOpen with filters", async () => {
      const relays = ["wss://relay.signer.com"];
      const onSubOpen = vi.fn(async () => {});
      const onSubClose = vi.fn(async () => {});
      const onPublishEvent = vi.fn(async () => {});
      const client = new SimpleSigner();
      const remote = new SimpleSigner();

      const signer = new NostrConnectSigner({
        onSubOpen,
        onSubClose,
        onPublishEvent,
        relays,
        remote: await remote.getPublicKey(),
        signer: client,
      });

      signer.connect();

      expect(onSubOpen).toHaveBeenCalledWith(
        [{ "#p": [await client.getPublicKey()], kinds: [24133] }],
        relays,
        expect.any(Function),
      );
    });
  });
});
