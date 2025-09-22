"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm");
const env_1 = require("./env");
const User_1 = require("../models/User");
const ProduceBatch_1 = require("../models/ProduceBatch");
const AuditLog_1 = require("../models/AuditLog");
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: env_1.config.database.host,
    port: env_1.config.database.port,
    username: env_1.config.database.username,
    password: env_1.config.database.password,
    database: env_1.config.database.name,
    synchronize: env_1.config.NODE_ENV !== 'production',
    logging: env_1.config.NODE_ENV === 'development',
    entities: [User_1.User, ProduceBatch_1.ProduceBatch, AuditLog_1.AuditLog],
    migrations: ['src/migrations/*.ts'],
    subscribers: ['src/subscribers/*.ts'],
});
const initializeDatabase = async () => {
    try {
        await exports.AppDataSource.initialize();
        console.log('Database connection established successfully');
    }
    catch (error) {
        console.error('Error connecting to database:', error);
        process.exit(1);
    }
};
exports.initializeDatabase = initializeDatabase;
exports.default = exports.AppDataSource;
//# sourceMappingURL=db.js.map