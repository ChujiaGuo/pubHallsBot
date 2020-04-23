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
    var durations = {
        "d": 86400000,
        "h": 3600000,
        "m": 60000,
        "s": 1000
    }
    if(args.length < 4){
        return message.channel.send(`You are missing arguments. Expected 4, received ${args.length}`)
    }
    var user = args.shift()
    if (isNaN(user)) {
        user = user.slice(3, -1)
    }
    try {
        user = await message.guild.members.fetch(user)
    } catch (e) {
        return message.channel.send("Invalid User")
    }
    if (user.id == message.author.id) {
        return message.channel.send("Why would you vet suspend yourself. (and in case it wasn't obvious, the request is denied)")
    }
    var length = args.shift()
    if (isNaN(length)) {
        return message.channel.send(`\`${length}\` is not a valid length. Please use a number.`)
    }
    var duration = args.shift()
    if (!durations.hasOwnProperty(duration)) {
        return message.channel.send(`\`${duration}\` is not a valid length. Your options are the following: \`d\` for days, \`h\` for hours, \`m\` for minutes, \`s\` for seconds`)
    }
    var reason = args.join(' ')
    var time = parseInt(length) * durations[duration]
    if (time >= 2 ** 32) {
        return message.channel.send(`${time} does not fit into a 32-bit signed integer. Please choose a smaller time.`)
    }
    var days, hours, minutes;
    days = Math.floor(time / 86400000)
    hours = Math.floor((time - days * 86400000) / 3600000)
    minutes = Math.round((time - days * 86400000 - hours * 3600000) / 60000)

    if (user.roles.cache.has(config.roles.general.vetraider)) {
        //Roles
        await user.roles.remove(config.roles.general.vetraider)
        await user.roles.add(config.roles.general.vetsuspended)

        //Embed and Log
        let currentTime = Date.now()
        let suspendChannel = await message.guild.channels.cache.find(c => c.id == config.channels.log.suspend)
        var suspendEmbed = new Discord.MessageEmbed()
            .setColor("#ff1212")
            .setTitle("Veteran Suspension Info")
            .setDescription(`The suspension is for ${days} days ${hours} hours ${minutes} minutes.`)
            .addField(`User's Server Name: \`${user.nickname}\``, `<@!${user.id}> (Username: ${user.user.username})`, true)
            .addField(`Moderator's Server Name : \`${message.member.nickname}\``, `<@!${message.member.id}> (Username: ${message.author.username})`)
            .addField(`Reason for suspension:`, reason)
            .setFooter("Unsuspended at ")
            .setTimestamp(currentTime + time)
        let suspendMessage = await suspendChannel.send(suspendEmbed)
        await user.send(suspendEmbed)

        //Add to suspensions
        suspensions.veteran[user.id] = {
            "suspendlog": suspendMessage.id,
            "startedat": currentTime,
            "duration": time,
            "endsat": currentTime + time,
            "guildid": message.guild.id
        }
        fs.writeFileSync("suspensions.json", JSON.stringify(suspensions))
        //Timeout for unsuspend
        setTimeout(async () => {
            var suspensions = JSON.parse(fs.readFileSync('suspensions.json'))
            if (suspensions.veteran[user.id] != undefined) {
                delete suspensions.veteran[user.id]
                fs.writeFileSync("suspensions.json", JSON.stringify(suspensions))
                suspendEmbed
                    .setColor("#41f230")
                    .setDescription("Unsuspended")
                await suspendMessage.edit(suspendEmbed)
                await user.roles.add(config.roles.general.vetraider)
                await user.roles.remove(config.roles.general.vetsuspended)
                await user.send("You have been un-vetsuspended.")
            }

        }, time)
        await message.channel.send(`<@!${user.id}> has been vet-suspended.`)

    } else if (user.roles.cache.has(config.roles.general.vetsuspended)) {
        if (suspensions.veteran[user.id]) {
            let confirmationMessage = await message.channel.send(`<@!${user.id}> has already been veteran suspended. Would you like to override?`)
            await confirmationMessage.react("✅")
            await confirmationMessage.react("❌")
            const filter = (reaction, user) => (reaction.emoji.name === '✅' || reaction.emoji.name == "❌") && user.id === message.author.id
            confirmationMessage.awaitReactions(filter, { time: 15000, errors: ['time'], max: 1 })
                .then(async m => {
                    var name = m.map(m => m.emoji)[0].name
                    if (name == "✅") {
                        //Embed and Log
                        let currentTime = Date.now()
                        let suspendChannel = await message.guild.channels.cache.find(c => c.id == config.channels.log.suspend)
                        confirmationMessage.edit("Overwritten")
                        confirmationMessage.reactions.removeAll()
                        var suspendEmbed = new Discord.MessageEmbed()
                            .setColor("#ff1212")
                            .setTitle("Suspension Info")
                            .setDescription(`The suspension is for ${days} days ${hours} hours ${minutes} minutes.`)
                            .addField(`User's Server Name: \`${user.nickname}\``, `<@!${user.id}> (Username: ${user.user.username})`, true)
                            .addField(`Moderator's Server Name : \`${message.member.nickname}\``, `<@!${message.member.id}> (Username: ${message.author.username})`)
                            .addField(`Reason for suspension:`, reason)
                            .setFooter("Unsuspended at ")
                            .setTimestamp(currentTime + time)
                        let suspendMessage = await suspendChannel.send(suspendEmbed)
                        await user.send(suspendEmbed)

                        //Add to suspensions
                        suspensions.veteran[user.id] = {
                            "suspendlog": suspendMessage.id,
                            "startedat": currentTime,
                            "duration": time,
                            "endsat": currentTime + time
                        }
                        fs.writeFileSync("suspensions.json", JSON.stringify(suspensions))
                        //Timeout for unsuspend
                        setTimeout(async () => {
                            delete suspensions.veteran[user.id]
                            fs.writeFileSync("suspensions.json", JSON.stringify(suspensions))
                            suspendEmbed
                                .setColor("#41f230")
                                .setDescription("Unsuspended")
                            await suspendMessage.edit(suspendEmbed)
                            await user.roles.add(config.roles.general.vetraider)
                            await user.roles.remove(config.roles.general.vetsuspended)
                            await user.send("You have been unsuspended.")
                        }, time)
                    } else {
                        await confirmationMessage.edit("Override Cancelled.")
                    }
                })
                .catch(async c => {
                    await confirmationMessage.edit("Override Cancelled.")
                })
        } else {
            return message.channel.send(`<@!${user.id}> has already been veteran suspended. Unfortunately, it was from another bot so I cannot override.`)
        }


    } else {
        return message.channel.send(`<@!${user.id}> does not have the veteran raider role.`)
    }

}