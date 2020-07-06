const fs = require('fs')

exports.run = async (client, message, args, Discord, sudo = false) => {
    const afk = JSON.parse(fs.readFileSync('afk.json'))
    const config = JSON.parse(fs.readFileSync('config.json'))
    let infoChannel = await message.guild.channels.cache.find(c => c.id == config.channels.log.raid)
    let infoMessage
    //Vets
    let vetAfk = afk[100]
    if (vetAfk.afk) {
        infoMessage = await infoChannel.messages.fetch(vetAfk.infoMessageId)
    }
    let vetEmbed = new Discord.MessageEmbed()
        .setColor("#30ffea")
        .setAuthor("Information on the AFK in Veteran Runs")
        .setDescription(`Run Status: ${vetAfk.afk}\nRun Location: ${vetAfk.location}\nEarly Location: ${vetAfk.earlyLocationIds.map(id => `<@!${id}>`).join(", ")}${vetAfk.afk ? `\nRun Information Panel [Here](${infoMessage.url})` : ""}`)
    //Normal
    let normalAfk = afk[10]
    if (normalAfk.afk) {
        infoMessage = await infoChannel.messages.fetch(normalAfk.infoMessageId)
    }
    let normalEmbed = new Discord.MessageEmbed()
        .setColor("#30ffea")
        .setAuthor("Information on the AFK in Normal Runs")
        .setDescription(`Run Status: ${normalAfk.afk}\nRun Location: ${normalAfk.location}\nEarly Location: ${normalAfk.earlyLocationIds.map(id => `<@!${id}>`).join(", ")}${normalAfk.afk ? `\nRun Information Panel [Here](${infoMessage.url})` : ""}`)
    //Events
    let eventAfk = afk[1]
    if (eventAfk.afk) {
        infoMessage = await infoChannel.messages.fetch(eventAfk.infoMessageId)
    }
    let eventEmbed = new Discord.MessageEmbed()
        .setColor("#30ffea")
        .setAuthor("Information on the AFK in Events")
        .setDescription(`Run Status: ${eventAfk.afk}\nRun Location: ${eventAfk.location}\nEarly Location: ${eventAfk.earlyLocationIds.map(id => `<@!${id}>`).join(", ")}${eventAfk.afk ? `\nRun Information Panel [Here](${infoMessage.url})` : ""}`)
    //Current Channels
    let currentChannels = afk.currentRuns
    let currentChannelsEmbed = new Discord.MessageEmbed()
        .setColor("#30ffea")
        .setAuthor("Run Channels")
        .setDescription(`${Object.values(currentChannels).map(id => `<#${id}>`).join('\n')}`)
    await message.channel.send(vetEmbed)
    await message.channel.send(normalEmbed)
    await message.channel.send(eventEmbed)
    await message.channel.send(currentChannelsEmbed)
}