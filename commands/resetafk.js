const fs = require('fs')

exports.run = async (client, message, args, Discord, sudo = false) => {
    var config = JSON.parse(fs.readFileSync("config.json"))
    var afk = JSON.parse(fs.readFileSync("afk.json"))
    //Check Perms
    if (message.channel.type != 'text') {
        return message.channel.send("You cannot use this command here.")
    }
    var origin = 0;
    //Check origin channel
    if (message.channel.id == config.channels.veteran.control.command) {
        origin = 100
    } else if (message.channel.id == config.channels.normal.control.command) {
        origin = 10
    } else if (message.channel.id == config.channels.event.control.command) {
        origin = 1
    } else {
        return message.channel.send("You cannot use this command here.")
    }
    afk[origin] = {
        "afk": false,
        "location": "",
        "statusMessageId": "",
        "infoMessageId": "",
        "commandMessageId": "",
        "earlyLocationIds": []
    }
    fs.writeFileSync('afk.json', JSON.stringify(afk))
    return message.channel.send(`<@!${message.author.id}> Done!`)
}