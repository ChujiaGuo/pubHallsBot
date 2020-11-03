const fs = require('fs')
const Discord = require('discord.js')
const config = require('../config.json')

module.exports = {
    /**
     * Reports an Error directly to the bot developer
     * @param {Discord.Message} message Original Command Message
     * @param {Discord.Client} client Discord Client
     * @param {Error} error Error message
     */
    report: async (message, client, error) => {
        let dev = await client.users.fetch(config.dev)
        let errorEmbed = new Discord.MessageEmbed()
            .setColor("#ff1212")
            .setAuthor(`Error Processing: ${message.split(' ').substring(1)}`)
            .setDescription(`Original [Message](${message.url})\nError Message: \`\`\`${error.toString()}\`\`\``)
            .setTimestamp()
        let stackEmbed = new Discord.MessageEmbed()
            .setColor("#ff1212")
            .setAuthor(`Error Processing: ${message.split(' ').substring(1)}`)
            .setDescription(`Error Stack: \`\`\`${error.stack}\`\`\``)
            .setTimestamp()
        await dev.send(errorEmbed).catch(e => console.log(e))
        await dev.send(stackEmbed).catch(e => console.log(e))
        console.log(error)
    }
}
