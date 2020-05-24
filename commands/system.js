var os = require('os')

exports.run = async (client, message, args, Discord, sudo = false) => {
    if (sudo != true) {
        return
    }
    const m = await message.channel.send("Ping?");
    let embed = new Discord.MessageEmbed()
        .setTitle("Bot Status")
        .setColor("#30ffea")
        .addField("Bot Latency:", m.createdTimestamp - message.createdTimestamp, true)
        .addField("API Latency:", Math.round(client.ws.ping), true)
        .addField("Uptime (Process):", `${Math.floor(client.uptime / 86400000)} Days ${Math.floor((client.uptime - Math.floor(client.uptime / 86400000) * 86400000) / 3600000)} Hours ${Math.round((client.uptime - Math.floor(client.uptime / 86400000) * 86400000 - Math.floor((client.uptime - Math.floor(client.uptime / 86400000) * 86400000) / 3600000) * 3600000) / 60000)} Minutes`)
        .addField("Memory Used (Process):", bytesToSize(process.memoryUsage().heapUsed), true)
        .addField("Total Memory (Process):", bytesToSize(process.memoryUsage().heapTotal), true)
        .addField("Free Memory (Process):", bytesToSize(process.memoryUsage().heapTotal - process.memoryUsage().heapUsed), true)
        .addField("Uptime (OS):", toTimeString(os.uptime))
        .addField("Memory Used (OS):", bytesToSize(os.freemem()), true)
        .addField("Total Memory (OS):", bytesToSize(os.totalmem()), true)
        .addField("Free Memory (OS)", bytesToSize(os.totalmem() - os.freemem()), true)
    await m.edit("", embed)

    function bytesToSize(bytes) {
        var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes == 0) return 'n/a';
        var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        if (i == 0) return bytes + ' ' + sizes[i];
        return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i];
    }
    function toTimeString(time) {
        return `${Math.floor(time / 86400000)} Days ${Math.floor((time - Math.floor(time / 86400000) * 86400000) / 3600000)} Hours ${Math.round((time - Math.floor(time / 86400000) * 86400000 - Math.floor((time - Math.floor(time / 86400000) * 86400000) / 3600000) * 3600000) / 60000)} Minutes`
    }
}