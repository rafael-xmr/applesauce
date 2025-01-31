// import { beforeEach, expect, it } from "vitest";
// import { createMockRelay, faker, MockRelay } from "vitest-nostr";
// import { createRxNostr } from "rx-nostr";
// import { verifier } from "rx-nostr-crypto";

// import { RelayTimelineLoader } from "./relay-timeline-loader.js";

// let relay: MockRelay;

// beforeEach(async () => {
//   relay = createMockRelay("ws://localhost:1234");
// });

// it("should complete when 0 events are returned", async () => {
//   const rxNostr = createRxNostr({ verifier });
//   const loader = new RelayTimelineLoader(rxNostr, "ws://localhost:1234", [{ kinds: [1] }]);

//   let received = 0;
//   loader.subscribe(() => received++);

//   // load first page
//   loader.next(100);
//   expect(loader.loading).toBe(true);

//   await relay.connected;
//   await expect(relay).toReceiveREQ();

//   relay.emitEVENT(loader.id, faker.event({ kind: 1 }));
//   relay.emitEOSE(loader.id);

//   await new Promise((res) => setTimeout(res, 0));

//   expect(received).toBe(1);
//   expect(loader.loading).toBe(false);
// });
