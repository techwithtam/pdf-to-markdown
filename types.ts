export interface ProcessedTab {
  fileName: string;
  markdownContent: string;
  originalTitle?: string;
}

export interface ProcessingResult {
  tabs: ProcessedTab[];
}

export enum AppState {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export enum ProcessingMode {
  QUICK = 'QUICK',
  AI_ENHANCED = 'AI_ENHANCED'
}

export enum ProcessingStep {
  READING = 'READING',
  DETECTING = 'DETECTING',
  PROCESSING_TABS = 'PROCESSING_TABS',
  GENERATING = 'GENERATING'
}

export interface ProcessingProgress {
  step: ProcessingStep;
  currentTab?: number;
  totalTabs?: number;
  tabName?: string;
}

export interface FileData {
  name: string;
  type: string;
  data: string; // base64
}
