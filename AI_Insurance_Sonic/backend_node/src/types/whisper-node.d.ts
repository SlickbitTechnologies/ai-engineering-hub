declare module 'whisper-node' {
  interface WhisperOptions {
    modelName?: string;
    modelPath?: string;
    whisperOptions?: {
      language?: string;
      gen_file_txt?: boolean;
      gen_file_subtitle?: boolean;
      gen_file_vtt?: boolean;
      word_timestamps?: boolean;
    };
  }
  export default function whisper(filePath: string, options?: WhisperOptions): Promise<string>;
} 