"use strict";
// src/utils/hash.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.comparePassword = exports.hashPassword = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const logger_1 = require("./logger");
/**
 * Hashes a plaintext password using bcrypt.
 * @param {string} password - The plaintext password to hash.
 * @returns {Promise<string>} The hashed password.
 */
const hashPassword = async (password) => {
    const saltRounds = process.env.BCRYPT_SALT_ROUNDS
        ? parseInt(process.env.BCRYPT_SALT_ROUNDS, 10)
        : 10;
    if (isNaN(saltRounds)) {
        logger_1.logger.error('BCRYPT_SALT_ROUNDS is not a valid number. Using default 10.');
    }
    return bcrypt_1.default.hash(password, saltRounds);
};
exports.hashPassword = hashPassword;
/**
 * Compares a plaintext password with a hashed password.
 * @param {string} plainTextPassword - The plaintext password from user input.
 * @param {string} hash - The hashed password stored in the database.
 * @returns {Promise<boolean>} True if the passwords match, false otherwise.
 */
const comparePassword = async (plainTextPassword, hash) => {
    return bcrypt_1.default.compare(plainTextPassword, hash);
};
exports.comparePassword = comparePassword;
//# sourceMappingURL=hash.js.map