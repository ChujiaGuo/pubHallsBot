const fs = require('fs')

exports.run = async (client, message, args, Discord, sudo = false) => {
    if (!sudo) {
        let commandFile = require(`./permcheck.js`);
        var auth = await commandFile.run(client, message.member, 1000000000)
        if (!auth) {
            return message.channel.send("You do not have permission to use this command.")
        }
    }
    process.exit(1)
}