const fs = require("fs")

exports.run = async (client, message, args, Discord, sudo = false) => {
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
                if (i == 'veteran') {
                    suspensions = JSON.parse(fs.readFileSync('suspensions.json'))
                    var guild = await client.guilds.cache.get(suspensions[i][id].guildid)
                    var user = await guild.members.fetch(id)
                    var currentTime = Date.now()
                    var endTime = suspensions[i][id].endsat
                    if (currentTime >= endTime) {

                        var suspendChannel = guild.channels.cache.find(c => c.id == config.channels.log.suspend)
                        if (user.roles.cache.has(config.roles.general.vetsuspended)) {
                            await user.roles.remove(config.roles.general.vetsuspended)
                            await user.roles.add(config.roles.general.vetraider)
                            await user.send("You have been un-vetsuspended.")
                            await suspendChannel.send(`<@!${user.id}> has been un-vetsuspended.`)
                            delete suspensions.veteran[user.id]
                            fs.writeFileSync("suspensions.json", JSON.stringify(suspensions))
                        } else {
                            let modLog = guild.channels.cache.find(c => c.id == config.channels.log.mod)
                            await modLog.send(`<@!${user.id}> was supposed to have been un-vetsuspended at ${endTime} (Current Time: ${currentTime}), but they do not have the Veteran Suspended role.`)
                        }

                    } else {
                        setTimeout(async () => {
                            if (suspensions.veteran[user.id]) {
                                delete suspensions.veteran[user.id]
                                fs.writeFileSync("suspensions.json", JSON.stringify(suspensions))
                                var suspendChannel = guild.channels.cache.find(c => c.id == config.channels.log.suspend)
                                await suspendChannel.send(`<@!${user.id}> has been un-vetsuspended.`)
                                await user.roles.add(config.roles.general.vetraider)
                                await user.roles.remove(config.roles.general.vetsuspended)
                                await user.send("You have been un-vetsuspended.")
                            }
                        }, endTime - currentTime)
                    }
                } else if (i == "normal") {
                    suspensions = JSON.parse(fs.readFileSync('suspensions.json'))
                    var user = await guild.members.fetch(id)
                    var currentTime = Date.now()
                    var endTime = suspensions[i][id].endsat
                    if (currentTime >= endTime) {

                        var suspendChannel = guild.channels.cache.find(c => c.id == config.channels.log.suspend)
                        if (user.roles.cache.has(config.roles.general.tempsuspended)) {
                            await user.roles.remove(config.roles.general.tempsuspended)
                            await user.roles.add(suspensions[i][id].roles)
                            await user.send("You have been unsuspended.")
                            await suspendChannel.send(`<@!${user.id}> has been unsuspended.`)
                            delete suspensions.normal[user.id]
                            fs.writeFileSync("suspensions.json", JSON.stringify(suspensions))
                        } else {
                            let modLog = guild.channels.cache.find(c => c.id == config.channels.log.mod)
                            await modLog.send(`<@!${user.id}> was supposed to have been unsuspended at ${endTime} (Current Time: ${currentTime}), but they do not have the Suspended role.`)
                        }
                    } else {
                        setTimeout(async () => {
                            if (suspensions.normal[user.id]) {
                                var suspendChannel = guild.channels.cache.find(c => c.id == config.channels.log.suspend)
                                await suspendChannel.send(`<@!${user.id}> has been unsuspended.`)
                                await user.roles.add(suspensions.normal[user.id].roles)
                                await user.roles.remove(config.roles.general.tempsuspended)
                                await user.send("You have been unsuspended.")
                                delete suspensions.normal[user.id]
                                fs.writeFileSync("suspensions.json", JSON.stringify(suspensions))
                            }

                        }, endTime - currentTime)
                    }
                }

            }
        }
    }

}
