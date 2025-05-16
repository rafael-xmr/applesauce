export const DVM_REQUEST_KINDS = {
  /**
   * Extract text from various input types (audio, video, etc.)
   * @see https://github.com/nostr-protocol/data-vending-machines/blob/master/kinds/5000.md
   */
  TEXT_EXTRACTION: 5000,
  /**
   * Generate summaries from input text or content
   * @see https://github.com/nostr-protocol/data-vending-machines/blob/master/kinds/5001.md
   */
  SUMMARIZATION: 5001,
  /**
   * Translate text between languages
   * @see https://github.com/nostr-protocol/data-vending-machines/blob/master/kinds/5002.md
   */
  TRANSLATION: 5002,
  /**
   * Job request to generate text using AI models.
   * @see https://github.com/nostr-protocol/data-vending-machines/blob/master/kinds/5050.md
   */
  TEXT_GENERATION: 5050,
  /**
   * Generate images from text prompts
   * @see https://github.com/nostr-protocol/data-vending-machines/blob/master/kinds/5100.md
   */
  IMAGE_GENERATION: 5100,
  /**
   * Job request to convert a Video to another Format.
   * @see https://github.com/nostr-protocol/data-vending-machines/blob/master/kinds/5200.md
   */
  VIDEO_CONVERSION: 5200,
  /**
   * Job request to translate video audio content into target language with or without subtitles.
   * @see https://github.com/nostr-protocol/data-vending-machines/blob/master/kinds/5201.md
   */
  VIDEO_TRANSLATION: 5201,
  /**
   * Job request to convert a static Image to a a short animated video clip
   * @see https://github.com/nostr-protocol/data-vending-machines/blob/master/kinds/5202.md
   */
  IMAGE_TO_VIDEO: 5202,
  /**
   * Job request to convert text input to an audio file.
   * @see https://github.com/nostr-protocol/data-vending-machines/blob/master/kinds/5250.md
   */
  TEXT_TO_SPEECH: 5250,
  /**
   * Job request to discover nostr-native content (DVM feeds)
   * @see https://github.com/nostr-protocol/data-vending-machines/blob/master/kinds/5300.md
   */
  EVENT_RECOMMENDATIONS: 5300,
  /**
   * Profile recommendations
   * @see https://github.com/nostr-protocol/data-vending-machines/blob/master/kinds/5301.md
   */
  PROFILE_RECOMMENDATIONS: 5301,
  /**
   * Job to search for notes based on a prompt
   * @see https://github.com/nostr-protocol/data-vending-machines/blob/master/kinds/5302.md
   */
  EVENT_SEARCH: 5302,
  /**
   * Job to search for profiles based on a prompt
   * @see https://github.com/nostr-protocol/data-vending-machines/blob/master/kinds/5303.md
   */
  PROFILE_SEARCH: 5303,
  /**
   * Job request to count matching events
   * @see https://github.com/nostr-protocol/data-vending-machines/blob/master/kinds/5400.md
   */
  COUNT_EVENTS: 5400,
  /**
   * Job request to perform a Malware Scan on files.
   * @see https://github.com/nostr-protocol/data-vending-machines/blob/master/kinds/5500.md
   */
  MALWARE_SCAN: 5500,
  /**
   * NIP-03 Timestamping of nostr events
   * @see https://github.com/nostr-protocol/data-vending-machines/blob/master/kinds/5900.md
   */
  TIMESTAMP_EVENT: 5900,
  /**
   * Create a bitcoin transaction with an OP_RETURN
   * @see https://github.com/nostr-protocol/data-vending-machines/blob/master/kinds/5901.md
   */
  BITCOIN_OP_RETURN: 5901,
  /**
   * Schedule Nostr events for future publishing
   * @see https://github.com/nostr-protocol/data-vending-machines/blob/master/kinds/5905.md
   */
  SCHEDULE_EVENT_PUBLISH: 5905,
  /**
   * Delegate PoW of an event to a provider.
   * @see https://github.com/nostr-protocol/data-vending-machines/blob/master/kinds/5970.md
   */
  EVENT_POW_DELEGATION: 5970,
} as const;

// Response kinds are the same as request kinds, but in the 6xxx range
export const DVM_RESPONSE_KINDS = Object.fromEntries(
  Array.from(Object.entries(DVM_REQUEST_KINDS)).map(([name, kind]) => [name, kind + 1000]),
) as Record<keyof typeof DVM_REQUEST_KINDS, number>;

export const DVM_STATUS_KIND = 7000;
