const fs = require("fs")

exports.run = async (client, message, args, Discord) => {
    if (message != undefined) {
        if (!sudo) {
            let commandFile = require(`./permcheck.js`);
            var auth = await commandFile.run(client, message.member, 10000000000)
            if (!auth) {
                return message.channel.send("You do not have permission to use this command.")
            }
        }
    }
    var suspensions = JSON.parse(fs.readFileSync('suspensions.json'))
    var config = JSON.parse(fs.readFileSync('config.json'))
    for (i in suspensions) {
        if (i != 'perma') {
            for (id in suspensions[i]) {
                var guild = await client.guilds.cache.get(suspensions[i][id].guildid)
                var user = await guild.members.fetch(id)
                var currentTime = Date.now()
                var endTime = suspensions[i][id].endsat
                if (currentTime >= endTime) {
                    delete suspensions.veteran[user.id]
                    fs.writeFileSync("suspensions.json", JSON.stringify(suspensions))
                    var suspendChannel = guild.channels.cache.find(c => c.id == config.channels.log.suspend)
                    await suspendChannel.send(`<@!${user.id}> has been un-vetsuspended.`)
                    await user.roles.add(config.roles.general.vetraider)
                    await user.roles.remove(config.roles.general.vetsuspended)
                    await user.send("You have been unsuspended.")

                } else {
                    setTimeout(async () => {
                        delete suspensions.veteran[user.id]
                        fs.writeFileSync("suspensions.json", JSON.stringify(suspensions))
                        var suspendChannel = guild.channels.cache.find(c => c.id == config.channels.log.suspend)
                        await suspendChannel.send(`<@!${user.id}> has been un-vetsuspended.`)
                        await user.roles.add(config.roles.general.vetraider)
                        await user.roles.remove(config.roles.general.vetsuspended)
                        await user.send("You have been unsuspended.")
                    }, endTime - currentTime)
                }
            }
        }

    }
}