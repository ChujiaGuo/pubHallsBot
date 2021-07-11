const fs = require('fs')

exports.run = async (client, message, args, Discord, sudo = false) => {
    const config = JSON.parse(fs.readFileSync(`./configs/${message.guild.id}.json`));
    if (args.length == 0) {
        return message.channel.send(`Please use a valid role or it's appropriate abbriviation. Valid role identifiers are:\n${Object.keys(config.roles.staff).join(", ") + Object.keys(config.roles.general).join(", ")}`)
    }
    if (args[0].toLowerCase() == "roles") {
        let rolesArray = message.guild.roles.cache.map(r => r).sort((a, b) => b.position - a.position)
        let returnEmbed = new Discord.MessageEmbed()
            .setAuthor(`All roles in this gulid:`)
            .setDescription(rolesArray.join(", "))
            .setColor("#41f230")
        await message.channel.send(returnEmbed)
    }
    var invalidRoles = []
    for (var i in args) {
        let roleIdentifier = args[i].replace(/[_-]/gi, " ")
        let role = undefined;
        //Try by config
        if (config.roles.staff[roleIdentifier.toLowerCase()] != undefined && config.roles.staff[roleIdentifier.toLowerCase()].length > 0) {
            role = await message.guild.roles.cache.find(r => r.id == config.roles.staff[roleIdentifier.toLowerCase()])
        } else if (config.roles.general[roleIdentifier.toLowerCase()] != undefined && config.roles.general[roleIdentifier.toLowerCase()].length > 0) {
            role = await message.guild.roles.cache.find(r => r.id == config.roles.general[roleIdentifier.toLowerCase()])
        }
        //Try by id
        else if (message.guild.roles.cache.has(roleIdentifier)) {
            role = await message.guild.roles.cache.find(r => r.id == roleIdentifier)
        }
        //Try by name
        else if (message.guild.roles.cache.find(r => r.name.toLowerCase() == roleIdentifier.toLowerCase())) {
            role = message.guild.roles.cache.find(r => r.name.toLowerCase() == roleIdentifier.toLowerCase())
        }
        //Try by abbreviation
        else if (message.guild.roles.cache.find(r => abbv(r.name) == roleIdentifier.toLowerCase())) {
            role = message.guild.roles.cache.find(r => abbv(r.name) == roleIdentifier.toLowerCase())
        }
        else {
            invalidRoles.push(roleIdentifier)
        }
        if (role != undefined) {
            let userIdList = await role.members.map(m => `<@!${m.id}>`)
            let onlyRole = await role.members.filter(m => m.roles.highest == role).map(m => `<@!${m.id}>`)
            let otherRole = await role.members.filter(m => m.roles.highest != role).map(m => `<@!${m.id}>`)
            let returnEmbed = new Discord.MessageEmbed()
                .setAuthor(`People with ${role.name}:`)
                .setFooter(`There are ${userIdList.length} people with this role.`)
            if (userIdList.join(", ").length > 2048) {
                returnEmbed.setDescription("There are too many people with this role to list out.")
                    .setColor("#ff1212")
            } else {
                returnEmbed.setDescription(`The following people have ${role}, along with a higher role (${otherRole.length}):\n${otherRole.join(", ")}\n\n The following people have ${role} as their highest role (${onlyRole.length}):\n${onlyRole.join(", ")}`)
                    .setColor("#41f230")
            }
            message.channel.send(returnEmbed)
        }
    }
    if (invalidRoles.length > 0) {
        let returnEmbed = new Discord.MessageEmbed()
            .setAuthor(`Invalid Role Identifiers:`)
            .setDescription(`${invalidRoles.join(', ')}`)
            .setColor("#ff1212")
        message.channel.send(returnEmbed)
    }


    function abbv(string) {
        string = string.split(' ')
        string.forEach((s, i) => {
            string[i] = s.trim()[0].toLowerCase()
        })
        return string.join("")
    }
}