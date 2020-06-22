const fs = require('fs')

exports.run = async (client, message, args, Discord, sudo = false) => {
    const config = JSON.parse(fs.readFileSync("config.json"))
    let eventRole = message.guild.roles.cache.get(config.roles.general.eventraider)
    let raiderRole = message.guild.roles.cache.get(config.roles.general.raider)
    let raiders = raiderRole.members.map(m => m.id)
    let eraiders = eventRole.members.map(e => e.id)
    if (!eventRole || !raiderRole) {
        return message.channel.send("One or the other role is undefined.")
    }
    let both = raiders.filter(m => eraiders.includes(m))
    both = [... new Set(both)].map(m => `<@!${m}>`)
    let duplicateEmbed = new Discord.MessageEmbed()
        .setColor(raiderRole.hexColor)
        .setDescription(`The following people have both ${eventRole} and ${raiderRole}:\n${both.join(", ")}`)
    await message.channel.send(duplicateEmbed)
}