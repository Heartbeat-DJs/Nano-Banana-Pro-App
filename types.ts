
export interface GeneratedImage {
  id: string;
  url: string;
  timestamp: number;
  aspectRatio: string;
  model: string;
  size?: string;
}

export interface GenerationSession {
  id: string;
  prompt: string;
  timestamp: number;
  images: GeneratedImage[];
  settings: {
    model: string;
    aspectRatio: string;
    size?: string;
  };
}

export enum AspectRatio {
  SQUARE = "1:1",
  PORTRAIT = "3:4",
  LANDSCAPE = "4:3",
  STORY = "9:16",
  CINEMA = "16:9"
}

export type ImageModel = 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview';
export type ImageSize = '1K' | '2K' | '4K';

export interface GenerationSettings {
  aspectRatio: AspectRatio;
  model: ImageModel;
  imageSize: ImageSize;
  batchSize: number;
}
