const mysql = require("mysql")
const fs = require("fs")
const config = JSON.parse(fs.readFileSync("config.json"))

module.exports = {
    confirmMessage: async (message) => {
        return new Promise(async (resolve, reject) => {
            let confirmationCollector = message.createReactionCollector((r, u) => !u.bot && (r.emoji.name == "✅" || r.emoji.name == "❌"), { max: 1, time: 60000 })
            confirmationCollector.on('end', async r => {
                if (r == "time") { reject(false) }
            })
            confirmationCollector.on('collect', async (r, u) => {
                if (r.emoji.name == "✅") {
                    resolve(true)
                } else {
                    reject(false)
                }
            })
            await message.react("✅")
            await message.react("❌")

        })
    }
}