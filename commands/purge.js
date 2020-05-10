const fs = require('fs')

exports.run = async (client, message, args, Discord, sudo = false) => {
    var config = JSON.parse(fs.readFileSync('config.json'))

    //Permissions
    if (!sudo) {
        let commandFile = require(`./permcheck.js`);
        var auth = await commandFile.run(client, message.member, 1000000)
        if (!auth) {
            return message.channel.send("You do not have permission to use this command.")
        }
    }
    if(isNaN(args[0])){
        return message.channel.send(`${args[0]} is not a number.`)
    }
    console.log(args[0])
    message.channel.bulkDelete(parseInt(args[0]) + 1)
}