import { kinds, NostrEvent } from "nostr-tools";
import { isReplaceable } from "applesauce-core/helpers";
import { addEventBookmarkTag, removeEventBookmarkTag } from "applesauce-factory/operations/tag";
import { IEventStore } from "applesauce-core";

import { Action } from "../action-hub.js";
import {
  modifyHiddenTags,
  modifyPublicTags,
  setListDescription,
  setListImage,
  setListTitle,
} from "applesauce-factory/operations/event";

function getBookmarkEvent(events: IEventStore, self: string, identifier?: string) {
  return events.getReplaceable(identifier ? kinds.Bookmarksets : kinds.BookmarkList, self, identifier);
}

/**
 * An action that adds a note or article to the bookmark list or a bookmark set
 * @param event the event to bookmark
 * @param identifier the "d" tag of the bookmark set
 * @param hidden set to true to add to hidden bookmarks
 */
export function BookmarkEvent(event: NostrEvent, identifier?: string, hidden = false): Action {
  return async ({ events, factory, self, publish }) => {
    const bookmarks = getBookmarkEvent(events, self, identifier);
    if (!bookmarks) throw new Error("Cant find bookmarks");

    const operation = addEventBookmarkTag(event);

    const draft = await factory.modifyTags(bookmarks, hidden ? { hidden: operation } : operation);
    await publish(`Bookmark ${isReplaceable(event.kind) ? "note" : "article"}`, await factory.sign(draft));
  };
}

/**
 * An action that removes a note or article from the bookmark list or bookmark set
 * @param event the event to remove from bookmarks
 * @param identifier the "d" tag of the bookmark set
 * @param hidden set to true to remove from hidden bookmarks
 */
export function UnbookmarkEvent(event: NostrEvent, identifier: string, hidden = false): Action {
  return async ({ events, factory, self, publish }) => {
    const bookmarks = getBookmarkEvent(events, self, identifier);
    if (!bookmarks) throw new Error("Cant find bookmarks");

    const operation = removeEventBookmarkTag(event);

    const draft = await factory.modifyTags(bookmarks, hidden ? { hidden: operation } : operation);
    await publish("Remove bookmark", await factory.sign(draft));
  };
}

/** An action that creates a new bookmark list for a user */
export function CreateBookmarkList(bookmarks?: NostrEvent[]): Action {
  return async ({ events, factory, self, publish }) => {
    const existing = getBookmarkEvent(events, self);
    if (existing) throw new Error("Bookmark list already exists");

    const draft = await factory.process(
      { kind: kinds.BookmarkList },
      bookmarks ? modifyPublicTags(...bookmarks.map(addEventBookmarkTag)) : undefined,
    );
    await publish("Create bookmark list", await factory.sign(draft));
  };
}

/** An action that creates a new bookmark set for a user */
export function CreateBookmarkSet(
  title: string,
  description: string,
  additional: { image?: string; hidden?: NostrEvent[]; public?: NostrEvent[] },
): Action {
  return async ({ events, factory, self, publish }) => {
    const existing = getBookmarkEvent(events, self);
    if (existing) throw new Error("Bookmark list already exists");

    const draft = await factory.process(
      { kind: kinds.BookmarkList },
      setListTitle(title),
      setListDescription(description),
      additional.image ? setListImage(additional.image) : undefined,
      additional.public ? modifyPublicTags(...additional.public.map(addEventBookmarkTag)) : undefined,
      additional.hidden ? modifyHiddenTags(...additional.hidden.map(addEventBookmarkTag)) : undefined,
    );
    await publish("Create bookmark set", await factory.sign(draft));
  };
}
