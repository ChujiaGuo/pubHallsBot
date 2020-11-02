const fs = require('fs')

exports.run = async (client, message, args, Discord, sudo = false) => {
    const config = JSON.parse(fs.readFileSync("config.json"))
    let eventRole = message.guild.roles.cache.get(config.roles.general.eventraider)
    let raiderRole = message.guild.roles.cache.get(config.roles.general.raider)
    let suspendedRole = message.guild.roles.cache.get(config.roles.general.tempsuspended)
    let permaSuspendedRole = message.guild.roles.cache.get(config.roles.general.permasuspended)
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
    if(suspendedRole){
        var noNicknameSuspended = suspendedRole.members.map(m => m).filter(m => m.nickname == undefined)
        let suspendedEmbed = new Discord.MessageEmbed()
            .setColor(suspendedRole.hexColor)
            .setDescription(`The following people have ${suspendedRole} but no nickname:\n${noNicknameSuspended.join(", ")}`)
        await message.channel.send(suspendedEmbed)
    }else{
        await message.channel.send(`The temporary suspended role is undefined.`)
    }
    if(permaSuspendedRole){
        var noNicknamePermaSuspended = permaSuspendedRole.members.map(m => m).filter(m => m.nickname == undefined)
        let permaSuspendedEmbed = new Discord.MessageEmbed()
            .setColor(permaSuspendedRole.hexColor)
            .setDescription(`The following people have ${permaSuspendedRole} but no nickname:\n${noNicknamePermaSuspended.join(", ")}`)
        await message.channel.send(permaSuspendedEmbed)
    }else{
        await message.channel.send(`The permanent suspended role is undefined.`)
    }
}