const fs = require('fs')
const config = JSON.parse(fs.readFileSync("config.json"))

exports.run = async (client, message, args, Discord) => {
    let errorLog = fs.readFileSync(`${config.errorLog}`).toString()

    args = args[0] || 15
    args = Math.abs(args)
    
    let linesRead = errorLog.split("\n").slice(-args).join('\n')
    let errorEmbed = new Discord.MessageEmbed()
        .setColor("#30ffea")
        .setDescription(`Last ${args} lines of errors:\n${linesRead}`)
        .setTimestamp()
    await message.author.send(errorEmbed)
}