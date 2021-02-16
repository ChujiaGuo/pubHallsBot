const fs = require('fs')
const Discord = require('discord.js')
const sqlHelper = require('./sqlHelper.js')
const config = JSON.parse(fs.readFileSync('config.json'))

module.exports = {
    sendStatusMessage: async (client, guildId) => {
        let processes = JSON.parse(fs.readFileSync('processes.json'))
        let guild = await client.guilds.cache.find(g => g.id == guildId)
        console.log(guildId)
        if (guild) {
            let channel = await guild.channels.cache.find(c => c.id == config[guildId].channels.command.status)
            if (channel) {
                let statusEmbed = await module.exports.createStatusEmbed(client)
                let statusMessage = await channel.send(statusEmbed)
                processes.statusMessageId = statusMessage.id
                processes.statusChannelId = statusMessage.channel.id
                processes.statusGuildId = statusMessage.channel.guild.id
                fs.writeFileSync('processes.json', JSON.stringify(processes))
            }
        }
    },
    updateStatusMessage: async (client) => {
        return new Promise(async (resolve, reject) => {
            let processes = JSON.parse(fs.readFileSync('processes.json'))
            if (!processes.statusMessageId) {
                return module.exports.sendStatusMessage(client, config.channels.command.statusGuild)
            }
            let guild = await client.guilds.cache.find(g => g.id == processes.statusGuildId)
            if (guild) {
                let channel = await guild.channels.cache.find(c => c.id == processes.statusChannelId)
                if (channel) {
                    let statusEmbed = await module.exports.createStatusEmbed(client)
                    let statusMessage = await channel.messages.fetch(processes.statusMessageId)
                    await statusMessage.edit(statusEmbed)
                    resolve(true)
                } else {
                    reject(false)
                }
            } else {
                reject(false)
            }
        })
    },
    createStatusEmbed: async (client) => {
        let processes = JSON.parse(fs.readFileSync('processes.json'))
        var databaseStatus;
        if (processes.databaseStatus == true) {
            databaseStatus = await sqlHelper.testConnection().catch(e => e)
        } else {
            databaseStatus = "Not Connected"
        }
        if (databaseStatus != "Connected" && processes.botStatus != "#ff1212") {
            processes.botStatus = "#fff100"
            processes.additionalInfo = `Cannot connect to database: \`${databaseStatus}\``
            databaseStatus = "Not Connected"
        }
        let statusEmbed = new Discord.MessageEmbed()
            .setAuthor("Bot Status")
            .addField("Bot Latency:", "N/A", true)
            .addField("API Latency:", Math.round(client.ws.ping), true)
            .addField("Database Status:", `${databaseStatus} ${databaseStatus == "Connected" ? '✅' : '❌'}`)
            .addField("Active Processes:", processes.activeProcesses.length == 0 ? "None" : processes.activeProcesses.map(p => !p[3] ? `<@${p[0]}>'s [${p[1].charAt(0).toUpperCase() + p[1].substring(1)}](${p[2]})` : "").join("\n"))
            .addField("Pending Restart:", processes.pendingRestart ? '✅' : '❌')
            .addField("Key:", "🟢 Fully Functioning | 🟡 Functioning with some problems | 🔴 Not Functioning")
            .addField("Additional Information:", processes.additionalInfo.length > 0 ? processes.additionalInfo : "None")
            .setColor(processes.botStatus)
            .setTimestamp()
        return statusEmbed
    },
    clearActiveProcesses: async (client) => {

    }
}