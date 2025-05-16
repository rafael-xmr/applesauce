import { kinds } from "nostr-tools";

import { EventFactory, EventBlueprint } from "../event-factory.js";
import {
	createTextContentOperations,
	TextContentOptions,
} from "../operations/event/content.js";

export type NoteBlueprintOptions = TextContentOptions;

/** Short text note (kind 1) blueprint */
export function NoteBlueprint(
	content: string,
	options?: NoteBlueprintOptions,
): EventBlueprint {
	return (ctx) =>
		EventFactory.runProcess(
			{ kind: kinds.ShortTextNote },
			ctx,
			...createTextContentOperations(content, options),
			undefined,
		);
}
