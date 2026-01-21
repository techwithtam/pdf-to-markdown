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

export interface FileData {
  name: string;
  type: string;
  data: string; // base64
}
