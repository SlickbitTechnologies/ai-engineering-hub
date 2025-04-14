export interface RedactionEntity {
    id: string;
    text: string;
    type: string;
    confidence: number;
    page: number;
    coordinates: Coordinates;
    context?: string;

    // For AI-provided entities
    start?: number;
    end?: number;

    // For regex-based entities (new fields)
    offset?: number;
    length?: number;
}

export interface Coordinates {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface RedactionTemplate {
    id: string;
    name: string;
    description: string;
    rules: {
        redactTypes: string[];
        excludeContexts: string[];
    };
    // New fields for pattern-based detection
    categories: RedactionCategory[];
}

export interface RedactionCategory {
    type: string;
    patterns?: string[];
    contexts?: string[];
}

export interface WordPosition {
    word: string;
    coordinates: Coordinates;
}

export interface OCRResult {
    text: string;
    words: WordPosition[];
    width: number;
    height: number;
}

export interface RedactionReport {
    totalEntities: number;
    entitiesByType: Record<string, number>;
    entitiesByPage: Record<number, number>;
    entityList: RedactionEntity[];
} 