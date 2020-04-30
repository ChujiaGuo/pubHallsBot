const fs = require('fs')

exports.run = async (client, message, args, Discord, sudo = false) => {
    var config = JSON.parse(fs.readFileSync("config.json"))
    var afk = JSON.parse(fs.readFileSync("afk.json"))
    //Check Perms
    if (message.channel.type != 'text') {
        return message.channel.send("You cannot use this command here.")
    }
    //Permission check
    if (!sudo) {
        let commandFile = require(`./permcheck.js`);
        var auth;
        auth = await commandFile.run(client, message.member, 100);

        if (!auth) {
            return message.channel.send("You do not have permission to use this command.")
        }
    }
    afk = {
        "afk": false,
        "location":"",
        "statusMessageId": "",
        "infoMessageId": "",
        "commandMessageId": "",
        "earlyLocationIds": []
    }
    fs.writeFileSync('afk.json', JSON.stringify(afk))
    return message.channel.send(`<@!${message.author.id}> Done!`)
}