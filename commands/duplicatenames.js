const fs = require('fs')

exports.run = async (client, message, args, Discord, sudo = false) => {
    return new Promise(async (resolve, reject) => {
        try {
            const config = JSON.parse(fs.readFileSync(`./configs/${message.guild.id}.json`));
            let allMembers = message.guild.members.cache.filter(u => u.nickname && (u.roles.cache.has(config.roles.general.raider) || u.roles.cache.has(config.roles.general.eventraider))).map(m => m)
            var nameCounter = {}
            var duplicatenames = []
            var duplicateMembers = []
            for (var i in allMembers) {
                let member = allMembers[i]
                let memberNames = await getNames(member)
                for (var n in memberNames) {
                    let name = memberNames[n]
                    if (nameCounter[name]) {
                        nameCounter[name] = nameCounter[name] + 1
                    } else {
                        nameCounter[name] = 1
                    }
                }
            }
            for (var n in nameCounter) {
                if (nameCounter[n] > 1) {
                    duplicatenames.push(n)
                }
            }
            for (var n in duplicatenames) {
                let members = allMembers.filter(m => m.nickname.replace(/[^a-z|]/gi, "").toLowerCase().split("|").includes(duplicatenames[n].toLowerCase()))
                duplicateMembers = duplicateMembers.concat(members)
            }
            let duplicateEmbed = new Discord.MessageEmbed()
                .setColor("#30ffea")
                .setDescription(`The following people have duplicate names and have either the <@&${config.roles.general.raider}> role or the <@&${config.roles.general.eventraider}> role:\n${duplicateMembers.join(", ")}`)
            await message.channel.send(duplicateEmbed)
            resolve(true)
        } catch (e) {
            reject(e)
        }
    })

    async function getNames(member) {
        if (member.nickname) {
            return member.nickname.replace(/[^a-z|]/gi, "").toLowerCase().split("|")
        }
    }
}