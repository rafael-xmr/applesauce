import { ProfileContent as TProfileContent } from "./profile.js";

// event
export const EventUID = Symbol.for("event-uid");
export const EventIndexableTags = Symbol.for("indexable-tags");

// mailboxes
export const MailboxesInboxes = Symbol.for("mailboxes-inboxes");
export const MailboxesOutboxes = Symbol.for("mailboxes-outboxes");

// profile
export const ProfileContent = Symbol.for("profile-content");

// event relays
export const FromRelays = Symbol.for("from-relays");

// Extend interface
declare module "nostr-tools" {
  export interface Event {
    [EventUID]?: string;
    [MailboxesInboxes]?: Set<string>;
    [MailboxesOutboxes]?: Set<string>;
    [ProfileContent]?: TProfileContent | Error;
    [EventIndexableTags]?: Set<string>;
    [FromRelays]?: Set<string>;
  }
}
