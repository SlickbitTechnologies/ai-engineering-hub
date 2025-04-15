/**
 * Utility function to conditionally join CSS class names together
 * @param classes - Any number of class names or objects where keys are class names and values are booleans
 * @returns A string of space-separated class names
 */
export function classNames(...classes: any[]): string {
    return classes
        .filter(Boolean)
        .flatMap(cls => {
            if (typeof cls === 'string') return cls;
            if (Array.isArray(cls)) return cls.filter(Boolean);
            if (typeof cls === 'object' && cls !== null) {
                return Object.entries(cls)
                    .filter(([_, value]) => Boolean(value))
                    .map(([key]) => key);
            }
            return [];
        })
        .join(' ');
} 