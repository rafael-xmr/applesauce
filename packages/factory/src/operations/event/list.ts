import { EventOperation as EventOperation } from "../../event-factory.js";
import { includeSingletonTag } from "./tags.js";

/** Sets the "title" tag on a NIP-51 list */
export function setListTitle(title: string): EventOperation {
  return includeSingletonTag(["title", title], true);
}

/** Sets the "image" tag on a NIP-51 list */
export function setListImage(image: string): EventOperation {
  return includeSingletonTag(["image", image], true);
}

/** Sets the "description" tag on a NIP-51 list */
export function setListDescription(description: string): EventOperation {
  return includeSingletonTag(["description", description], true);
}
