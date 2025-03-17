import { EventStore, QueryStore } from "applesauce-core";
import { beforeEach, describe, expect, it } from "vitest";
import { EventFactory } from "applesauce-factory";
import { generateSecretKey } from "nostr-tools";
import { subscribeSpyTo } from "@hirez_io/observer-spy";

import { FakeUser } from "../../__tests__/fake-user.js";
import { WalletBlueprint } from "../../blueprints/wallet.js";
import { WalletQuery } from "../wallet.js";
import { lockWallet, unlockWallet } from "../../helpers/wallet.js";

const user = new FakeUser();
const factory = new EventFactory({ signer: user });

let events: EventStore;
let queries: QueryStore;
beforeEach(() => {
  events = new EventStore();
  queries = new QueryStore(events);
});

describe("WalletQuery", () => {
  it("it should update when event is unlocked", async () => {
    const wallet = await user.signEvent(await factory.create(WalletBlueprint, [], generateSecretKey()));
    lockWallet(wallet);
    events.add(wallet);

    const spy = subscribeSpyTo(queries.createQuery(WalletQuery, await user.getPublicKey()));

    await unlockWallet(wallet, user);

    expect(spy.getValues()).toEqual([
      expect.objectContaining({ locked: true }),
      expect.objectContaining({ locked: false }),
    ]);
  });
});
