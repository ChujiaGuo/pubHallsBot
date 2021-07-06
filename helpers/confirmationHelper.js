const mysql = require("mysql")
const fs = require("fs")

module.exports = {
    confirmMessage: async (message) => {
        return new Promise(async (resolve, reject) => {
            let config = JSON.parse(fs.readFileSync("./configs/globalConfig.json"));
            if (message.guild) config = JSON.parse(fs.readFileSync(`./configs/${message.guild.id}.json`));
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