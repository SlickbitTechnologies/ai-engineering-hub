
const PLACEHOLDERS = {
    "[XYZ Restaurant]": "Biryani Palace", // Updated example name
    "[Imaginary Landmark]": "Modular Supermarket",
    "[Hypothetical Number, e.g., 98765 43210]": "98765 43210",
    // ... Add all other placeholders ...
};

// Use 'export' keyword directly
export function replacePh(text) {
    if (!text) return "";
    let textStr = String(text);
    for (const ph in PLACEHOLDERS) {
        const regex = new RegExp(ph.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');
        textStr = textStr.replace(regex, PLACEHOLDERS[ph]);
    }
    return textStr;
}

export function getPlaceholder(key, defaultValue = '') {
    return PLACEHOLDERS[key] || defaultValue;
}

// Optionally export the object itself if needed elsewhere
export { PLACEHOLDERS };