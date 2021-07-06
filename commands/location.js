const fs = require('fs')

exports.run = async (client, message, args, Discord, sudo = false) => {
    var config = JSON.parse(fs.readFileSync(`./configs/${message.guild.id}.json`));
    try {
        var afk = JSON.parse(fs.readFileSync("afk.json"))
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
        if (!afk[origin].afk) {
            return message.channel.send("There is no AFK Check up at this time.")
        }
        


        var newLocation = args.join(' ')
        if(newLocation.length == 0){
            return message.channel.send("Please specify a location.")
        }
        afk[origin].location = newLocation
        fs.writeFileSync('afk.json', JSON.stringify(afk))
        afk[origin].earlyLocationIds = [... new Set(afk[origin].earlyLocationIds)]
        for (i in afk[origin].earlyLocationIds) {
            let member = await message.guild.members.fetch(afk[origin].earlyLocationIds[i])
            await member.send(`The RL has changed the location to:\n\`${newLocation}\``)
        }
        var infoMessage = await message.guild.channels.cache.find(c => c.id == config.channels.log.raid)
        var commandMessage
        try {
            commandMessage = await message.channel.messages.fetch(afk[origin].commandMessageId)
        } catch (e) {
            return message.channel.send(`The following error appeared when fetching the command message:\`\`\`${e}\`\`\``)
        }
        try {
            infoMessage = await infoMessage.messages.fetch(afk[origin].infoMessageId)
        } catch (e) {
            return message.channel.send(`The following error appeared when fetching the info message:\`\`\`${e}\`\`\``)
        }
        var embed = commandMessage.embeds[0]
        embed.spliceFields(0, 1, { value: newLocation, name: 'Location:', inline: false })
        await commandMessage.edit(embed)
        await infoMessage.edit(embed)
        await message.channel.send(`Location changed to: \`${newLocation}\``)
    }
    catch (e) {
        let owner = await client.users.fetch(config.dev)
        var errorEmbed = new Discord.MessageEmbed()
            .setColor("#ff1212")
            .setTitle("Error")
            .setDescription(`Error Processing: \`location\`\nError Message:\`\`\`${e.toString()}\`\`\`\From User: <@${message.author.id}>\nIn guild: \`${message.guild.name}\``)
        await owner.send(errorEmbed)
        owner.send()
    }
}