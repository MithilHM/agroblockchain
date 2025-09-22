// src/utils/hash.ts

import bcrypt from 'bcrypt';
import { logger } from './logger';

/**
 * Hashes a plaintext password using bcrypt.
 * @param {string} password - The plaintext password to hash.
 * @returns {Promise<string>} The hashed password.
 */
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = process.env.BCRYPT_SALT_ROUNDS
    ? parseInt(process.env.BCRYPT_SALT_ROUNDS, 10)
    : 10;

  if (isNaN(saltRounds)) {
    logger.error('BCRYPT_SALT_ROUNDS is not a valid number. Using default 10.');
  }

  return bcrypt.hash(password, saltRounds);
};

/**
 * Compares a plaintext password with a hashed password.
 * @param {string} plainTextPassword - The plaintext password from user input.
 * @param {string} hash - The hashed password stored in the database.
 * @returns {Promise<boolean>} True if the passwords match, false otherwise.
 */
export const comparePassword = async (
  plainTextPassword: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(plainTextPassword, hash);
};