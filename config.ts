/**
 * Application configuration — change behavior here without touching service logic.
 */

export const AI_CONFIG = {
  model: 'gemini-2.5-flash',
  maxOutputTokensDetection: 65536,
  maxOutputTokensProcessing: 32768,
  batchSize: 3,
  maxRetries: 2,
  retryBackoffMs: (attempt: number) => 1000 * Math.pow(2, attempt),
} as const;

export const FILE_CONFIG = {
  maxSizeBytes: 20 * 1024 * 1024, // 20MB
  acceptedTypes: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  acceptedExtensions: '.pdf,.docx',
} as const;

export const TAB_DETECTION_CONFIG = {
  separator: {
    maxLength: 50,
    minLength: 2,
    allowTrailingPeriod: false,
    allowMultipleSentences: false,
    allowListMarkers: false,
    allowPureNumbers: false,
  },
  localDetectionMinTabs: 2, // Fallback to AI if local finds fewer than this
} as const;

export const TURNDOWN_CONFIG = {
  headingStyle: 'atx' as const,
  codeBlockStyle: 'fenced' as const,
  bulletListMarker: '-' as const,
  emDelimiter: '*' as const,
  strongDelimiter: '**' as const,
  linkStyle: 'inlined' as const,
  br: '  ' as const,
};

export const MARKDOWN_ESCAPE_PATTERNS: Array<[RegExp, string]> = [
  [/\\#/g, '#'],
  [/\\\*/g, '*'],
  [/\\_/g, '_'],
  [/\\-/g, '-'],
  [/\\\./g, '.'],
  [/\\\(/g, '('],
  [/\\\)/g, ')'],
  [/\\\[/g, '['],
  [/\\\]/g, ']'],
  [/\\>/g, '>'],
  [/\\`/g, '`'],
  [/\\~/g, '~'],
  [/\\\|/g, '|'],
  [/\\!/g, '!'],
  [/\n{3,}/g, '\n\n'],
  [/\\\\/g, '\\'],
];
