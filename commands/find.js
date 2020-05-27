const fs = require('fs')

exports.run = async (client, message, args, Discord, sudo = false) => {
    var config = JSON.parse(fs.readFileSync('config.json'))
    try {
        if (args.length < 1) {
            return message.channel.send(`You are missing arguments. Expected 1, received ${args.length}.`)
        }
        var couldNotFind = []
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
                let suspendedString = "";
                if (member.roles.cache.has(config.roles.general.vetsuspended)) {
                    suspendedString += `\n<@&${config.roles.general.vetsuspended}>`
                }
                if (member.roles.cache.has(config.roles.general.tempsuspended)) {
                    suspendedString += `\n<@&${config.roles.general.tempsuspended}>`
                }
                if (member.roles.cache.has(config.roles.general.permasuspended)) {
                    suspendedString += `\n<@&${config.roles.general.permasuspended}>`
                }
                if (suspendedString.length == 0) {
                    suspendedString += "❌"
                } else {
                    suspendedString += "\n✅"
                }

                returnEmbed
                    .setDescription(`User: <@!${member.id}>`)
                    .addFields(
                        { name: "Highest Role:", value: `<@&${member.roles.highest.id}>`, inline: true },
                        { name: "Suspended?", value: suspendedString, inline: true },
                        { name: "Voice Channel:", value: (member.voice.channel) ? member.voice.channel : "None", inline: true },
                        { name: "Is Nitro?", value: (member.roles.cache.has(config.roles.general.nitro)) ? "✅" : "❌", inline: true },
                        { name: "Realmeye:", value: `https://www.realmeye.com/player/${member.displayName.toLowerCase().replace(/[^a-z|]/gi, "").split('|')[0]}`, inline: true },
                        { name: "Roles:", value: `${member.roles.cache.map(r => `<@&${r.id}>`).join(', ')}` }
                    )
                    .setColor("#41f230")
                await message.channel.send(returnEmbed)
            } else {
                couldNotFind.push(`[${args[i]}](https://www.realmeye.com/player/${args[i]})`)
            }
        }
        var returnEmbed = new Discord.MessageEmbed()
            .setColor("#ff1212")
        if (couldNotFind.length > 0) {
            if (couldNotFind.join(', ').length >= 2048) {
                if (couldNotFind.join(', ').length >= 4096) {
                    return message.channel.send("That is way too many people (There is a character limit of 2048 in the descriptions). Please split it up.")
                }
                let a1 = couldNotFind.slice(0, Math.floor(couldNotFind.length / 2))
                let a2 = couldNotFind.slice(Math.floor(couldNotFind.length / 2))
                returnEmbed.setDescription(`I could not find the following users:\n${a1.join(', ')}`)
                returnEmbed.spliceFields(0, 25)
                await message.channel.send(returnEmbed)
                returnEmbed.setDescription(`I could not find the following users:\n${a2.join(', ')}`)
                returnEmbed.spliceFields(0, 25)
                await message.channel.send(returnEmbed)
            } else {
                couldNotFind = couldNotFind.join(", ")
                returnEmbed.setDescription(`I could not find the following users:\n${couldNotFind}`)
                returnEmbed.spliceFields(0, 25)
                await message.channel.send(returnEmbed)
            }

        }
    }
    catch (e) {
        let owner = await client.users.fetch(config.dev)
        var errorEmbed = new Discord.MessageEmbed()
            .setColor("#ff1212")
            .setTitle("Error")
            .setDescription(`Error Processing: \`find\`\nError Message:\`\`\`${e.toString()}\`\`\`\From User: <@${message.author.id}>\nIn guild: \`${message.guild.name}\``)
        await owner.send(errorEmbed)
        owner.send()
    }
}