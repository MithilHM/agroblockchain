// src/utils/helpers.ts

import { randomBytes } from 'crypto';

/**
 * Generates a unique, random identifier for a produce batch.
 * Example format: 'BATCH-a1b2c3d4'
 * @param {string} prefix - The prefix for the ID.
 * @param {number} length - The length of the random hex string.
 * @returns {string} The generated batch ID.
 */
export const generateUniqueId = (prefix = 'ITEM', length = 8): string => {
  const randomPart = randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length)
    .toUpperCase();
  return `${prefix}-${randomPart}`;
};

/**
 * Capitalizes the first letter of a string.
 * @param {string} str - The input string.
 * @returns {string} The capitalized string.
 */
export const capitalize = (str: string): string => {
  if (typeof str !== 'string' || str.length === 0) {
    return '';
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
};