const fs = require("fs")

exports.run = async (client, message, args, Discord, sudo = false) => {
    const config = JSON.parse(fs.readFileSync("config.json"))
    try {
        await message.delete()
    } catch (e) { return message.channel.send(e) }
    //Fetch request channel
    let requestChannel = await message.guild.channels.cache.find(c => c.id == config.channels.log.leaverequest)
    if (requestChannel == undefined) {
        return message.reply("The leave-request channel does not exist. Please get a mod to set it up.")
    }
    //Fetch normal staff updates
    let logChannelGeneral = await message.guild.channels.cache.find(c => c.id == config.channels.log.statusupdatesgeneral)
    if (logChannelGeneral == undefined) {
        return message.reply("The staff-updates channel does not exist. Please get a mod to set it up.")
    }
    //Fetch mod staff updates
    let logChannelMod = await message.guild.channels.cache.find(c => c.id == config.channels.log.statusupdatesmod)
    if (logChannelMod == undefined) {
        return message.reply("The mod-based staff-updates channel does not exist. Please get a mod to set it up.")
    }

    let duration = await prompt("duration of your leave")
    let reason = await prompt("reason for leave")
    if (!duration || !reason) {
        return message.author.send("One or more of your responses were invalid.")
    }
    //Check if user is already on leave
    if (message.member.roles.cache.find(r => r.name.toLowerCase() == "leader on leave")) {
        return message.author.send("You are already on leave. Please talk to an HRL or Officer to extend it.")
    }

    //Check if duration is valid
    let date = new Date()
    duration = await toMilliseconds(duration)
    if (isNaN(duration) || duration == 0) {
        return message.author.send("Invalid duration. Request denied.")
    }

    //Create the Embed
    let requestEmbed = new Discord.MessageEmbed()
        .setColor("#30ffea")
        .setAuthor(`${message.member.nickname}(Username: ${message.author.username}#${message.author.discriminator}) is requesting to go on leave`)
        .setDescription(`User: <@!${message.member.id}>\nDuration: ${await toTimeString(duration)}\nReason: ${reason}\nStaff Roles: ${message.member.roles.cache.map(r => r).filter(r => r.position >= message.guild.roles.cache.get(config.roles.staff.eo).position).sort(function (a, b) { return b.position - a.position }).join(', ')}\nReact with ✅ to approve, ❌ to deny, and ❓ to prompt for more information.`)
        .setFooter(`Request made at `)
        .setTimestamp()
    let requestMessage = await requestChannel.send(requestEmbed)
    let requestObject = {
        "guildId": message.guild.id,
        "requestFrom": message.author.id,
        "requestMessage": requestMessage.id,
        "reason": reason,
        "duration": duration,
        "beginningAt": Date.now(),
        "endingAt": Date.now() + duration,
        "roles": message.member.roles.cache.map(r => r).filter(r => r.position >= message.guild.roles.cache.get(config.roles.staff.eo).position).map(r => `<@&${r.id}>`)
    }
    let currentleaverequests = JSON.parse(fs.readFileSync("currentleaverequests.json"))
    currentleaverequests[requestMessage.id] = requestObject
    fs.writeFileSync("currentleaverequests.json", JSON.stringify(currentleaverequests))
    await requestMessage.react("✅")
    await requestMessage.react("❌")
    await requestMessage.react("❓")

    async function prompt(item, custom = false) {
        try {
            if (!custom) {
                var promptMessage = await message.author.send(`Please enter the ${item}:`)
            } else {
                var promptMessage = await message.author.send(`${item}`)

            }
            let response;
            const filter = m => m.author.id == message.author.id
            let promptResponse = await promptMessage.channel.awaitMessages(filter, { max: 1, time: 15000 })
                .then(async m => {
                    m = m.map(a => a)[0]
                    if (m) {
                        response = m.content
                    }
                })
            return response
        } catch (e) {
            return e
        }
    }
    async function toMilliseconds(time) {
        const validTypes = {
            "d": 86400000,
            "w": 604800000,
            "s": 1000
        }
        var total = 0
        let invalid = []
        time = time.replace(/[^\w]/gi, "")
        let durations = time.match(/[a-z]/gi)
        for (var i in durations) {
            let type = durations[i]
            let amount = time.substring(0, time.indexOf(type))
            time = time.substring(time.indexOf(type) + 1)
            if (validTypes[type.toLowerCase()] == undefined) {
                invalid.push(type.toLowerCase())
            } else {
                total += validTypes[type.toLowerCase()] * parseInt(amount)
            }
        }
        if (invalid.length == 1) {
            await message.author.send(`${invalid.join(", ")} is an invalid duration.`)
        } else if (invalid.length >= 1) {
            await message.author.send(`${invalid.join(", ")} are invalid durations.`)
        }
        return total
    }
    async function toTimeString(time) {
        return `${Math.floor(time / 604800000)} Weeks ${Math.floor(time % 604800000) / 86400000} Days`
    }
}