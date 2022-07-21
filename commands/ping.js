const { SlashCommandBuilder } = require('@discordjs/builders');
const { database } = require("../lib/index.js")

module.exports = {
    data: new SlashCommandBuilder()
        .setName(`ping`)
        .setDescription(`Bot delay`),
    execute: async (interaction, client, Discord) => {
        return new Promise(async (resolve, reject) => {
            const m = await interaction.channel.send("Ping?");
            let embed = new Discord.MessageEmbed()
                .setTitle("Bot Status")
                .setColor("#30ffea")
                .addField("Bot Latency:", `${m.createdTimestamp - interaction.createdTimestamp} ms`, true)
                .addField("API Latency:", `${Math.round(client.ws.ping)} ms`, true)
                .addField("Uptime:", `${Math.floor(client.uptime / 86400000)} Days ${Math.floor((client.uptime - Math.floor(client.uptime / 86400000) * 86400000) / 3600000)} Hours ${Math.round((client.uptime - Math.floor(client.uptime / 86400000) * 86400000 - Math.floor((client.uptime - Math.floor(client.uptime / 86400000) * 86400000) / 3600000) * 3600000) / 60000)} Minutes`)
            m.delete()
            await interaction.reply({ content: "Done!", ephemeral: true })
            await interaction.channel.send({ embeds: [embed] })
            resolve(true)
        })
    },
    run: async (client, message, args, Discord) => {
        return new Promise(async (resolve, reject) => {
            const m = await message.channel.send("Ping?");
            let embed = new Discord.MessageEmbed()
                .setTitle("Bot Status")
                .setColor("#30ffea")
                .addField("Bot Latency:", `${m.createdTimestamp - message.createdTimestamp} ms`, true)
                .addField("API Latency:", `${Math.round(client.ws.ping)} ms`, true)
                .addField("Uptime:", `${Math.floor(client.uptime / 86400000)} Days ${Math.floor((client.uptime - Math.floor(client.uptime / 86400000) * 86400000) / 3600000)} Hours ${Math.round((client.uptime - Math.floor(client.uptime / 86400000) * 86400000 - Math.floor((client.uptime - Math.floor(client.uptime / 86400000) * 86400000) / 3600000) * 3600000) / 60000)} Minutes`)
            m.delete()
            await message.channel.send({ embeds: [embed] })
            resolve(true)
        })
    },
}