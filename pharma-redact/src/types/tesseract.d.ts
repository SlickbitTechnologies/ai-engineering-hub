import { Page } from 'tesseract.js';

declare module 'tesseract.js' {
    interface Page {
        words: Array<{
            text: string;
            bbox: {
                x0: number;
                y0: number;
                x1: number;
                y1: number;
            };
        }>;
    }
}

declare module 'tesseract.js' {
    interface Page {
        words: Array<{
            text: string;
            bbox: {
                x0: number;
                y0: number;
                x1: number;
                y1: number;
            };
        }>;
    }
} 