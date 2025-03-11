import { Emoji, unixNow } from "applesauce-core/helpers";
import { AddressPointer } from "nostr-tools/nip19";
import { isParameterizedReplaceableKind } from "nostr-tools/kinds";
import { EventTemplate, NostrEvent, UnsignedEvent } from "nostr-tools";

import { includeClientTag } from "./operations/event/client.js";
import { CommentBlueprint } from "./blueprints/comment.js";
import { NoteBlueprint } from "./blueprints/note.js";
import { ReactionBlueprint } from "./blueprints/reaction.js";
import { DeleteBlueprint } from "./blueprints/delete.js";
import { NoteReplyBlueprint } from "./blueprints/reply.js";
import { ShareBlueprint } from "./blueprints/share.js";
import { includeReplaceableIdentifier, modifyHiddenTags, modifyPublicTags } from "./operations/event/index.js";

export type EventFactoryTemplate = {
  kind: number;
  content?: string;
  pubkey?: string;
  tags?: string[][];
  created_at?: number;
};

/** A single operation in the factory process */
export type EventOperation = (
  draft: EventTemplate,
  context: EventFactoryContext,
) => EventTemplate | Promise<EventTemplate>;

/** A single operation that modifies an events public or hidden tags array */
export type TagOperation = (tags: string[][], ctx: EventFactoryContext) => string[][] | Promise<string[][]>;

/** A prebuilt event template */
export type EventBlueprint = (context: EventFactoryContext) => EventTemplate | Promise<EventTemplate>;

export type EventFactorySigner = {
  getPublicKey: () => Promise<string> | string;
  signEvent: (template: EventTemplate) => Promise<NostrEvent> | NostrEvent;
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
  address?: Omit<AddressPointer, "kind" | "relays">;
};

export type EventFactoryContext = {
  /** NIP-89 client tag */
  client?: EventFactoryClient;
  getEventRelayHint?: (event: string) => string | undefined | Promise<string> | Promise<undefined>;
  getPubkeyRelayHint?: (pubkey: string) => string | undefined | Promise<string> | Promise<undefined>;
  /** A signer used to encrypt the content of some notes */
  signer?: EventFactorySigner;
  /** An array of custom emojis that will be used in text note content */
  emojis?: Emoji[];
};

export class EventFactory {
  constructor(public context: EventFactoryContext = {}) {}

  static async runProcess(
    template: EventFactoryTemplate,
    context: EventFactoryContext,
    ...operations: (EventOperation | undefined)[]
  ): Promise<EventTemplate> {
    let draft: EventTemplate = { content: "", created_at: unixNow(), tags: [], ...template };

    // make sure parameterized replaceable events have "d" tags
    if (isParameterizedReplaceableKind(draft.kind)) draft = await includeReplaceableIdentifier()(draft, context);

    // run operations
    for (const operation of operations) {
      if (operation) draft = await operation(draft, context);
    }

    // add client tag
    if (context.client) {
      draft = await includeClientTag(context.client.name, context.client.address)(draft, context);
    }

    return draft;
  }

  /** Process an event template with operations */
  async process(template: EventFactoryTemplate, ...operations: (EventOperation | undefined)[]): Promise<EventTemplate> {
    return await EventFactory.runProcess(template, this.context, ...operations);
  }

  /** Create an event from a blueprint */
  async create<Args extends Array<any>>(
    blueprint: (...args: Args) => EventBlueprint,
    ...args: Args
  ): Promise<EventTemplate> {
    return await blueprint(...args)(this.context);
  }

  /** Modify an existing event with operations and updated the created_at */
  async modify(
    draft: EventFactoryTemplate | NostrEvent,
    ...operations: (EventOperation | undefined)[]
  ): Promise<EventTemplate> {
    draft = { ...draft, created_at: unixNow() };

    // Remove old fields from signed nostr event
    Reflect.deleteProperty(draft, "id");
    Reflect.deleteProperty(draft, "sig");
    Reflect.deleteProperty(draft, "pubkey");

    return await EventFactory.runProcess(draft, this.context, ...operations);
  }

  /** Modify a lists public and hidden tags and updated the created_at */
  async modifyTags(
    event: EventFactoryTemplate,
    tagOperations?:
      | TagOperation
      | TagOperation[]
      | { public?: TagOperation | TagOperation[]; hidden?: TagOperation | TagOperation[] },
    eventOperations?: EventOperation | (EventOperation | undefined)[],
  ): Promise<EventTemplate> {
    let publicTagOperations: TagOperation[] = [];
    let hiddenTagOperations: TagOperation[] = [];
    let eventOperationsArr: EventOperation[] = [];

    // normalize tag operation arg
    if (tagOperations === undefined) publicTagOperations = hiddenTagOperations = [];
    else if (Array.isArray(tagOperations)) publicTagOperations = tagOperations;
    else if (typeof tagOperations === "function") publicTagOperations = [tagOperations];
    else {
      if (typeof tagOperations.public === "function") publicTagOperations = [tagOperations.public];
      else if (tagOperations.public) publicTagOperations = tagOperations.public;

      if (typeof tagOperations.hidden === "function") hiddenTagOperations = [tagOperations.hidden];
      else if (tagOperations.hidden) hiddenTagOperations = tagOperations.hidden;
    }

    // normalize event operation arg
    if (eventOperations === undefined) eventOperationsArr = [];
    else if (typeof eventOperations === "function") eventOperationsArr = [eventOperations];
    else if (Array.isArray(eventOperations)) eventOperationsArr = eventOperations.filter((e) => !!e);

    // modify event
    return await this.modify(
      event,
      publicTagOperations.length > 0 ? modifyPublicTags(...publicTagOperations) : undefined,
      hiddenTagOperations.length > 0 ? modifyHiddenTags(...hiddenTagOperations) : undefined,
      ...eventOperationsArr,
    );
  }

  /** Attaches the signers pubkey to an event template */
  async stamp(draft: EventTemplate): Promise<UnsignedEvent> {
    if (!this.context.signer) throw new Error("Missing signer");

    // Remove old fields from signed nostr event
    Reflect.deleteProperty(draft, "id");
    Reflect.deleteProperty(draft, "sig");

    return { ...draft, pubkey: await this.context.signer.getPublicKey() };
  }

  async sign(draft: EventTemplate | UnsignedEvent): Promise<NostrEvent> {
    if (!this.context.signer) throw new Error("Missing signer");
    draft = await this.stamp(draft);
    return await this.context.signer.signEvent(draft);
  }

  // Helpers

  /** Create a NIP-22 comment */
  comment(...args: Parameters<typeof CommentBlueprint>) {
    return this.create(CommentBlueprint, ...args);
  }

  /** Creates a short text note */
  note(...args: Parameters<typeof NoteBlueprint>) {
    return this.create(NoteBlueprint, ...args);
  }

  /** Creates a short text note reply */
  noteReply(...args: Parameters<typeof NoteReplyBlueprint>) {
    return this.create(NoteReplyBlueprint, ...args);
  }

  /** Creates a reaction event */
  reaction(...args: Parameters<typeof ReactionBlueprint>) {
    return this.create(ReactionBlueprint, ...args);
  }

  /** Creates a delete event */
  delete(...args: Parameters<typeof DeleteBlueprint>) {
    return this.create(DeleteBlueprint, ...args);
  }

  /** Creates a share event */
  share(...args: Parameters<typeof ShareBlueprint>) {
    return this.create(ShareBlueprint, ...args);
  }
}
