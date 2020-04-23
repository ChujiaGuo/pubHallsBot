const fs = require('fs')

exports.run = async (client, message, args, Discord, sudo = false) => {
    if (!sudo) {
        let commandFile = require(`./permcheck.js`);
        var auth = await commandFile.run(client, message.member, 10000)
        if (!auth) {
            return message.channel.send("You do not have permission to use this command.")
        }
    }
    var config = JSON.parse(fs.readFileSync('config.json'))
    var suspensions = JSON.parse(fs.readFileSync('suspensions.json'))
    var user = args.shift()
    if (isNaN(user)) {
        user = user.slice(3, -1)
    }
    try {
        user = await message.guild.members.fetch(user)
    } catch (e) {
        return message.channel.send("Invalid User")
    }
    try {
        await user.roles.remove(config.roles.general.vetsuspended)
    } catch (e) {
        return message.channel.send(`<@!${user.id}> does not have the Suspended Veteran Role`)
    }
    if(suspensions.veteran[user.id] == undefined){
        return message.channel.send("I do not have records of this user being suspended. Please try another bot.")
    }
    var reason = args.join(' ')
    if(reason.length == 0 || reason == undefined){
        return message.channel.send("Please put a reason for unsuspending.")
    }

    await user.roles.add(config.roles.general.vetraider)
    var suspendChannel = await message.guild.channels.cache.find(c => c.id == config.channels.log.suspend)
    delete suspensions.veteran[user.id]
    fs.writeFileSync("suspensions.json", JSON.stringify(suspensions))
    await suspendChannel.send(`<@${user.id}> has been un-vetsuspended.`)
    await user.roles.add(config.roles.general.vetraider)
    await user.roles.remove(config.roles.general.vetsuspended)
    await user.send("You have been unsuspended.")

}