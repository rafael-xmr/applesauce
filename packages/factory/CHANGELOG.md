# applesauce-factory

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
- Updated dependencies [39ec450]
- Updated dependencies [34e8f80]
- Updated dependencies [125d24f]
- Updated dependencies [b4d3ac9]
- Updated dependencies [04902fd]
- Updated dependencies [39f5f06]
- Updated dependencies [c732ea0]
- Updated dependencies [9d59a56]
- Updated dependencies [5923047]
- Updated dependencies [5923047]
- Updated dependencies [04902fd]
- Updated dependencies [a05aa94]
- Updated dependencies [9092aa8]
- Updated dependencies [4dbb248]
- Updated dependencies [6aeb923]
- Updated dependencies [96d318d]
- Updated dependencies [46fac64]
- Updated dependencies [1c35f41]
- Updated dependencies [d22769e]
- Updated dependencies [34e8f80]
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
