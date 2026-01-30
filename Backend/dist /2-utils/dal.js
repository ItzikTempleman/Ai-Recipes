"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dal = void 0;
const mysql2_1 = require("mysql2");
const app_config_1 = require("./app-config");
class DAL {
    options = {
        host: app_config_1.appConfig.host,
        user: app_config_1.appConfig.user,
        password: app_config_1.appConfig.password,
        database: app_config_1.appConfig.database
    };
    connection = (0, mysql2_1.createPool)(this.options);
    execute(sql, values) {
        return new Promise((resolve, reject) => {
            this.connection.query(sql, values, (err, result) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(result);
            });
        });
    }
}
exports.dal = new DAL();
