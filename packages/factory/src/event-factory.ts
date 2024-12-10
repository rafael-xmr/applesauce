import { unixNow } from "applesauce-core/helpers";
import { COMMENT_KIND } from "applesauce-core/helpers/comment";
import { AddressPointer } from "nostr-tools/nip19";
import { EventTemplate, kinds, NostrEvent, VerifiedEvent } from "nostr-tools";

import { includeCommentTags } from "./operations/comment.js";
import { createTextContentOperations, TextContentOptions } from "./operations/content.js";
import { includeClientTag } from "./operations/client.js";

export type EventFactoryTemplate = { kind: number; content?: string; pubkey?: string };

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

export type EventFactoryClient = {
  name: string;
  address?: AddressPointer;
};

export type EventFactoryContext = {
  client?: EventFactoryClient;
  getRelayHint?: (event: NostrEvent) => string | undefined | Promise<string> | Promise<undefined>;
  getPubkeyRelayHint?: (pubkey: string) => string|undefined | Promise<string> | Promise<undefined>,
  signer?: EventFactorySigner;
};

export type EventFactoryOperation = (
  draft: EventTemplate,
  context: EventFactoryContext,
) => EventTemplate | Promise<EventTemplate>;

export class EventFactory {
  constructor(protected context: EventFactoryContext) {}

  async create(
    template: EventFactoryTemplate,
    ...operations: (EventFactoryOperation | undefined)[]
  ): Promise<EventTemplate> {
    let draft: EventTemplate = { ...template, content: "", created_at: unixNow(), tags: [] };

    // run operations
    for (const operation of operations) {
      if (operation) draft = await operation(draft, this.context);
    }

    // add client tag
    if (this.context.client) {
      draft = await includeClientTag(this.context.client.name, this.context.client.address)(draft, this.context);
    }

    return draft;
  }

  /** Create a NIP-22 comment */
  comment(parent: NostrEvent, content: string, options?: TextContentOptions) {
    return this.create(
      { kind: COMMENT_KIND },
      includeCommentTags(parent),
      ...createTextContentOperations(content, options),
    );
  }

  /** Creates a short text note */
  note(content: string, options?: TextContentOptions) {
    return this.create({ kind: kinds.ShortTextNote }, ...createTextContentOperations(content, options));
  }
}
