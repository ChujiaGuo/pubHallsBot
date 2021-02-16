const fs = require('fs')

exports.run = async (client, message, args, Discord, sudo = false) => {
    var config = JSON.parse(fs.readFileSync("config.json"))[message.guild.id]
    try {
        //Check Perms
        if (message.channel.type != 'text') {
            return message.channel.send("You cannot use this command here.")
        }
        var origin = 0;
        //Check origin channel
        if (message.channel.id == config.channels.veteran.control.command) {
            origin = 100
        } else if (message.channel.id == config.channels.normal.control.command) {
            origin = 10
        } else if (message.channel.id == config.channels.event.control.command) {
            origin = 1
        } else {
            return message.channel.send("You cannot use this command here.")
        }

        //Argument Parsing
        //Channel Number
        var channelNumber = args.shift()
        var statusChannel;
        if (isNaN(channelNumber)) {
            return message.channel.send(`\`${channelNumber}\` is an invalid channel number.`)
        }
        //Channel Available?
        if (origin == 100) {
            if (config.channels.veteran.raiding[channelNumber] == undefined) {
                return message.channel.send(`\`${channelNumber}\` is an invalid channel number.`)
            }
            if (config.channels.veteran.raiding[channelNumber].length == 0) {
                return message.channel.send(`Raiding Channel \`${channelNumber}\` has not been configured. Please have an admin add it using setup.`)
            } else {
                channelNumber = config.channels.veteran.raiding[channelNumber]
                statusChannel = config.channels.veteran.control.status
            }
        } else if (origin == 10) {
            if (config.channels.normal.raiding[channelNumber] == undefined) {
                return message.channel.send(`\`${channelNumber}\` is an invalid channel number.`)
            }
            if (config.channels.normal.raiding[channelNumber].length == 0) {
                return message.channel.send(`Raiding Channel \`${channelNumber}\` has not been configured. Please have an admin add it using setup.`)
            } else {
                channelNumber = config.channels.normal.raiding[channelNumber]
                statusChannel = config.channels.normal.control.status
            }
        } else if (origin = 1) {
            if (config.channels.event.raiding[channelNumber] == undefined) {
                return message.channel.send(`\`${channelNumber}\` is an invalid channel number.`)
            }
            if (config.channels.event.raiding[channelNumber].length == 0) {
                return message.channel.send(`Raiding Channel \`${channelNumber}\` has not been configured. Please have an admin add it using setup.`)
            }
            else {
                channelNumber = config.channels.event.raiding[channelNumber]
                statusChannel = config.channels.event.control.status
            }
        } else {
            return message.channel.send("You should not be here.")
        }
        //Fetch channel
        var raidingChannel = await message.guild.channels.cache.find(c => c.id == channelNumber)
        if (!raidingChannel.name.includes(" <-- Join!")) {
            await raidingChannel.setName(raidingChannel.name + " <-- Join!")
        }
        await raidingChannel.updateOverwrite(config.roles.general.raider, {
            'CONNECT': true
        })
        await raidingChannel.setUserLimit(null)
        return message.channel.send(`<@!${message.author.id}> Done!`)
    }
    catch (e) {
        let owner = await client.users.fetch(config.dev)
        var errorEmbed = new Discord.MessageEmbed()
            .setColor("#ff1212")
            .setTitle("Error")
            .setDescription(`Error Processing: \`unlock\`\nError Message:\`\`\`${e.toString()}\`\`\`\From User: <@${message.author.id}>\nIn guild: \`${message.guild.name}\``)
        await owner.send(errorEmbed)
        owner.send()
    }
}