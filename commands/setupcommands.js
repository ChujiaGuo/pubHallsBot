const fs = require('fs')


exports.run = async (client, message, args, Discord, sudo = false) => {
    //Permission Check
    try {

        //Define Basic Variables
        var commands = JSON.parse(fs.readFileSync('commands.json'))
        var currentLocation = commands.settings
        var currentPath = 'commands.settings';

        //Setup the beginning
        var commandsString = "You have begun the setup process.\nWhile here, you have access to following commands:\n\n`move (mv)` -> Allows you to move to a new part of the config file\nExample: `mv addalt` will take you to the addalt object (command aliases work)\n\n`set` -> Sets a variable\nExample:\n`set enabled true` will set the a command to enabled, while `set enabled none` will wipe the enabled setting (and turn it off)\n\n`back` -> Takes you back one step\nExample: Using `back` from `commands.settings.addalt` will take you to `commands.settings`\n\n`close` -> Closes the setup\n\nAll changes will be applied immediatlely once you close the setup."
        var commandsEmbed = new Discord.MessageEmbed()
            .setColor("#30ffea")
            .setAuthor(`Setup Started By: ${message.member.displayName}`, message.author.avatarURL())
            .setDescription(commandsString)

        var commandsMessage = await message.channel.send(commandsEmbed)

        //Interactive part
        var descriptionString = `${currentPath}\n\n`
        //Make the display string
        for (var i in currentLocation) {
            if (typeof currentLocation[i] == "object") {
                descriptionString += `\`${i}\` = \`{Object}\`\n\n`
            } else if (typeof currentLocation[i] == "string" || typeof currentLocation[i] == "number") {
                if (i != 'auth' && i != 'dev') {
                    descriptionString += `\`${i}\` = \`${currentLocation[i]}\`\n\n`
                }
            }
        }

        var displayEmbed = new Discord.MessageEmbed()
            .setColor("#30ffea")
            .setAuthor("Current Path:")
            .setDescription(descriptionString)

        var displayMessage = await message.channel.send(displayEmbed)

        //Begin Operations
        const filter = m => m.author.id == message.author.id
        const messageCollector = displayMessage.channel.createMessageCollector(filter)
        var changes = []

        messageCollector.on('collect', async m => {
            displayEmbed.spliceFields(0, 1)
            await displayMessage.edit(displayEmbed)
            let args = m.content.toLowerCase().split(' ')
            await m.delete()

            let cmd = args.shift()
            cmd = cmds[cmd] || cmd
            args[0] = commands.aliases[args[0]] || args[0]
            switch (cmd) {
                case 'move':
                    if (currentLocation[args[0]] == undefined || typeof currentLocation[args[0]] != "object") {
                        displayEmbed.addField("Error:", `${args[0]} is not a valid directory.`)
                        await displayMessage.edit(displayEmbed)
                    } else {
                        currentPath = currentPath + '.' + args[0]
                        try {
                            eval('currentLocation =' + currentPath)
                        } catch (e) {
                            return console.log(e)
                        }
                        //Editing the display
                        var descriptionString = `${currentPath}\n\n`
                        for (var i in currentLocation) {
                            if (typeof currentLocation[i] == "object") {
                                descriptionString += `\`${i}\` = \`{Object}\`\n\n`
                            } else if (typeof currentLocation[i] == "string" || typeof currentLocation[i] == "number") {
                                if (i != 'auth' && i != 'dev') {
                                    if (i == "permsint") {
                                        if (currentLocation[i] == "0") {
                                            descriptionString += `\`${i}\` = @everyone\`${currentLocation[i]}\`\n\n`
                                        } else {
                                            descriptionString += `\`${i}\` = <@&${currentLocation[i]}>\`${currentLocation[i]}\`\n\n`
                                        }
                                    } else {
                                        descriptionString += `\`${i}\` = \`${currentLocation[i]}\`\n\n`
                                    }
                                }
                            }
                        }
                        displayEmbed.setDescription(descriptionString)
                        await displayMessage.edit(displayEmbed)
                    }
                    break
                case 'back':
                    if (!currentPath.includes(".")) {
                        displayEmbed.addField("Error:", `You cannot move back further.`)
                        await displayMessage.edit(displayEmbed)
                    } else {
                        currentPath = currentPath.split('.').slice(0, -1).join('.')
                        try {
                            eval('currentLocation =' + currentPath)
                        } catch (e) {
                            return console.log(e)
                        }
                        //Editing the display
                        var descriptionString = `${currentPath}\n\n`
                        for (var i in currentLocation) {
                            if (typeof currentLocation[i] == "object") {
                                descriptionString += `\`${i}\` = \`{Object}\`\n\n`
                            } else if (typeof currentLocation[i] == "string") {
                                if (i != 'auth' && i != 'dev') {
                                    if (i == "permsint") {
                                        if (currentLocation[i] == "0") {
                                            descriptionString += `\`${i}\` = @everyone\`${currentLocation[i]}\`\n\n`
                                        } else {
                                            descriptionString += `\`${i}\` = <@&${currentLocation[i]}>\`${currentLocation[i]}\`\n\n`
                                        }
                                    } else {
                                        descriptionString += `\`${i}\` = \`${currentLocation[i]}\`\n\n`
                                    }
                                }
                            }
                        }
                        displayEmbed.setDescription(descriptionString)
                        await displayMessage.edit(displayEmbed)
                    }
                    break
                case 'set':
                    if (args[1].toLowerCase() == "none") {
                        args[1] = ""
                    }
                    if (args.length < 2) {
                        displayEmbed.addField("Error:", `You are missing arguments.`)
                        await displayMessage.edit(displayEmbed)
                    } else if (currentLocation[args[0]] == undefined || typeof currentLocation[args[0]] == "object") {
                        displayEmbed.addField("Error:", `You cannot set ${args[0]}.`)
                        await displayMessage.edit(displayEmbed)
                    } else {
                        try {
                            eval(currentPath + `["${args[0]}"]="${args[1]}"`)
                            eval('currentLocation =' + currentPath)
                            changes.push(`${m.content} at ${currentPath}\n`)
                        } catch (e) {
                            console.log(e)
                            console.log(currentPath)
                            return console.log(e)
                        }
                        var descriptionString = `${currentPath}\n\n`
                        for (var i in currentLocation) {
                            if (typeof currentLocation[i] == "object") {
                                descriptionString += `\`${i}\` = \`{Object}\`\n\n`
                            } else if (typeof currentLocation[i] == "string" || typeof currentLocation[i] == "number") {
                                if (i != 'auth' && i != 'dev') {
                                    if (i == "permsint") {
                                        if (currentLocation[i] == "0") {
                                            descriptionString += `\`${i}\` = @everyone\`${currentLocation[i]}\`\n\n`
                                        } else {
                                            descriptionString += `\`${i}\` = <@&${currentLocation[i]}>\`${currentLocation[i]}\`\n\n`
                                        }
                                    } else {
                                        descriptionString += `\`${i}\` = \`${currentLocation[i]}\`\n\n`
                                    }
                                }
                            }
                        }
                        displayEmbed.setDescription(descriptionString)
                        await displayMessage.edit(displayEmbed)
                    }
                    break
                case 'close':
                    fs.writeFileSync('commands.json', JSON.stringify(commands))
                    messageCollector.stop()
                    await displayMessage.delete()
                    commandsEmbed.setDescription("The setup has been stopped. The changes should take affect immediately.")
                    await commandsMessage.edit(commandsEmbed)
                    let changesEmbed = new Discord.MessageEmbed()
                        .setColor("#30ffea")
                        .setAuthor(`Changes made:`)
                        .setDescription(`\`\`\`${changes.join("\n")} \`\`\``)
                        .setTimestamp()
                        .setFooter(`Setup completed by ${message.member.displayName} at `)
                    await message.channel.send(changesEmbed)
                    break
                default:
                    displayEmbed.addField("Error:", "Command Not Found")
                    await displayMessage.edit(displayEmbed)
            }
        })
    }
    catch (e) {
        console.log(e)
        let owner = await client.users.fetch(JSON.parse(fs.readFileSync('commands.json')).dev)
        var errorEmbed = new Discord.MessageEmbed()
            .setColor("#ff1212")
            .setTitle("Error")
            .setDescription(`Error Processing: \`setup\`\nError Message:\`\`\`${e.toString()}\`\`\`\From User: <@${message.author.id}>\nIn guild: \`${message.guild.name}\``)
        await owner.send(errorEmbed)
        owner.send()
    }
}
let cmds = {
    'mv': 'move',
    'aa': 'addalias'
}