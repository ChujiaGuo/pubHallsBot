const fs = require('fs')

exports.run = async (client, message, args, Discord, sudo = false) => {
    const config = JSON.parse(fs.readFileSync('config.json'))
    if (args.length == 0) {
        return message.channel.send(`Please use a valid role or it's appropriate abbriviation. Valid role identifiers are:\n${Object.keys(config.roles.staff).join(", ") + Object.keys(config.roles.general).join(", ")}`)
    }
    if (args[0].toLowerCase() == "roles") {
        let rolesArray = message.guild.roles.cache.map(r => `<@&${r.id}>`)
        let returnEmbed = new Discord.MessageEmbed()
            .setAuthor(`All roles in this gulid:`)
            .setDescription(rolesArray.join(", "))
            .setColor("#41f230")
        await message.channel.send(returnEmbed)
    }
    var invalidRoles = []
    let allChannels = message.guild.channels.cache.map(c => c)
    let category = ["**Categories:**\n"].concat(allChannels.filter(c => c.type == "category").sort((a, b) => sortAlpha(a, b)))
    let text = ["**Text Channels:**\n"].concat(allChannels.filter(c => c.type == "text").sort((a, b) => sortAlpha(a, b)))
    let voice = ["**Voice Channels:**\n"].concat(allChannels.filter(c => c.type == "voice").sort((a, b) => sortAlpha(a, b)))
    allChannels = category.concat(text, voice)
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
            let roleId = role.id
            let roleName = role.name
            let roleMembers = role.members.size
            let roleHoist = role.hoist
            let createdDate = role.createdAt
            let roleColor = role.hexColor
            let rolePermissions = `\`${role.permissions.toArray().join(", ")}\``
            let channelBasedPermissionsString = ""
            for (var i in allChannels) {
                if (typeof allChannels[i] != "string") {
                    let channel = allChannels[i].permissionOverwrites.get(roleId)
                    if (channel) {
                        channelBasedPermissionsString += `${allChannels[i].name} =>\nChannel Type: ${allChannels[i].type}\nAllowed: \`${channel.allow.toArray().join(", ").length == 0 ? "None" : channel.allow.toArray().join(", ")}\`\nDenied: \`${channel.deny.toArray().join(", ").length == 0 ? "None" : channel.deny.toArray().join(", ")}\`\n\n`
                    }
                } else {
                    channelBasedPermissionsString += `${allChannels[i]}`
                }
            }
            let roleEmbed = new Discord.MessageEmbed()
                .setColor(roleColor)
                .setAuthor(`Information about ${roleName}`)
                .addFields([
                    { name: `Role Name:`, value: roleName, inline: true },
                    { name: `Role Id:`, value: `\`${roleId}\`\n<@&${roleId}>`, inline: true },
                    { name: `Role Color:`, value: roleColor, inline: true },
                    { name: `Role Members:`, value: roleMembers, inline: true },
                    { name: `Hoist Role:`, value: roleHoist, inline: true },
                    { name: `Date Created:`, value: createdDate, inline: true },
                    { name: `General Permissions:`, value: rolePermissions, inline: false }
                ])
            await message.channel.send(roleEmbed)
            let queryEmbed = new Discord.MessageEmbed()
                .setColor(roleColor)
                .setAuthor(`Show Channel Permissions for ${roleName}`)
                .setDescription(`If you want to show all channel based overwrites for <@&${roleId}>, react with ✅.\nIf you want to show a specific channel's permission overwrites, react with 🔍.\nIf you want to skip this, react with ❌`)
            let queryMessage = await message.channel.send(queryEmbed)
            await queryMessage.react("✅")
            await queryMessage.react("🔍")
            await queryMessage.react("❌")
            const queryFilter = (r, u) => !u.bot && u.id == message.author.id && ["✅", "🔍", "❌"].includes(r.emoji.name)
            let queryCollector = await queryMessage.awaitReactions(queryFilter, { max: 1, time: 15000 })
                .then(async r => {
                    if (r.size != 0) {
                        r = r.first()
                        r = r.emoji.name
                        if (r == "✅") {
                            while (channelBasedPermissionsString.length > 0) {
                                let string = channelBasedPermissionsString.substring(0, channelBasedPermissionsString.lastIndexOf("\n\n", 2000) + 2)
                                channelBasedPermissionsString = channelBasedPermissionsString.substring(channelBasedPermissionsString.lastIndexOf("\n\n", 2000) + 2)
                                let channelInfo = new Discord.MessageEmbed()
                                    .setColor(roleColor)
                                    .setAuthor(`Channel Permissions for ${roleName}`)
                                    .setDescription(string)
                                await message.channel.send(channelInfo)
                            }
                        } else if (r == "🔍") {
                            queryEmbed.setDescription("Please enter a channel name or id.")
                            await queryMessage.edit(queryEmbed)
                            let channelFilter = m => m.author.id == message.author.id
                            let channelCollector = await message.channel.awaitMessages(channelFilter, { max: 1, time: 15000 })
                                .then(async m => {
                                    try {
                                        await m.first().delete()
                                    } catch (e) { }
                                    var channelResolvable = m.first().content
                                    var channel = message.guild.channels.cache.find(c => c.id == channelResolvable.replace(/[^0-9]/gi, ""))
                                    if (channel == undefined) {
                                        channel = message.guild.channels.cache.find(c => c.name.replace(/[\s]/gi, "-").toLowerCase() == channelResolvable.replace(/[\s]/gi, "-").toLowerCase())
                                    }
                                    if (channel == undefined) {
                                        queryEmbed.setDescription(`${channelResolvable} is an invalid channel identifier.`)
                                        return queryMessage.edit(queryEmbed)
                                    }
                                    let channelPermissions = channel.permissionOverwrites.get(roleId)
                                    if (channelPermissions) {
                                        channelPermissions = `${channel.name} =>\nChannel Type: ${channel.type}\nAllowed: \`${channelPermissions.allow.toArray().join(", ").length == 0 ? "None" : channelPermissions.allow.toArray().join(", ")}\`\nDenied: \`${channelPermissions.deny.toArray().join(", ").length == 0 ? "None" : channelPermissions.deny.toArray().join(", ")}\`\n\n`
                                    }
                                    let channelInfo = new Discord.MessageEmbed()
                                        .setColor(roleColor)
                                        .setAuthor(`Channel Permissions for ${roleName}`)
                                        .setDescription(channelPermissions)
                                    try {
                                        await queryMessage.reactions.removeAll()
                                    } catch (e) { }
                                    return queryMessage.edit(channelInfo)
                                })
                        } else {
                            queryEmbed.setDescription("Canceled")
                            await queryMessage.edit(queryEmbed)
                        }

                    } else {
                        queryEmbed.setDescription("Canceled due to time.")
                        await queryMessage.edit(queryEmbed)
                    }

                })


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
    function sortAlpha(a, b) {
        a = a.name.toLowerCase()
        b = b.name.toLowerCase()
        if (a < b) {
            return -1
        }
        if (b > a) {
            return 1
        }
        return 0
    }
}