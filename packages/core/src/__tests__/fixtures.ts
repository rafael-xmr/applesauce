import type { NostrEvent } from "nostr-tools";
import { finalizeEvent, generateSecretKey, getPublicKey, kinds } from "nostr-tools";
import { unixNow } from "../helpers/time.js";

export class FakeUser {
  key = generateSecretKey();
  pubkey = getPublicKey(this.key);

  event(data?: Partial<NostrEvent>): NostrEvent {
    return finalizeEvent(
      {
        kind: data?.kind ?? kinds.ShortTextNote,
        content: data?.content || "",
        created_at: data?.created_at ?? unixNow(),
        tags: data?.tags || [],
      },
      this.key,
    );
  }

  note(content = "Hello World", extra?: Partial<NostrEvent>) {
    return this.event({ kind: kinds.ShortTextNote, content, ...extra });
  }

  profile(profile: any, extra?: Partial<NostrEvent>) {
    return this.event({ kind: kinds.Metadata, content: JSON.stringify({ ...profile }), ...extra });
  }
}
