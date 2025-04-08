export interface UploadedFile {
  id: string;
  filename: string;
  size: number;
  content_type: string;
  upload_date: string;
  entries: number;
  selected?: boolean;
  analyzed?: boolean;
} 