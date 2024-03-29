const mysql = require("mysql");
const fs = require("fs");
const { resolve } = require("path");
const e = require("cors");
const config = JSON.parse(fs.readFileSync("./configs/globalConfig.json"));
const errorHelper = require("./errorHelper.js");

var db;

module.exports = {
    /**
     * Retrieves a row or rows from a given table and column.
     *
     * Uses: `SELECT * FROM {table} WHERE {column}={rowIdentifier};`
     * @param {any} table The table to search
     * @param {any} column The column to search
     * @param {any} rowIdentifier The value to find
     */
    get: async (table, column, rowIdentifier) => {
        let connection = await module.exports.testConnection().catch((e) => e);
        if (connection != "Connected") {
            return new Promise(async (resolve, reject) => {
                reject("Bad Connection");
            });
        }
        return new Promise(async (resolve, reject) => {
            try {
                if (table && column && rowIdentifier) {
                    db.query(
                        `SELECT * FROM ${table} where ${column}=?;`,
                        [rowIdentifier],
                        (e, rows) => {
                            if (e) console.log(e);
                            else {
                                resolve(rows[0] ? rows : false);
                            }
                        }
                    );
                } else {
                    reject("Invalid Fields");
                }
            } catch (e) {
                reject(e);
            }
        });
    },
    /**
     * Updates a value of a row.
     *
     * Uses: `UPDATE {table} SET {column}={newValue} WHERE {row}={rowIdentifier};`
     * @param {any} table The table to update
     * @param {any} column The column to update
     * @param {any} newValue The new value
     * @param {any} [row=column] The row to update
     * @param {any} rowIdentifier The row to find
     */
    set: async (table, column, newValue, row = column, rowIdentifier) => {
        let connection = await module.exports.testConnection().catch((e) => e);
        if (connection != "Connected") {
            return new Promise(async (resolve, reject) => {
                reject("Bad Connection");
            });
        }
        return new Promise(async (resolve, reject) => {
            try {
                db.query(
                    `UPDATE ${table} SET ${column}=? WHERE ${row}=?;`,
                    [newValue, rowIdentifier],
                    (e, rows) => {
                        if (e) throw e;
                        else {
                            resolve(rows[0] ? rows : false);
                        }
                    }
                );
            } catch (e) {
                reject(e);
            }
        });
    },
    editUser: async (tableName, userId, columnName, amount) => {
        let connection = await module.exports.testConnection().catch((e) => e);
        if (connection != "Connected") {
            return new Promise(async (resolve, reject) => {
                reject("Bad Connection");
            });
        }
        try {
            db.query(
                `SELECT * FROM ${tableName} WHERE id='${userId}'`,
                (err, rows) => {
                    if (err) throw err;
                    if (!rows[0]) return;
                    else {
                        if (columnName == "lastnitrouse") {
                            db.query(
                                `UPDATE ${tableName} SET ${columnName}='${parseInt(
                                    amount
                                )}' WHERE id='${userId}'`,
                                (err) => {
                                    if (err) throw err;
                                }
                            );
                        } else {
                            db.query(
                                `UPDATE ${tableName} SET ${columnName}=${parseInt(rows[0][columnName]) + parseInt(amount)
                                } WHERE id='${userId}'`,
                                (err) => {
                                    if (err) throw err;
                                }
                            );
                        }
                    }
                }
            );
        } catch (e) {
            return e;
        }
    },
    managePoints: async (userId, points, type = "add", multiplier = 1) => {
        let connection = await module.exports.testConnection().catch((e) => e);
        if (connection != "Connected") {
            return new Promise(async (resolve, reject) => {
                reject("Bad Connection");
            });
        }
        return new Promise((resolve, reject) => {
            try {
                db.query(
                    `UPDATE users SET points ${type == "add"
                        ? "= points +"
                        : type == "subtract"
                            ? "= points -"
                            : type == "raw"
                                ? "="
                                : "= points +"
                    } ${parseInt(points) * multiplier} WHERE id=${userId}`,
                    (err, result) => {
                        if (err) reject(err);

                        resolve(result);
                    }
                );
            } catch {
                return e;
            }
        });
    },
    retrieveUser: async (userId) => {
        let connection = await module.exports.testConnection().catch((e) => e);
        if (connection != "Connected") {
            return new Promise(async (resolve, reject) => {
                reject("Bad Connection");
            });
        }
        return new Promise((resolve, reject) => {
            var db = mysql.createConnection(config.dbinfo);
            db.connect((err) => {
                if (err) throw err;
            });
            try {
                db.query(`SELECT * FROM users WHERE id='${userId}'`, (err, rows) => {
                    if (err) throw err;
                    if (rows.length != 0) {
                        resolve(rows[0]);
                    } else {
                        reject(false);
                    }
                });
            } catch (e) {
                console.log(e);
            }
        });
    },
    checkModMailBlacklist: async (userId) => {
        let connection = await module.exports.testConnection().catch((e) => e);
        if (connection != "Connected") {
            return new Promise(async (resolve, reject) => {
                reject("Bad Connection");
            });
        }
        return new Promise((resolve, reject) => {
            var db = mysql.createConnection(config.dbinfo);
            db.connect((err) => {
                if (err) throw err;
            });
            try {
                db.query(
                    `SELECT * FROM modmailblacklist WHERE id='${userId}'`,
                    (err, rows) => {
                        if (err) throw err;
                        if (rows.length != 0) {
                            reject(false);
                        } else {
                            resolve(true);
                        }
                    }
                );
            } catch (e) {
                console.log(e);
            }
        });
    },
    modmailBlacklist: async (userId) => {
        let connection = await module.exports.testConnection().catch((e) => e);
        if (connection != "Connected") {
            return new Promise(async (resolve, reject) => {
                reject("Bad Connection");
            });
        }
        return new Promise((resolve, reject) => {
            var db = mysql.createConnection(config.dbinfo);
            db.connect((err) => {
                if (err) throw err;
            });
            try {
                db.query(
                    `INSERT INTO modmailblacklist VALUES (${userId})`,
                    (err, result) => {
                        if (err) throw err;
                        if (result.affectedRows > 0) {
                            resolve(true);
                        } else {
                            reject(false);
                        }
                    }
                );
            } catch (e) {
                console.log(e);
            }
        });
    },
    addToQueue: async (userId, queueType) => {
        let connection = await module.exports.testConnection().catch((e) => e);
        if (connection != "Connected") {
            return new Promise(async (resolve, reject) => {
                reject("Bad Connection");
            });
        }
        return new Promise((resolve, reject) => {
            var db = mysql.createConnection(config.dbinfo);
            db.connect((err) => {
                if (err) throw err;
            });
            try {
                db.query(
                    `INSERT INTO afk_queue (userid, jointime, queuetype) VALUES (${userId}, ${Date.now()}, '${queueType}') ON DUPLICATE KEY UPDATE jointime = '${Date.now()}', queuetype = '${queueType}';`,
                    (err, result) => {
                        if (err) console.log(err);
                        if (result.affectedRows > 0) {
                            resolve(true);
                        } else {
                            reject(false);
                        }
                    }
                );
            } catch (e) {
                console.log(e);
            }
        });
    },
    nextInQueue: async (queueType, guildid) => {
        let guildConfig = JSON.parse(fs.readFileSync(`./configs/${guildid}.json`));
        let connection = await module.exports.testConnection().catch((e) => e);
        if (connection != "Connected") {
            return new Promise(async (resolve, reject) => {
                reject("Bad Connection");
            });
        }
        return new Promise((resolve, reject) => {
            var db = mysql.createConnection(config.dbinfo);
            db.connect((err) => {
                if (err) throw err;
            });
            try {
                db.query(
                    `SELECT userid FROM afk_queue WHERE queuetype = '${queueType}' AND admittime < ${Date.now()} ORDER BY jointime LIMIT ${guildConfig.afksettings.queueamount
                    }`,
                    (err, result) => {
                        if (err) throw err;
                        if (result) {
                            resolve(result);
                        } else {
                            reject(false);
                        }
                    }
                );
            } catch (e) {
                console.log(e);
            }
        });
    },
    removeFromQueue: async (ids) => {
        let connection = await module.exports.testConnection().catch((e) => e);
        if (connection != "Connected") {
            return new Promise(async (resolve, reject) => {
                reject("Bad Connection");
            });
        }
        return new Promise((resolve, reject) => {
            var db = mysql.createConnection(config.dbinfo);
            db.connect((err) => {
                if (err) throw err;
            });
            ids.push("END");
            for (i in ids) {
                let id = ids[i];
                if (id == "END") {
                    resolve(true);
                } else {
                    try {
                        db.query(
                            `DELETE FROM afk_queue WHERE userid=${id}`,
                            (err, result) => { }
                        );
                    } catch (e) {
                        console.log(e);
                    }
                }
            }
        });
    },
    queuePosition: async (id, queueType) => {
        let connection = await module.exports.testConnection().catch((e) => e);
        if (connection != "Connected") {
            return new Promise(async (resolve, reject) => {
                reject("Bad Connection");
            });
        }
        return new Promise((resolve, reject) => {
            var db = mysql.createConnection(config.dbinfo);
            db.connect((err) => {
                if (err) throw err;
            });
            try {
                db.query(
                    `SELECT count(*) FROM afk_queue WHERE queuetype = '${queueType}' AND jointime < ${Date.now()}`,
                    (err, result) => {
                        if (err) throw err;
                        if (result) {
                            resolve(result[0]["count(*)"] - 1);
                        } else {
                            reject(false);
                        }
                    }
                );
            } catch (e) {
                console.log(e);
            }
        });
    },
    suspendUser: async (suspensionJSON) => {
        let connection = await module.exports.testConnection().catch((e) => e);
        if (connection != "Connected") {
            return new Promise(async (resolve, reject) => {
                reject("Bad Connection");
            });
        }
        return new Promise((resolve, reject) => {
            var db = mysql.createConnection(config.dbinfo);
            db.connect((err) => {
                if (err) throw err;
            });
            try {
                db.query(
                    `SELECT * FROM suspensions UNION SELECT * FROM JSON_TABLE('[${JSON.stringify(
                        suspensionJSON
                    )}]', '$[*]' COLUMNS())`,
                    (err, result) => {
                        console.log(err);
                        if (err) throw err;
                        if (result.affectedRows > 0) {
                            resolve(true);
                        } else {
                            reject(false);
                        }
                    }
                );
            } catch (e) {
                console.log(e);
            }
        });
    },
    unsuspendUser: async (id) => { },
    mute: async (client, member, reason, unsuspendtime) => {
        return new Promise(async (resolve, reject) => {
            try {
                var db = mysql.createConnection(config.dbinfo);
                db.connect((e) => {
                    if (e) throw e;
                });

                db.query(
                    `INSERT INTO mutes (id, guildid, muted, reason, modid, uTime) VALUES (${member.id}, ${member.guild.id}, 1, ?, ${client.user.id}, ${unsuspendtime})`,
                    [reason],
                    (e, rows) => {
                        if (e) throw e;
                        else {
                            resolve(rows[0] ? rows : false);
                        }
                    }
                );
            } catch (e) {
                reject(e);
            }
        });
    },
    testConnection: async () => {
        return new Promise(async (resolve, reject) => {
            if (db.state == "authenticated") {
                resolve("Connected");
            } else {
                reject("Not Connected");
            }
        });
    },
    makeError: async () => {
        return new Promise((resolve, reject) => {
            let userId = "asdjfhaskdf";
            var db = mysql.createConnection(config.dbinfo);
            db.connect((err) => {
                if (err) reject("Not Connected");
            });
            resolve(true);
        });
    },
    currentWeekAdd: async (userId, columnName, amount) => {
        let connection = await module.exports.testConnection().catch((e) => e);
        if (connection != "Connected") {
            return new Promise(async (resolve, reject) => {
                reject("Bad Connection");
            });
        }
        return new Promise((resolve, reject) => {
            let currentWeekTypes = {
                feedback: "currentweekFeedback",
                parses: "currentweekparses",
                assists: "currentweekAssists",
                voidsLead: "currentweekVoid",
                cultsLead: "currentweekCult",
                eventsLead: "currentweekEvents",
            };
            if (!currentWeekTypes[columnName])
                return reject("Invalid row identifier for currentweek.");
            try {
                var db = mysql.createConnection(config.dbinfo);
                db.connect((e) => {
                    if (e) throw e;
                });

                db.query(
                    `UPDATE users SET ${columnName}=${columnName}+${amount} WHERE id=${userId};`,
                    (e, rows) => {
                        if (e) throw e;
                        else {
                            resolve(rows[0] ? rows : false);
                        }
                    }
                );
                db.query(
                    `UPDATE users SET ${currentWeekTypes[columnName]}=${currentWeekTypes[columnName]}+${amount} WHERE id=${userId};`,
                    (e, rows) => {
                        if (e) throw e;
                        else {
                            resolve(rows[0] ? rows : false);
                        }
                    }
                );
            } catch (e) {
                reject(e);
            }
        });
    },
    checkExpelled: async (identifier) => {
        let connection = await module.exports.testConnection().catch((e) => e);
        if (connection != "Connected") {
            return new Promise(async (resolve, reject) => {
                reject("Bad Connection");
            });
        }
        return new Promise(async (resolve, reject) => {
            try {
                var db = mysql.createConnection(config.dbinfo);
                db.connect((e) => {
                    if (e) throw e;
                });

                db.query(
                    `SELECT * FROM veriblacklist where id=?`,
                    [identifier],
                    (e, rows) => {
                        if (e) throw e;
                        else {
                            resolve(rows[0] ? true : false);
                        }
                    }
                );
            } catch (e) {
                reject(e);
            }
        });
    },
    startConnection: async () => {
        this.db = new Promise(async (resolve, reject) => {
            db = mysql.createConnection(config.dbinfo);
            db.connect((err) => {
                if (err) {
                    console.log("connection failed: ", err);
                    reject("Not Connected");
                }
            });

            db.on("error", async (err) => {
                console.log("error: ", err);
                if (err.code == "PROTOCOL_CONNECTION_LOST") {
                    module.exports.startConnection();
                } else {
                    console.log(err);
                }
            });
            console.log("connected to db")
            resolve(db);
        });

        return db;
    },
};
