exports.run = async (client, message, args, Discord, sudo = false) => {
    const m = await message.channel.send("Ping?");
    let embed = new Discord.MessageEmbed()
    .setTitle("Bot Status")
    .setColor("#30ffea")
    .addField("Bot Latency:", m.createdTimestamp-message.createdTimestamp)
    .addField("API Latency:", Math.round(client.ws.ping))
    .addField("Uptime:", `${Math.floor(client.uptime/86400000)} Days ${Math.floor((client.uptime - Math.floor(client.uptime/86400000) * 86400000) / 3600000)} Hours ${Math.round((client.uptime - Math.floor(client.uptime/86400000) * 86400000 - Math.floor((client.uptime - Math.floor(client.uptime/86400000) * 86400000) / 3600000) * 3600000) / 60000)} Minutes`)
    await m.edit("",embed)
}