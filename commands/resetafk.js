const fs = require('fs')

exports.run = async (client, message, args, Discord, sudo = false) => {
    var config = JSON.parse(fs.readFileSync("config.json"))
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

    //Permission check
    if (!sudo) {
        let commandFile = require(`./permcheck.js`);
        var auth;
        if (origin == 100) {
            auth = await commandFile.run(client, message.member, 10000);
        } else if (origin == 10) {
            auth = await commandFile.run(client, message.member, 100);
        } else if (origin == 1) {
            auth = await commandFile.run(client, message.member, 1);
        }

        if (!auth) {
            return message.channel.send("You do not have permission to use this command.")
        }
    }
    config.afk = false;
    fs.writeFileSync('config.json', JSON.stringify(config))
    return message.channel.send(`<@!${message.author.id}> Done!`)
}