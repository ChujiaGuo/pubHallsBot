const fs = require('fs')

exports.run = async (client, message, args, Discord) => {
    const config = JSON.parse(fs.readFileSync('config.json'))[message.guild.id]
    var lockdownLogs = JSON.parse(fs.readFileSync('lockdownPerms.json'))

    return new Promise(async (resolve, reject) => {

        let channel = message.channel//Get channel permissions
        if (lockdownLogs[channel.id]) { //If channel currently exists in lockdown, remove lockdown
            try {
                await channel.overwritePermissions(lockdownLogs[channel.id], "Unlocking a channel") //Give back previous permissions
                delete lockdownLogs[channel.id] //Remove from logs
                fs.writeFileSync('lockdownPerms.json', JSON.stringify(lockdownLogs))
                let confirmationEmbed = new Discord.MessageEmbed()
                    .setColor("#30ffea")
                    .setAuthor("This channel has been unlocked.")
                message.channel.send(confirmationEmbed)
                resolve(true)
            } catch (e) {
                reject(false)
                await message.channel.send(`${channel} could not be locked down for the following reason:\n\`\`\`${e}\`\`\``)
            }

        } else { //Else add to lockdown
            try {
                let allPermissions = channel.permissionOverwrites // Get all channel permissions
                lockdownLogs[channel.id] = JSON.parse(JSON.stringify(allPermissions)) //Add permissions to logs

                //Remove "SEND_MESSAGES" permission from every role except higher ups
                let { hdev, hrl, officer, mod, admin } = config.roles.staff //Get higher up ids
                let higherUps = [hdev, hrl, officer, mod, admin]

                for (r of allPermissions) {
                    let permission = r[1]
                    if (!higherUps.includes(r[0])) {
                        allPermissions.set(r[0], {
                            id: r[0],
                            deny: "SEND_MESSAGES"
                        })
                    }else{
                        allPermissions.set(r[0], {
                            id: r[0],
                            allow: "SEND_MESSAGES"
                        })
                    }
                }
                allPermissions.set(client.user.id, {
                    id: client.user.id,
                    allow: "SEND_MESSAGES"
                })
                await channel.overwritePermissions(allPermissions)
                fs.writeFileSync('lockdownPerms.json', JSON.stringify(lockdownLogs))

                let confirmationEmbed = new Discord.MessageEmbed()
                    .setColor("#30ffea")
                    .setAuthor("This channel has been locked down.")
                message.channel.send(confirmationEmbed)
                resolve(true)

            } catch (e) {
                reject(false)
                await message.channel.send(`${channel} could not be locked down for the following reason:\n\`\`\`${e}\`\`\``)
            }
        }
    })

}