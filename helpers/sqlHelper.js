const mysql = require("mysql")
const fs = require("fs")
const config = JSON.parse(fs.readFileSync("config.json"))
var db = mysql.createConnection(config.dbinfo)
db.connect(err => { if (err) throw err })

module.exports = {
    editUser: async (tableName, userId, columnName, amount) => {
        try {
            db.query(`SELECT * FROM ${tableName} WHERE id='${userId}'`, (err, rows) => {
                if (err) throw err;
                if (!rows[0]) return
                else {
                    db.query(`UPDATE ${tableName} SET ${columnName}='${parseInt(rows[0][columnName]) + parseInt(amount)}' WHERE id='${userId}'`, (err) => {
                        if (err) throw err;
                        return true
                    })
                }
            })
        } catch (e) {
            return e
        }
    }
}