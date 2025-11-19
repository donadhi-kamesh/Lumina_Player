export interface VideoSource {
  type: 'file' | 'url';
  src: string;
  name: string;
}

export interface PlaybackState {
  playing: boolean;
  muted: boolean;
  volume: number;
  playbackRate: number;
  played: number; // 0 to 1
  duration: number; // seconds
  currentTime: number; // seconds
  isFullscreen: boolean;
  showControls: boolean;
  isBuffering: boolean;
}

export interface VideoMetadata {
  title: string;
  description: string;
  poster?: string;
  rating?: number;
  year?: string;
}

export interface SearchResult {
  id: number;
  name: string;
  summary: string;
  image?: {
    medium: string;
    original: string;
  };
  premiered?: string;
  rating?: {
    average: number;
  };
}

export enum Sender {
  USER = 'user',
  AI = 'ai',
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: Sender;
}