import { unixNow } from "applesauce-core/helpers";
import { EventTemplate, NostrEvent, VerifiedEvent } from "nostr-tools";

export type EventFactoryTemplate = { kind: number; content?: string; pubkey: string };

export type EventFactorySigner = {
  getPublicKey: () => Promise<string> | string;
  signEvent: (template: EventTemplate) => Promise<VerifiedEvent> | VerifiedEvent;
  nip04?: {
    encrypt: (pubkey: string, plaintext: string) => Promise<string> | string;
    decrypt: (pubkey: string, ciphertext: string) => Promise<string> | string;
  };
  nip44?: {
    encrypt: (pubkey: string, plaintext: string) => Promise<string> | string;
    decrypt: (pubkey: string, ciphertext: string) => Promise<string> | string;
  };
};

export type EventFactoryContext = {
  getRelayHint?: (event: NostrEvent) => string | undefined | Promise<string> | Promise<undefined>;
  signer?: EventFactorySigner;
};

export type EventFactoryOperation = (
  draft: EventTemplate,
  context: EventFactoryContext,
) => EventTemplate | Promise<EventTemplate>;

export class EventFactory {
  context: EventFactoryContext = {};

  async create(template: EventFactoryTemplate, ...operations: EventFactoryOperation[]): Promise<EventTemplate> {
    let draft: EventTemplate = { ...template, content: "", created_at: unixNow(), tags: [] };

    // run operations
    for (const operation of operations) draft = await operation(draft, this.context);

    return draft;
  }
}
