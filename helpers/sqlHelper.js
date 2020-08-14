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
    retrieveUser: async (userId) => {
        return new Promise((resolve, reject) => {
            var db = mysql.createConnection(config.dbinfo)
            db.connect(err => { if (err) throw err })
            try {
                db.query(`SELECT * FROM users WHERE id='${userId}'`, (err, rows) => {
                    if (err) throw err;
                    if (rows.length != 0) {
                        db.end()
                        resolve(rows[0])
                    }
                    else {
                        db.end()
                        reject(false)
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
                        db.end()
                        reject(false)
                    }
                    else {
                        db.end()
                        resolve(true)
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
                    if (result.affectedRows > 0){
                        resolve(true)
                    }else{
                        reject(false)
                    }
                })
            } catch (e) {
                console.log(e)
            }
        })
    }
}