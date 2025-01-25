import { describe, it, expect, beforeEach, vi } from "vitest";
import { BaseAccount } from "./account.js";
import { SimpleSigner } from "applesauce-signer";
import { finalizeEvent } from "nostr-tools";

describe("BaseAccount", () => {
  let signer: SimpleSigner;
  beforeEach(() => {
    signer = new SimpleSigner();
  });

  describe("request queue", () => {
    it("should queue signing requests by default", async () => {
      const account = new BaseAccount(await signer.getPublicKey(), signer);

      let resolve: (() => void)[] = [];
      vi.spyOn(signer, "signEvent").mockImplementation(() => {
        return new Promise((res) => {
          resolve.push(() => res(finalizeEvent({ kind: 1, content: "mock", created_at: 0, tags: [] }, signer.key)));
        });
      });

      // make two signing requests
      account.signEvent({ kind: 1, content: "first", created_at: 0, tags: [] });
      account.signEvent({ kind: 1, content: "second", created_at: 0, tags: [] });

      expect(signer.signEvent).toHaveBeenCalledOnce();
      expect(signer.signEvent).toHaveBeenCalledWith(expect.objectContaining({ content: "first" }));

      // resolve first
      resolve.shift()?.();

      // wait next tick
      await new Promise((res) => setTimeout(res, 0));

      expect(signer.signEvent).toHaveBeenCalledTimes(2);
      expect(signer.signEvent).toHaveBeenCalledWith(expect.objectContaining({ content: "second" }));

      // resolve second
      resolve.shift()?.();
    });

    it("should not use queueing if its disabled", async () => {
      const account = new BaseAccount(await signer.getPublicKey(), signer);
      account.queueRequests = false;

      let resolve: (() => void)[] = [];
      vi.spyOn(signer, "signEvent").mockImplementation(() => {
        return new Promise((res) => {
          resolve.push(() => res(finalizeEvent({ kind: 1, content: "mock", created_at: 0, tags: [] }, signer.key)));
        });
      });

      // make two signing requests
      account.signEvent({ kind: 1, content: "first", created_at: 0, tags: [] });
      account.signEvent({ kind: 1, content: "second", created_at: 0, tags: [] });

      expect(signer.signEvent).toHaveBeenCalledTimes(2);
      expect(signer.signEvent).toHaveBeenCalledWith(expect.objectContaining({ content: "first" }));
      expect(signer.signEvent).toHaveBeenCalledWith(expect.objectContaining({ content: "second" }));

      // resolve first
      resolve.shift()?.();

      // wait next tick
      await new Promise((res) => setTimeout(res, 0));

      // resolve second
      resolve.shift()?.();
    });
  });
});
