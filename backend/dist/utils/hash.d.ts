/**
 * Hashes a plaintext password using bcrypt.
 * @param {string} password - The plaintext password to hash.
 * @returns {Promise<string>} The hashed password.
 */
export declare const hashPassword: (password: string) => Promise<string>;
/**
 * Compares a plaintext password with a hashed password.
 * @param {string} plainTextPassword - The plaintext password from user input.
 * @param {string} hash - The hashed password stored in the database.
 * @returns {Promise<boolean>} True if the passwords match, false otherwise.
 */
export declare const comparePassword: (plainTextPassword: string, hash: string) => Promise<boolean>;
//# sourceMappingURL=hash.d.ts.map