import { kinds } from "nostr-tools";
import { FileMetadata } from "applesauce-core/helpers";

import { createTextContentOperations, TextContentOptions } from "../operations/content.js";
import { EventFactory, EventFactoryBlueprint } from "../event-factory.js";
import { includeFileMetadataTags } from "../operations/file-metadata.js";
import { includeHashtags } from "../operations/hashtags.js";

export type FileMetadataBlueprintOptions = TextContentOptions & { hashtags?: string[] };

/** Blueprint to create a NIP-94 file metadata event */
export function FileMetadataBlueprint(
  metadata: FileMetadata,
  description?: string,
  options?: FileMetadataBlueprintOptions,
): EventFactoryBlueprint {
  return (ctx) =>
    EventFactory.runProcess(
      { kind: kinds.FileMetadata },
      ctx,
      includeFileMetadataTags(metadata),
      ...(description ? createTextContentOperations(description, options) : []),
      options?.hashtags ? includeHashtags(options.hashtags) : undefined,
    );
}
