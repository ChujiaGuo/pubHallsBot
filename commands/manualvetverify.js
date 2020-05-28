const fs = require('fs')

exports.run = async (client, message, args, Discord, sudo = false) => {
    try {
        var config = JSON.parse(fs.readFileSync('config.json'))
        var user = args.shift()
        if (isNaN(user)) {
            if (isNaN(user.slice(3, -1)) || user.slice(3, -1).length == 0) {
                //Get from nickname
                try {
                    user = await message.guild.members.cache.find(m => m.displayName.toLowerCase().replace(/[^a-z|]/gi, '').split('|').includes(user.toLowerCase()))
                } catch (e) {
                    returnEmbed.setColor("#ff1212")
                    returnEmbed.setDescription(`I could not find a user with the nickname of: ${args[i]}`)
                    returnEmbed.addField("Error:", e.toString())
                }
            } else {
                //Get from mention
                try {
                    user = await message.guild.members.fetch(user.slice(3, -1))
                } catch (e) {
                    returnEmbed.setColor("#ff1212")
                    returnEmbed.setDescription(`I could not find a user with the mention of: <@!${args[i]}>`)
                    returnEmbed.addField("Error:", e.toString())
                }
            }
        } else {
            //Get from id
            try {
                user = await message.guild.members.fetch(user)
            } catch (e) {
                returnEmbed.setColor("#ff1212")
                returnEmbed.setDescription(`I could not find a user with the id of: \`${args[i]}\``)
                returnEmbed.addField("Error:", e.toString())
            }
        }
        if (user == undefined) {
            return message.channel.send("Invalid User")
        }
        try {
            await user.roles.add(config.roles.general.vetraider)
        } catch (e) {
            return message.channel.send(`Error: \`\`\`${e}\`\`\``)
        }
        let logChannel = message.guild.channels.cache.find(c => c.id == config.channels.log.mod)
        await logChannel.send(`<@!${user.id}> has been vet verified by <@!${message.author.id}>`)
        message.channel.send("Manual Veteran Verification Success")
    }
    catch (e) {
        let owner = await client.users.fetch(config.dev)
        var errorEmbed = new Discord.MessageEmbed()
            .setColor("#ff1212")
            .setTitle("Error")
            .setDescription(`Error Processing: \`manualvetverify\`\nError Message:\`\`\`${e.toString()}\`\`\`\From User: <@${message.author.id}>\nIn guild: \`${message.guild.name}\``)
        await owner.send(errorEmbed)
        owner.send()
    }
}