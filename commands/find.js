const fs = require('fs')

exports.run = async (client, message, args, Discord, sudo = false) => {
    var config = JSON.parse(fs.readFileSync('config.json'))
    //Permissions
    if (!sudo) {
        let commandFile = require(`./permcheck.js`);
        var auth = await commandFile.run(client, message.member, 100)
        if (!auth) {
            return message.channel.send("You do not have permission to use this command.")
        }
    }

    if (args.length < 1) {
        return message.channel.send(`You are missing arguments. Expected 1, received ${args.length}.`)
    }
    for (var i in args) {
        let returnEmbed = new Discord.MessageEmbed()
        let memberResolvable = args[i]
        let member

        //Retrieve Member
        if (isNaN(memberResolvable)) {
            if (isNaN(memberResolvable.slice(3, -1)) || memberResolvable.slice(3, -1).length == 0) {
                //Get from nickname
                try {
                    member = await message.guild.members.cache.find(m => m.displayName.toLowerCase().replace(/[^a-z|]/gi, '').split('|').includes(memberResolvable.toLowerCase()))
                } catch (e) {
                    returnEmbed.setColor("#ff1212")
                    returnEmbed.setDescription(`I could not find a user with the nickname of: ${args[i]}`)
                    returnEmbed.addField("Error:", e.toString())
                }
            } else {
                //Get from mention
                try {
                    member = await message.guild.members.fetch(memberResolvable.slice(3, -1))
                } catch (e) {
                    returnEmbed.setColor("#ff1212")
                    returnEmbed.setDescription(`I could not find a user with the mention of: <@!${args[i]}>`)
                    returnEmbed.addField("Error:", e.toString())
                }
            }
        } else {
            //Get from id
            try {
                member = await message.guild.members.fetch(memberResolvable)
            } catch (e) {
                returnEmbed.setColor("#ff1212")
                returnEmbed.setDescription(`I could not find a user with the id of: \`${args[i]}\``)
                returnEmbed.addField("Error:", e.toString())
            }
        }

        if (member != undefined) {
            //Suspended Anywhere?
            let suspendedString = "✅";
            if (member.roles.cache.has(config.roles.general.vetsuspended)) {
                suspendedString += `\n<@&${config.roles.general.vetsuspended}>`
            }
            if (member.roles.cache.has(config.roles.general.tempsuspended)) {
                suspendedString += `\n<@&${config.roles.general.tempsuspended}>`
            }
            if (member.roles.cache.has(config.roles.general.permasuspended)) {
                suspendedString += `\n<@&${config.roles.general.permasuspended}>`
            }
            if (suspendedString.length == 1) {
                suspendedString = "❌"
            }

            returnEmbed
                .setDescription(`User: <@!${member.id}>`)
                .addFields(
                    { name: "Highest Role:", value: `<@&${member.roles.highest.id}>`, inline: true },
                    { name: "Suspended?", value: suspendedString, inline: true },
                    { name: "Voice Channel:", value: (member.voice.channel) ? member.voice.channel : "None", inline: true }

                )
                .setColor("#41f230")
        } else {
            returnEmbed.setColor("#ff1212")
            returnEmbed.setDescription(`I could not find a user with the nickname: ${args[i]}`)
        }
        await message.channel.send(returnEmbed)
    }

}