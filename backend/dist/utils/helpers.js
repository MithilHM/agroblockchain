"use strict";
// src/utils/helpers.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.capitalize = exports.generateUniqueId = void 0;
const crypto_1 = require("crypto");
/**
 * Generates a unique, random identifier for a produce batch.
 * Example format: 'BATCH-a1b2c3d4'
 * @param {string} prefix - The prefix for the ID.
 * @param {number} length - The length of the random hex string.
 * @returns {string} The generated batch ID.
 */
const generateUniqueId = (prefix = 'ITEM', length = 8) => {
    const randomPart = (0, crypto_1.randomBytes)(Math.ceil(length / 2))
        .toString('hex')
        .slice(0, length)
        .toUpperCase();
    return `${prefix}-${randomPart}`;
};
exports.generateUniqueId = generateUniqueId;
/**
 * Capitalizes the first letter of a string.
 * @param {string} str - The input string.
 * @returns {string} The capitalized string.
 */
const capitalize = (str) => {
    if (typeof str !== 'string' || str.length === 0) {
        return '';
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
};
exports.capitalize = capitalize;
//# sourceMappingURL=helpers.js.map