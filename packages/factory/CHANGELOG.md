# applesauce-factory

## 1.1.0

### Minor Changes

- b7ff4f6: Add `removeSingletonTag` tag operation

### Patch Changes

- b7ff4f6: Fix `setListTitle`, `setListImage`, and `setListDescription` not removing tags

## 1.0.0

### Patch Changes

- Updated dependencies
  - applesauce-core@1.0.0
  - applesauce-content@1.0.0

## 0.12.2

### Patch Changes

- e4c6632: Fix `EventFactory.modify` copying symbols to new draft event

## 0.12.1

### Patch Changes

- 925bf01: Fix `addOutboxRelay` and `addInboxRelay` operations adding both inbox and outbox relays

## 0.12.0

### Minor Changes

- 685b2ae: Add `FollowSetBlueprint`
- dcda34e: Preserve unencrypted hidden content when building and signing an event
- 75d7254: Add `EventFactory.sign` method for signing events

### Patch Changes

- bf53581: Add a few more tests
- 4aba6cc: Allow undefined in `modifyPublicTags` and `modifyHiddenTags`
- Updated dependencies
  - applesauce-core@0.12.0
  - applesauce-content@0.12.0

## 0.11.0

### Minor Changes

- c732ea0: Add `createImetaTagForAttachment` helper
- c732ea0: Add `createFileMetadataTags` helper
- b267074: Rename `getRelayHint` to `getEventRelayHint` in `EventFactory`
- 041bacc: Add `includeHashtags` operation
- a05aa94: Add `includeGroupHTag` and `includeGroupPreviousTags` operations
- a05aa94: Add `GroupMessageBlueprint` blueprint
- 04902fd: Add `EventFactory.modify` and `EventFactory.modifyTags` methods
- d22769e: Add `addBlossomServerTag` and `removeBlossomServerTag` tag operations
- 0d11de0: Add mailbox tag operations
- c732ea0: Add `includeFileMetadataTags` operation
- c732ea0: Add `PicturePostBlueprint` blueprint
- a05aa94: Add `createGroupTagFromGroupPointer` helper
- b267074: Add replace option to common tag operations
- c732ea0: Add `FileMetadataBlueprint` blueprint

### Patch Changes

- 1d0bba9: Fix replaceable loader mixing parameterized replaceable and replaceable pointers
- 1d0bba9: Fix `includeContentHashtags` only including last hashtag
- 1c35f41: Add `require` support in node v22
- Updated dependencies
  - applesauce-core@0.11.0
  - applesauce-content@0.11.0

## 0.10.0

### Minor Changes

- 494e934: Add `includeClientTag` operation
- 5882997: Add `setContentWarning` operation
- 5882997: Add `includeLiveStreamTag` operation
- 66bdb7b: Add `includeEmojiTags` operation
- 5882997: Add `setZapSplit` operation
- 494e934: Add `includeSingletonTag` operation
- af489be: Add `ShareBlueprint`
- 682e602: Add `repairContentNostrLinks` operation
- 5882997: Add `LiveChatMessageBlueprint` blueprint
- 494e934: Add `includeContentHashtags` operation
- 682e602: Add `tagPubkeyMentionedInContent` operation

### Patch Changes

- Updated dependencies
  - applesauce-core@0.10.0
  - applesauce-content@0.10.0
