const fs = require('fs')
const Discord = require('discord.js')
const config = JSON.parse(fs.readFileSync("./configs/globalConfig.json"));

module.exports = {
    /**
     * Reports an Error directly to the bot developer
     * @param {Discord.Message} message Original Command Message
     * @param {Discord.Client} client Discord Client
     * @param {Error} error Error message
     */
    report: async (message, client, error) => {
        await module.exports.log(message, client, error)
        let dev = await client.users.fetch(config.dev)
        let errorEmbed = new Discord.MessageEmbed()
            .setColor("#ff1212")
            .setAuthor(`Error Processing: ${message.content.split(' ')[0].substring(1)}`)
            .setDescription(`Original [Message](${message.url})\nError Message: \`\`\`${error.toString()}\`\`\``)
            .setTimestamp()
        let stackEmbed = new Discord.MessageEmbed()
            .setColor("#ff1212")
            .setAuthor(`Error Processing: ${message.content.split(' ')[0].substring(1)}`)
            .setDescription(`Error Stack: \`\`\`${error.stack}\`\`\``)
            .setTimestamp()
        await dev.send(errorEmbed).catch(e => console.log(e))
        await dev.send(stackEmbed).catch(e => console.log(e))
    },
    /**
     * Formats and Logs an error to console and error file
     * @param {Discord.Message} message Original Command Message
     * @param {Discord.Client} client Discord Client
     * @param {Error} error Error message
     */
    log: async (message, client, error) => {
        
        let errorLog = fs.readFileSync(config.errorLog)
        let errorFormat = `Command: ${message.content.split(' ')[0].substring(1)} | Error: ${error.toString()} | Time: ${Date.now()}\n`
        errorLog += errorFormat
        console.log(errorFormat)
        console.log(error)
        fs.writeFileSync(config.errorLog, errorLog)
    }
}
