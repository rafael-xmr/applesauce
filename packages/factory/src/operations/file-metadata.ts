import { FileMetadata } from "applesauce-core/helpers";
import { EventFactoryOperation } from "../event-factory.js";
import { createFileMetadataTags } from "../helpers/file-metadata.js";
import { ensureSingletonTag } from "../helpers/tag.js";

/** Includes all NIP-94 tags for {@link FileMetadata} */
export function includeFileMetadataTags(metadata: FileMetadata): EventFactoryOperation {
  return (draft) => {
    let tags = Array.from(draft.tags);

    const fileTags = createFileMetadataTags(metadata);
    for (const tag of fileTags) {
      switch (tag[0]) {
        case "fallback":
          // support multiple fallback tags
          tags.push(tag);
          break;

        default:
          tags = ensureSingletonTag(tags, tag);
          break;
      }
    }

    return { ...draft, tags };
  };
}
