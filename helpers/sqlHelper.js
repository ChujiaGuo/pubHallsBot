const mysql = require("mysql")
const fs = require("fs")
const config = JSON.parse(fs.readFileSync("config.json"))

module.exports = {
    editUser: async (tableName, userId, columnName, amount) => {
        var db = mysql.createConnection(config.dbinfo)
        db.connect(err => { if (err) throw err })
        try {
            db.query(`SELECT * FROM ${tableName} WHERE id='${userId}'`, (err, rows) => {
                if (err) throw err;
                if (!rows[0]) return
                else {
                    if (columnName == "lastnitrouse") {
                        db.query(`UPDATE ${tableName} SET ${columnName}='${parseInt(amount)}' WHERE id='${userId}'`, (err) => {
                            if (err) throw err;
                            db.end()
                        })
                    } else {
                        db.query(`UPDATE ${tableName} SET ${columnName}=${parseInt(rows[0][columnName]) + parseInt(amount)} WHERE id='${userId}'`, (err) => {
                            if (err) throw err;
                            db.end()
                        })
                    }
                }
            })
        } catch (e) {
            return e
        }
    },
    managePoints: async (userId, points, type = 'add', multiplier = 1) => {
        return new Promise((resolve, reject) => {
            var db = mysql.createConnection(config.dbinfo)
            db.connect(err => { if (err) reject(err) })
            try {
                db.query(`UPDATE users SET points ${type == "add" ? '= points +' : type == "subtract" ? '= points -' : type == "raw" ? "=" : "= points +"} ${parseInt(points) * multiplier} WHERE id=${userId}`, (err, result) => {
                    if (err) reject(err)
                    db.end()
                    resolve(result)
                })
            } catch {
                return e
            }
        })
    },
    retrieveUser: async (userId) => {
        return new Promise((resolve, reject) => {
            var db = mysql.createConnection(config.dbinfo)
            db.connect(err => { if (err) throw err })
            try {
                db.query(`SELECT * FROM users WHERE id='${userId}'`, (err, rows) => {
                    if (err) throw (err);
                    if (rows.length != 0) {
                        resolve(rows[0])
                        db.end()
                    }
                    else {
                        reject(false)
                        db.end()
                    }
                })
            } catch (e) {
                console.log(e)
            }
        })
    },
    checkModMailBlacklist: async (userId) => {
        return new Promise((resolve, reject) => {
            var db = mysql.createConnection(config.dbinfo)
            db.connect(err => { if (err) throw err })
            try {
                db.query(`SELECT * FROM modmailblacklist WHERE id='${userId}'`, (err, rows) => {
                    if (err) throw err;
                    if (rows.length != 0) {
                        reject(false)
                        db.end()
                    }
                    else {
                        resolve(true)
                        db.end()
                    }
                })
            } catch (e) {
                console.log(e)
            }
        })
    },
    modmailBlacklist: async (userId) => {
        return new Promise((resolve, reject) => {
            var db = mysql.createConnection(config.dbinfo)
            db.connect(err => { if (err) throw err })
            try {
                db.query(`INSERT INTO modmailblacklist VALUES (${userId})`, (err, result) => {
                    if (err) throw err;
                    if (result.affectedRows > 0) {
                        resolve(true)
                        db.end()
                    } else {
                        reject(false)
                        db.end()
                    }
                })
            } catch (e) {
                console.log(e)
            }
        })
    },
    suspendUser: async (suspensionJSON) => {
        return new Promise((resolve, reject) => {
            var db = mysql.createConnection(config.dbinfo)
            db.connect(err => { if (err) throw err })
            try {
                db.query(`SELECT * FROM suspensions UNION SELECT * FROM JSON_TABLE('[${JSON.stringify(suspensionJSON)}]', '$[*]' COLUMNS())`, (err, result) => {
                    console.log(err)
                    if (err) throw err;
                    if (result.affectedRows > 0) {
                        resolve(true)
                    } else {
                        reject(false)
                    }
                })
            } catch (e) {
                console.log(e)
            }
        })
    },
    mergeJsonTable: async (json, tableName) => {

    },
    testConnection: async () => {
        return new Promise((resolve, reject) => {
            var db = mysql.createConnection(config.dbinfo)
            db.connect(err => { if (err) reject('Not Connected') })
            db.end()
            resolve('Connected')
        })
    },
    makeError: async () => {
        return new Promise((resolve, reject) => {
            let userId = 'asdjfhaskdf'
            var db = mysql.createConnection(config.dbinfo)
            db.connect(err => { if (err) reject('Not Connected') })
            resolve(true)
            db.end()
            db.end()
        })
    }
}