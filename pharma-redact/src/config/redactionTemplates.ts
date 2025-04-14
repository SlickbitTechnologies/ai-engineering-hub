import { RedactionCategory } from '@/types/redaction';

export interface RedactionTemplate {
    id: string;
    name: string;
    description: string;
    categories: RedactionCategory[];
}

export const redactionTemplates: RedactionTemplate[] = [
    {
        id: 'pharma-default',
        name: 'Pharmaceutical Default',
        description: 'Standard template for pharmaceutical submissions with all PII redacted',
        categories: [
            {
                type: 'PERSON',
                patterns: [
                    '\\b[A-Z][a-z]+(?:\\s+[A-Z][a-z]+){1,2}\\b'
                ],
                contexts: ['document', 'form']
            },
            {
                type: 'EMAIL',
                patterns: [
                    '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b'
                ],
                contexts: ['document', 'form', 'header']
            },
            {
                type: 'PHONE',
                patterns: [
                    '\\b(\\+\\d{1,2}\\s?)?\\(?(\\d{3})\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}\\b'
                ],
                contexts: ['document', 'form', 'header']
            },
            {
                type: 'DATE_OF_BIRTH',
                patterns: [
                    '\\b(0?[1-9]|1[0-2])[/\\-\\.](0?[1-9]|[12][0-9]|3[01])[/\\-\\.](19|20)?\\d{2}\\b'
                ],
                contexts: ['document', 'form']
            },
            {
                type: 'ADDRESS',
                patterns: [
                    '\\b\\d+\\s+[A-Z][a-z]+\\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Place|Pl|Terrace|Ter|Way)\\b'
                ],
                contexts: ['document', 'form', 'header']
            }
        ]
    },
    {
        id: 'minimal-pii',
        name: 'Minimal PII',
        description: 'Only redact basic personally identifiable information',
        categories: [
            {
                type: 'PERSON',
                patterns: [
                    '\\b[A-Z][a-z]+(?:\\s+[A-Z][a-z]+){1,2}\\b'
                ],
                contexts: ['document', 'form']
            },
            {
                type: 'EMAIL',
                patterns: [
                    '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b'
                ],
                contexts: ['document', 'form', 'header']
            },
            {
                type: 'PHONE',
                patterns: [
                    '\\b(\\+\\d{1,2}\\s?)?\\(?(\\d{3})\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}\\b'
                ],
                contexts: ['document', 'form', 'header']
            },
            {
                type: 'SSN',
                patterns: [
                    '\\b\\d{3}-\\d{2}-\\d{4}\\b'
                ],
                contexts: ['document', 'form']
            }
        ]
    },
    {
        id: 'comprehensive',
        name: 'Comprehensive',
        description: 'Redact all possible sensitive information',
        categories: [
            {
                type: 'PERSON',
                patterns: [
                    '\\b[A-Z][a-z]+(?:\\s+[A-Z][a-z]+){1,2}\\b'
                ],
                contexts: ['document', 'form']
            },
            {
                type: 'EMAIL',
                patterns: [
                    '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b'
                ],
                contexts: ['document', 'form', 'header']
            },
            {
                type: 'PHONE',
                patterns: [
                    '\\b(\\+\\d{1,2}\\s?)?\\(?(\\d{3})\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}\\b'
                ],
                contexts: ['document', 'form', 'header']
            },
            {
                type: 'ADDRESS',
                patterns: [
                    '\\b\\d+\\s+[A-Z][a-z]+\\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Place|Pl|Terrace|Ter|Way)\\b'
                ],
                contexts: ['document', 'form', 'header']
            },
            {
                type: 'SSN',
                patterns: [
                    '\\b\\d{3}-\\d{2}-\\d{4}\\b'
                ],
                contexts: ['document', 'form']
            },
            {
                type: 'FAX',
                patterns: [
                    '\\b\\d{3}-\\d{2}-\\d{4}\\b'
                ],
                contexts: ['document', 'form']
            },
            {
                type: 'COMPANY',
                patterns: [
                    '\\b[A-Z][a-z]+\\s+[A-Z][a-z]+\\b'
                ],
                contexts: ['document', 'form']
            },
            {
                type: 'ENDPOINT',
                patterns: [
                    '\\b\\d+\\.\\d+\\.\\d+\\.\\d+\\b'
                ],
                contexts: ['document', 'form']
            },
            {
                type: 'DATE',
                patterns: [
                    '\\b\\d{4}-\\d{2}-\\d{2}\\b'
                ],
                contexts: ['document', 'form']
            },
            {
                type: 'ID',
                patterns: [
                    '\\b\\d+\\b'
                ],
                contexts: ['document', 'form']
            }
        ]
    }
];

export const defaultTemplate: RedactionTemplate = {
    id: 'default',
    name: 'Standard Redaction',
    description: 'Default template for pharmaceutical document redaction',
    categories: [
        {
            type: 'PERSON',
            patterns: [
                '\\b[A-Z][a-z]+(?:\\s+[A-Z][a-z]+){1,2}\\b'
            ],
            contexts: ['document', 'form']
        },
        {
            type: 'EMAIL',
            patterns: [
                '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b'
            ],
            contexts: ['document', 'form', 'header']
        },
        {
            type: 'PHONE',
            patterns: [
                '\\b(\\+\\d{1,2}\\s?)?\\(?(\\d{3})\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}\\b'
            ],
            contexts: ['document', 'form', 'header']
        },
        {
            type: 'DATE_OF_BIRTH',
            patterns: [
                '\\b(0?[1-9]|1[0-2])[/\\-\\.](0?[1-9]|[12][0-9]|3[01])[/\\-\\.](19|20)?\\d{2}\\b'
            ],
            contexts: ['document', 'form']
        },
        {
            type: 'ADDRESS',
            patterns: [
                '\\b\\d+\\s+[A-Z][a-z]+\\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Place|Pl|Terrace|Ter|Way)\\b'
            ],
            contexts: ['document', 'form', 'header']
        }
    ]
}; 