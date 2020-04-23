const fs = require('fs')

exports.run = async (client, message, args, Discord, sudo = false) => {
    var config = JSON.parse(fs.readFileSync('config.json'))
    var suspensions = JSON.parse(fs.readFileSync('suspensions.json'))
    var durations = {
        "d": 86400000,
        "h": 3600000,
        "m": 60000,
        "s": 1000
    }

    //Permissions
    if (!sudo) {
        let commandFile = require(`./permcheck.js`);
        var auth = await commandFile.run(client, message.member, 1000)
        if (!auth) {
            return message.channel.send("You do not have permission to use this command.")
        }
    }

    //Number of arguments
    if (args.length < 4) {
        return message.channel.send(`You are missing arguments. Expected 4, received ${args.length}.`)
    }
    //Get user
    var user = args.shift()
    if (isNaN(user)) {
        user = user.slice(3, -1)
    }
    try {
        user = await message.guild.members.fetch(user)
    } catch (e) {
        return message.channel.send("Invalid User")
    }
    //Check comparative user perms
    try {
        let other = user.roles.hoist.position
        let own = message.member.roles.hoist.position
        if (other >= own) {
            return message.channel.send("You may not suspend this user as their roles are equal or higher than yours.")
        }
    } catch (e) {

    }

    //Suspension Duration
    var length = args.shift()
    var duration = args.shift()
    if (!durations.hasOwnProperty(duration)) {
        return message.channel.send(`\`${duration}\` is not a valid length. Your options are the following: \`d\` for days, \`h\` for hours, \`m\` for minutes, \`s\` for seconds`)
    }
    var time = parseInt(length) * durations[duration]
    if (time >= 2 ** 32) {
        return message.channel.send(`${time} does not fit into a 32-bit signed integer. Please choose a smaller time.`)
    }
    var days, hours, minutes;
    days = Math.floor(time / 86400000)
    hours = Math.floor((time - days * 86400000) / 3600000)
    minutes = Math.round((time - days * 86400000 - hours * 3600000) / 60000)
    //Suspension Reason
    var reason = args.join(' ')

    //Begin suspension
    var userRoles = await user.roles.cache.map(r => r.id)
    var nitro = false;
    if (userRoles.includes(config.roles.general.nitro)) {
        userRoles.splice(userRoles.indexOf(config.roles.general.nitro), 1)
        nitro = true;
    }
    suspensions = JSON.parse(fs.readFileSync('suspensions.json'))
    if (!userRoles.includes(config.roles.general.tempsuspended) && !userRoles.includes(config.roles.general.permasuspended)) {
        //User is not suspended in any way
        var currentTime = Date.now()
        var suspendChannel = await message.guild.channels.cache.find(c => c.id == config.channels.log.suspend)

        await user.roles.remove(userRoles)
        await user.roles.add(config.roles.general.tempsuspended)
        let suspendEmbed = new Discord.MessageEmbed()
            .setColor("#ff1212")
            .setTitle("Suspension Info")
            .setDescription(`The suspension is for ${days} days ${hours} hours ${minutes} minutes.`)
            .addField(`User's Server Name: \`${user.nickname}\``, `<@!${user.id}> (Username: ${user.user.username})`, true)
            .addField(`Moderator's Server Name : \`${message.member.nickname}\``, `<@!${message.member.id}> (Username: ${message.author.username})`)
            .addField(`Reason for suspension:`, reason)
            .setFooter("Unsuspended at ")
            .setTimestamp(currentTime + time)
        let logMessage = await suspendChannel.send(suspendEmbed)
        await user.send(suspendEmbed)


        suspensions.normal[user.id] = {
            "suspendMessageId": logMessage.id,
            "suspendMessageEmbed": suspendEmbed,
            "startedAt": currentTime,
            "duration": time,
            "endsat": currentTime + time,
            "roles": userRoles,
            "guildid": message.guild.id
        }
        fs.writeFileSync("suspensions.json", JSON.stringify(suspensions))
        setTimeout(async () => {
            if (suspensions.normal[user.id]) {
                await user.roles.remove(config.roles.general.tempsuspended)
                await user.roles.add(userRoles)
                suspensions = JSON.parse(fs.readFileSync('suspensions.json'))
                delete suspensions.normal[user.id]
                fs.writeFileSync("suspensions.json", JSON.stringify(suspensions))
                suspendEmbed
                    .setColor("#41f230")
                    .setDescription("Unsuspended")
                await logMessage.edit(suspendEmbed)
                await user.send("You have been unsuspended.")
            }
        }, time)
        await message.channel.send(`<@!${user.id}> has been suspended.`)

    } else if (userRoles.includes(config.roles.general.permasuspended)) {
        //User is permasuspended
        return message.channel.send("This user is already permanently suspended.")
    } else if (userRoles.includes(config.roles.general.tempsuspended)) {
        //User is currently suspended
        if (suspensions.normal[user.id]) {
            //User is currently suspended with this bot
            let confirmationMessage = await message.channel.send(`<@!${user.id}> has already been suspended. Would you like to override?`)
            const filter = (reaction, user) => !user.bot && (reaction.emoji.name === '✅' || reaction.emoji.name == "❌") && user.id === message.author.id
            await confirmationMessage.react("✅")
            await confirmationMessage.react("❌")
            confirmationMessage.awaitReactions(filter, { time: 15000, errors: ['time'], max: 1 })
                .then(async m => {
                    var name = m.map(m => m.emoji)[0].name
                    if (name == "✅") {
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
                        let logMessage = await suspendChannel.send(suspendEmbed)
                        await user.send(suspendEmbed)
                        userRoles = suspensions.normal[user.id].roles
                        suspensions.normal[user.id] = {
                            "suspendMessageId": logMessage.id,
                            "suspendMessageEmbed": suspendEmbed,
                            "startedAt": currentTime,
                            "duration": time,
                            "endsAt": currentTime + time,
                            "roles": userRoles,
                            "guildid": message.guild.id
                        }
                        fs.writeFileSync("suspensions.json", JSON.stringify(suspensions))

                        setTimeout(async () => {
                            if (suspensions.normal[user.id]) {
                                await user.roles.remove(config.roles.general.tempsuspended)
                                await user.roles.add(userRoles)
                                suspensions = JSON.parse(fs.readFileSync('suspensions.json'))
                                delete suspensions.normal[user.id]
                                fs.writeFileSync("suspensions.json", JSON.stringify(suspensions))
                                suspendEmbed
                                    .setColor("#41f230")
                                    .setDescription("Unsuspended")
                                await logMessage.edit(suspendEmbed)
                                await user.send("You have been unsuspended.")
                            }
                        }, time)

                    } else {
                        await confirmationMessage.edit("Override Cancelled.")
                        await confirmationMessage.reactions.removeAll()
                    }
                })
                .catch(async c => {
                    console.log(c)
                    await confirmationMessage.edit("Override Cancelled.")
                    await confirmationMessage.reactions.removeAll()
                })
        } else {
            //User is suspended using another bot
            return message.channel.send("This user has been suspended already. Unfortunately, it was with another bot so overriding is unavailable.")
        }
    }
}