//Importing External Libraries
const sqlite3 = require("sqlite3")
const mysql = require("mysql")

//Importing Local Libraries
const logs = require("./log");

//Importing Control Files
const structure = require("../database.json").tables;
const { Discord } = require("discord.js");

//Gettings 

var localDB, remoteDB;

module.exports = {
    /**
     * Local Database Functions
     */

    /**
    * Opens a local database. (SQLite)
    * @param {any} filename The database to open
    */
    initializeLocalConnection: async (filename) => {
        return new Promise(async (resolve, reject) => {
            localDB = new sqlite3.Database(`./${filename}`, async (err) => {
                if (err) {
                    logs.error(err)
                    reject("Could Not Open Local Database")
                } else {
                    console.log(`Local Database Successfully Opened`)
                    console.log(`Running checks...`)
                    localDB = await module.exports.checkLocalConnection(localDB)
                    if (localDB) {
                        console.log("Checks Successful.")
                        resolve()
                    } else {
                        console.log('Checks Unsuccessful.')
                        reject("Checks Unsuccessful.")
                    }
                }
            })
        })
    },
    /**
     * Runs a check on the database. Resolves as database if successful, else false. (SQLite)
     * @param {sqlite3.Database} database A database to check
     */
    checkLocalConnection: async (database) => {
        return new Promise(async (resolve, reject) => {
            //Check Tables
            console.log("Loading tables...")
            let inaccuracies = 0
            for (var i in structure) {
                let table = structure[i]
                await new Promise((resolve, reject) => {
                    database.get(`SELECT * FROM sqlite_master WHERE type='table' AND name="${i}"`, async (err, row) => {
                        if (err) { logs.error(err); resolve() }
                        else if (row) {
                            console.log(`Table "${i}" detected. Checking columns...`)
                            database = await module.exports.checkColumns(i, table, row, database)
                            console.log(`Table "${i}" passed checks.`)
                            resolve()
                        } else {
                            inaccuracies += 1
                            console.log(`Did not detect table "${i}". Creating table...`)
                            let statement = `( ${Object.values(table).join(", ")} )`
                            if (statement != "(  )") {
                                database = await module.exports.createTable(database, i, statement)
                                resolve()
                            } else {
                                console.log(`Could not create table "${i}" using statement "${statement}"`)
                                resolve()
                            }
                        }
                    })
                })
            }

            if (inaccuracies > 0) {
                module.exports.checkLocalConnection(database)
            } else {
                resolve(database)
            }
        })
    },
    /**
     * Creates a table based on given statement (SQLite)
     * @param {sqlite3.Database} database A database to check
     * @param {string} tablename Table to create
     * @param {string} columns The columns and types
     */
    createTable: async (database, tablename, columns) => {
        return new Promise(async (resolve, reject) => {
            let statement = `CREATE TABLE IF NOT EXISTS ${tablename}${columns}`
            database.run(statement, async (err) => {
                if (err) { logs.error(err); reject(err) }
                else { console.log(`Successfully created table "${tablename}" with "${columns}"`); resolve(database) }
            })
        })
    },
    /**
     * Checks the columns of a table against a json (SQLite)
     * @param {tablename} string Name of table to check
     * @param {tableobject} Object Object of table to check
     * @param {sqlite3.Row} Row The row returned by a Database.get() statement
     * @param {sqlite3.Database} Database The database
     */
    checkColumns: async (tablename, table, row, database) => {
        return new Promise(async (resolve, reject) => {
            let sql = row.sql
            let intended = Object.values(table)
            let actual = sql.substring(0, sql.length - 2).replace(`CREATE TABLE ${tablename}( `, "").trim().split(", ")
            for (let i in actual) {
                intended.splice(intended.indexOf(actual[i]), 1)
            }
            for (let i in intended) {
                database = await new Promise(async (resolve, reject) => {
                    let statement = `ALTER TABLE ${tablename} ADD ${intended[i]}`
                    database.run(statement, async (err) => {
                        if (err) { logs.error(err); reject(err) }
                        else { console.log(`Sucessfully run "${statement}" on table "${tablename}"`); resolve(database) }
                    })
                })
            }
            resolve(database)
        })

    },
    /**
     * Resets local processes (SQLite)
     * @param {Boolean} all Clear all processes
     */
    resetProcesses: async (all = false) => {
        return new Promise(async (resolve, reject) => {
            let statement = `DELETE FROM activeprocesses ${all ? "" : "WHERE active = false"}`
            localDB.run(statement, async (err) => {
                if (err) { logs.error(err); reject(err) }
                else { console.log(`Cleared processes.`); resolve() }
            })
        })
    },
    /**
    * Creates a new process (SQLite)
    * @param {Discord.Message or Discord.Interaction} message Message
    * @param {string} command Command
    * @param {Boolean} active Active (Default True)
    */
    newProcess: async (message, command, active = true) => {
        return new Promise(async (resolve, reject) => {
            let statement = `INSERT INTO activeprocesses VALUES (?, ?, ?, ?, ?, ?)`
            localDB.run(statement, [message.createdAt, message.guild?.id, message.id, message.member?.id || message.author?.id || message.user?.id, command, active], async (err) => {
                if (err) { logs.error(err); reject(err) }
                else { console.log(`@${message.createdAt} New Process > ${command} from ${message.author?.tag || message.user?.tag} in ${message.channel.name}|${message.guild.name}`); resolve() }
            })
        })
    },
    /**
    * Deletes a processes (SQLite)
    * @param {Discord.Message or Discord.Interaction} message Message
    * @param {string} command Command
    * @param {Boolean} active Active (Default True)
    */
    deleteProcess: async (message, command, active = true) => {
        return new Promise(async (resolve, reject) => {
            let statement = `DELETE FROM activeprocesses WHERE messageid = ?`
            localDB.run(statement, [message.id], async (err) => {
                if (err) { logs.error(err); reject(err) }
                else { console.log(`@${message.createdAt} Completed Process > ${command} from ${message.author?.tag || message.user?.tag} in ${message.channel.name}|${message.guild.name}`); resolve() }
            })
        })
    },

    getPermission: async (member, command, client) => {
        return new Promise(async (resolve, reject) => {
            if (member?.id || member.user.id == client.dev) return resolve(true)

            let statement = `SELECT * FROM enabledcommands WHERE serverid = ? AND command = ?`
            localDB.all(statement, [member.guild?.id, command], async (err, row) => {
                if (err) { logs.error(err); reject(err) }
                else { resolve(row) }
            })
        })
    },
    getGuildSettings: async (guildID) => {
        return new Promise(async (resolve, reject) => {
            let statement = `SELECT * FROM servers WHERE id = ?`
            localDB.all(statement, [guildID], async (err, row) => {
                if (err) { logs.error(err); reject(err) }
                else { resolve(row) }
            })
        })
    },
    updateGuildSettings: async (guildID, updates, interaction) => {
        return new Promise(async (resolve, reject) => {
            let statement = `REPLACE INTO servers (id, prefix) VALUES (?, ?)`
            localDB.run(statement, [guildID, updates.prefix], async (err) => {
                if (err) { logs.error(err); reject(err) }
                else { console.log(`@${Date()} Setup > ${JSON.stringify(updates)} from ${interaction.user.tag} in ${interaction.channel.name}|${interaction.guild.name}`); resolve() }
            })
        })
    },
    /**
     * Remote Database Functions
     */
    /**
    * Connects to the remote database. (MySQL)
    * @param {Object} dbinfo The database info of the remote database {host, port, user, password, database}
    */
    initializeRemoteConnection: async (dbinfo) => {
        let status;
        remoteDB = await new Promise(async (resolve, reject) => {
            db = mysql.createConnection(dbinfo);
            await db.on("error", async (err) => {
                logs.error(`Remote Database Error: ${err}`)
                if (err.code == "PROTOCOL_CONNECTION_LOST") {
                    module.exports.initializeRemoteConnection(dbinfo)
                }
            })
            await db.connect((err) => {
                if (err) {
                    logs.error(`Remote Database Can't Connect: ${err}`)
                    status = `Remote Database Can't Connect: ${err}`
                    resolve("Error Connecting")
                } else {
                    resolve(db)
                    status = `Connected to ${dbinfo.host}:${dbinfo.port} @ ${dbinfo.database}`
                }
            })
        })
        return status
    },
    /**
    * Tests the active remote connection. (MySQL)
    */
    testConnection: async () => {
        return new Promise(async (resolve, reject) => {
            if (remoteDB.state == "authenticated") {
                resolve("Authenticated")
            } else {
                resolve("Not Authenticated")
            }
        })
    },
}