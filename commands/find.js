const fs = require('fs')
const { checkExpelled } = require('../helpers/sqlHelper')
const sqlHelper = require('../helpers/sqlHelper')

exports.run = async (client, message, args, Discord, sudo = false) => {
    var config = JSON.parse(fs.readFileSync(`./configs/${message.guild.id}.json`));
    try {
        if (args.length < 1) {
            return message.channel.send(`You are missing arguments. Expected 1, received ${args.length}.`)
        }
        var couldNotFind = []
        var expelled = []
        for (var i in args) {
            let returnEmbed = new Discord.MessageEmbed()
            let memberResolvable = args[i]
            let member

            //Retrieve Member
            if (isNaN(memberResolvable)) {
                if (isNaN(memberResolvable.slice(3, -1)) || memberResolvable.slice(3, -1).length == 0) {
                    //Get from nickname
                    try {
                        member = await message.guild.members.cache.find(m => m.nickname && m.nickname.toLowerCase().replace(/[^a-z|]/gi, '').split('|').includes(memberResolvable.toLowerCase()))
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
                    suspendedString += `<@&${config.roles.general.vetsuspended}>`
                }
                if (member.roles.cache.has(config.roles.general.tempsuspended)) {
                    suspendedString += `<@&${config.roles.general.tempsuspended}>`
                }
                if (member.roles.cache.has(config.roles.general.permasuspended)) {
                    suspendedString += `<@&${config.roles.general.permasuspended}>`
                }
                if (suspendedString.length == 0) {
                    suspendedString += "❌"
                }

                //Expulsions
                let expulsionsString = "";
                //Nicknames
                for (var n of member.displayName.toLowerCase().replace(/[^a-z|]/gi, "").split('|').concat(member.id)) {
                    if (await checkExpelled(n)) expulsionsString += `${n}: Expelled\n`
                }

                returnEmbed
                    .setDescription(`**[User RealmEye](https://www.realmeye.com/player/${member.displayName.toLowerCase().replace(/[^a-z|]/gi, "").split('|')[0]})** | **User tag:** <@!${member.id}>` +
                        `\n\n**Roles:** ${member.roles.cache.map(r => r).sort((a, b) => b.position - a.position).filter(r => r.id != message.guild.id).join(', ')}`)
                    .addFields(
                        { name: "Voice Channel:", value: `${(member.voice.channel) ? member.voice.channel : "None"}`, inline: true },
                        { name: "Suspended:", value: `${suspendedString}`, inline: true },
                        { name: "Expulsions:", value: expulsionsString || "None", inline: true }
                    )
                    .setColor("#30ffea")
                await message.channel.send(returnEmbed)
            } else {
                if (await sqlHelper.checkExpelled(args[i])) { expelled.push(args[i]) }
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
        if (expelled.length > 0) {
            let expelledEmbed = new Discord.MessageEmbed()
                .setDescription(`The following users are expelled:\n${expelled.join(", ")}`)
                .setColor("#ff1212")
            await message.channel.send(expelledEmbed)
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