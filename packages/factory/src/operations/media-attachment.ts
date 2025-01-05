import { FileMetadata } from "applesauce-core/helpers";

import { EventFactoryOperation } from "../event-factory.js";
import { createImetaTagForAttachment } from "../helpers/file-metadata.js";

/** Adds imeta tags onto the draft for attachments */
export function includeMediaAttachmentTags(attachments: FileMetadata[]): EventFactoryOperation {
  return (draft) => {
    const tags = Array.from(draft.tags);

    for (const attachment of attachments) {
      // TODO: look for duplicates and merge them
      tags.push(createImetaTagForAttachment(attachment));
    }

    return { ...draft, tags };
  };
}
