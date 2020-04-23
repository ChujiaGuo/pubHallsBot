const fs = require('fs')

exports.run = async (client, message, args, Discord, sudo = false) => {
    if (!sudo) {
        let commandFile = require(`./permcheck.js`);
        var auth = await commandFile.run(client, message.member, 100000)
        if (!auth) {
            return message.channel.send("You do not have permission to use this command.")
        }
    }
    var config = JSON.parse(fs.readFileSync('config.json'))
    var user = args.shift()
    var ign = args.shift()
    if (ign == undefined) {
        return message.channel.send("Please add a nickname.")
    }
    if (isNaN(user)) {
        user = user.slice(3, -1)
    }
    try {
        user = await message.guild.members.fetch(user)
    }catch(e){
        return message.channel.send("Invalid User")
    }
    try{
        await user.roles.add(config.roles.general.raider)
    }catch(e){
        return message.channel.send(`Missing Permissions: \`Manage Roles\``)
    }
    try{
        await user.setNickname(ign)
    }catch(e){
        return message.channel.send(`Missing Permissions: \`Set Nickname\``)
    }
    
    let logChannel = message.guild.channels.cache.find(c => c.id == config.channels.log.mod)
    await logChannel.send(`<@!${user.id}> has been verified by <@!${message.author.id}>`)
}