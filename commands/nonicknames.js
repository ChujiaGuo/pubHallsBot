const fs = require('fs')

exports.run = async (client, message, args, Discord, sudo = false) => {
    const config = JSON.parse(fs.readFileSync("config.json"))
    let eventRole = message.guild.roles.cache.get(config.roles.general.eventraider)
    let raiderRole = message.guild.roles.cache.get(config.roles.general.raider)
    if (eventRole) {
        var noNicknameEvent = eventRole.members.map(m => m).filter(m => m.nickname == undefined)
        let eventEmbed = new Discord.MessageEmbed()
            .setColor(eventRole.hexColor)
            .setDescription(`The following people have ${eventRole} but no nickname:\n${noNicknameEvent.join(", ")}`)
        await message.channel.send(eventEmbed)
    }else{
        await message.channel.send(`The event raider role is undefined.`)
    }
    if (raiderRole) {
        var noNicknameRaider = raiderRole.members.map(m => m).filter(m => m.nickname == undefined)
        let raiderEmbed = new Discord.MessageEmbed()
            .setColor(raiderRole.hexColor)
            .setDescription(`The following people have ${raiderRole} but no nickname:\n${noNicknameRaider.join(", ")}`)
        await message.channel.send(raiderEmbed)
    }else{
        await message.channel.send(`The verified raider role is undefined.`)
    }
}