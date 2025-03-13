import { describe, expect, it } from "vitest";
import { EventFactory } from "applesauce-factory";

import { FakeUser } from "../../__tests__/fake-user.js";
import { WalletTokenBlueprint } from "../../blueprints/tokens.js";
import { dumbTokenSelection, unlockTokenContent } from "../tokens.js";
import { HiddenContentSymbol } from "applesauce-core/helpers";

const user = new FakeUser();
const factory = new EventFactory({ signer: user });

describe("dumbTokenSelection", () => {
  it("should select old tokens first", async () => {
    const a = await user.signEvent(
      await factory.create(WalletTokenBlueprint, {
        mint: "https://money.com",
        proofs: [{ secret: "A", C: "A", id: "A", amount: 100 }],
      }),
    );
    await unlockTokenContent(a, user);

    const bDraft = await factory.create(WalletTokenBlueprint, {
      mint: "https://money.com",
      proofs: [{ secret: "B", C: "B", id: "B", amount: 50 }],
    });
    bDraft.created_at -= 60 * 60 * 7;
    const b = await user.signEvent(bDraft);
    await unlockTokenContent(b, user);

    expect(dumbTokenSelection([a, b], 40)).toEqual([b]);
  });

  it("should select enough tokens to total min amount", async () => {
    const a = await user.signEvent(
      await factory.create(WalletTokenBlueprint, {
        mint: "https://money.com",
        proofs: [{ secret: "A", C: "A", id: "A", amount: 100 }],
      }),
    );
    await unlockTokenContent(a, user);

    const bDraft = await factory.create(WalletTokenBlueprint, {
      mint: "https://money.com",
      proofs: [{ secret: "B", C: "B", id: "B", amount: 50 }],
    });
    bDraft.created_at -= 60 * 60 * 7;
    const b = await user.signEvent(bDraft);
    await unlockTokenContent(b, user);

    expect(dumbTokenSelection([a, b], 120)).toEqual(expect.arrayContaining([a, b]));
  });

  it("should throw if not enough funds", async () => {
    const a = await user.signEvent(
      await factory.create(WalletTokenBlueprint, {
        mint: "https://money.com",
        proofs: [{ secret: "A", C: "A", id: "A", amount: 100 }],
      }),
    );
    await unlockTokenContent(a, user);

    expect(() => dumbTokenSelection([a], 120)).toThrow();
  });

  it("should ignore locked tokens", async () => {
    const a = await user.signEvent(
      await factory.create(WalletTokenBlueprint, {
        mint: "https://money.com",
        proofs: [{ secret: "A", C: "A", id: "A", amount: 100 }],
      }),
    );
    await unlockTokenContent(a, user);

    const bDraft = await factory.create(WalletTokenBlueprint, {
      mint: "https://money.com",
      proofs: [{ secret: "B", C: "B", id: "B", amount: 50 }],
    });
    bDraft.created_at -= 60 * 60 * 7;
    const b = await user.signEvent(bDraft);

    // manually remove the hidden content to lock it again
    Reflect.deleteProperty(b, HiddenContentSymbol);

    expect(dumbTokenSelection([a, b], 20)).toEqual([a]);
  });
});
