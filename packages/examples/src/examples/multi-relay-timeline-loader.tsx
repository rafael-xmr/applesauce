import { useEffect, useMemo, useRef, useState } from "react";
import { Button, ButtonGroup, Stack } from "@mui/material";
import { TimelineLoader } from "applesauce-loaders";
import { EventStore } from "applesauce-core";
import { unixNow } from "applesauce-core/helpers";
import { verifyEvent } from "nostr-tools";
import { createRxNostr } from "rx-nostr";

const rxNostr = createRxNostr({
  disconnectTimeout: 120 * 1000,
  verifier: async (event) => {
    try {
      return verifyEvent(event);
    } catch (error) {
      return false;
    }
  },
});

const COLORS = ["red", "green", "blue", "orange", "purple", "darkcyan"];

export default function TimelineExample() {
  const now = useMemo(() => unixNow(), []);
  const [limit, setLimit] = useState(50);
  const [frame, setFrame] = useState(60 * 60);
  const [relays, _setRelays] = useState([
    "wss://nostrue.com/",
    "wss://nos.lol/",
    "wss://nostr.bitcoiner.social/",
    "wss://relay.damus.io/",
    "wss://nostrelites.org/",
    "wss://nostr.wine/",
  ]);
  useEffect(() => {
    if (ctx.current) ctx.current.canvas.height = relays.length * 32;
  }, [relays]);

  const [seconds, setSeconds] = useState(0);

  const loader = useMemo(() => {
    console.log(`Creating filter with`, relays, limit);

    return new TimelineLoader(rxNostr, TimelineLoader.simpleFilterMap(relays, [{ kinds: [1] }]), { limit });
  }, [relays, limit]);

  // clear the canvas when loader
  useEffect(() => {
    if (ctx.current) {
      ctx.current.clearRect(0, 0, ctx.current.canvas.width, ctx.current.canvas.height);
      ctx.current.canvas.width = frame;
    }
  }, [loader, frame]);

  useEffect(() => {
    loader.next(now - seconds);
  }, [seconds, loader, now]);

  const canvas = useRef<HTMLCanvasElement | null>(null);
  const ctx = useRef<CanvasRenderingContext2D | null>(null);
  useEffect(() => {
    if (canvas.current) ctx.current = canvas.current.getContext("2d");
  }, []);

  const store = useMemo(() => new EventStore(), []);

  useEffect(() => {
    console.log("Subscribing to loader");
    const sub = loader.subscribe((packet) => {
      const from = new URL(packet.from).toString();
      store.add(packet.event, from);

      if (ctx.current) {
        ctx.current.fillStyle = COLORS[relays.indexOf(from)] || "black";
        ctx.current.fillRect(now - packet.event.created_at, relays.indexOf(from) * 32, 1, 32);
      }
    });

    return () => sub.unsubscribe();
  }, [loader, now, relays]);

  return (
    <>
      <ButtonGroup>
        <Button onClick={() => setFrame(60 * 60)}>1 Hour</Button>
        <Button onClick={() => setFrame(2 * 60 * 60)}>2 Hour</Button>
      </ButtonGroup>
      <ButtonGroup>
        <Button onClick={() => setLimit(50)}>50</Button>
        <Button onClick={() => setLimit(100)}>100</Button>
        <Button onClick={() => setLimit(200)}>200</Button>
      </ButtonGroup>
      <Stack direction="row" sx={{ fontSize: 12, padding: 1 }} spacing={1}>
        {relays.map((relay, i) => (
          <code style={{ color: COLORS[i] }}>{relay}</code>
        ))}
      </Stack>
      <canvas width={frame} height={relays.length * 32} style={{ width: "100%" }} ref={canvas} />
      <input
        type="range"
        style={{ width: "100%" }}
        min={0}
        max={frame}
        value={seconds}
        onInput={(e) => {
          const v = parseInt(e.currentTarget.value);

          if (Number.isFinite(v)) setSeconds(v);
        }}
      />
      <p>scroll: {seconds}s</p>
    </>
  );
}
