const fs = require('fs')


exports.run = async (client, message, args, Discord, sudo = false) => {
    //Permission Check
    if (!sudo) {
        let commandFile = require(`./permcheck.js`);
        let auth = await commandFile.run(client, message.member, 100000000);
        if (!auth) {
            return message.channel.send("You do not have permission to use this command.")
        }
    }

    //Define Basic Variables
    var config = JSON.parse(fs.readFileSync('config.json'))
    var currentLocation = config
    var currentPath = 'config';

    //Setup the beginning
    var commandsString = "You have begun the setup process.\nWhile here, you have access to following commands:\n\n`move (mv)` -> Allows you to move to a new part of the config file\nExample: `mv channels` will take you to the channels object\n\n`set` -> Sets a variable\nExample:\n`set admin 123456789012345678` will set the admin role to 123456789012345678, while `set admin none` will wipe the admin role\n\n`back` -> Takes you back one step\nExample: Using `back` from `config.channels` will take you to `config`\n\n`close` -> Closes the setup\n\nAll changes will be applied once you close the setup. Once you are finished with the setup, run the restart command for the changes to take affect."
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

    messageCollector.on('collect', async m => {
        displayEmbed.spliceFields(0, 1)
        await displayMessage.edit(displayEmbed)
        let args = m.content.toLowerCase().split(' ')
        await m.delete()

        let cmd = args.shift()
        cmd = commands[cmd] || cmd
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
                        return message.channel.send(e)
                    }
                    //Editing the display
                    var descriptionString = `${currentPath}\n\n`
                    for (var i in currentLocation) {
                        if (typeof currentLocation[i] == "object") {
                            descriptionString += `\`${i}\` = \`{Object}\`\n\n`
                        } else if (typeof currentLocation[i] == "string" || typeof currentLocation[i] == "number") {
                            if (i != 'auth' && i != 'dev') {
                                descriptionString += `\`${i}\` = \`${currentLocation[i]}\`\n\n`
                            }
                        }
                    }
                    displayEmbed.setDescription(descriptionString)
                    await displayMessage.edit(displayEmbed)
                }
                break
            case 'back':
                if (currentPath == "config") {
                    displayEmbed.addField("Error:", `You cannot move back further.`)
                    await displayMessage.edit(displayEmbed)
                } else {
                    currentPath = currentPath.split('.').slice(0, -1).join('.')
                    try {
                        eval('currentLocation =' + currentPath)
                    } catch (e) {
                        return message.channel.send(e)
                    }
                    //Editing the display
                    var descriptionString = `${currentPath}\n\n`
                    for (var i in currentLocation) {
                        if (typeof currentLocation[i] == "object") {
                            descriptionString += `\`${i}\` = \`{Object}\`\n\n`
                        } else if (typeof currentLocation[i] == "string") {
                            if (i != 'auth' && i != 'dev') {
                                descriptionString += `\`${i}\` = \`${currentLocation[i]}\`\n\n`
                            }
                        }
                    }
                    displayEmbed.setDescription(descriptionString)
                    await displayMessage.edit(displayEmbed)
                }
                break
            case 'set':
                if(args[1].toLowerCase() == "none"){
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
                    } catch (e) {
                        console.log(e)
                        console.log(currentPath)
                        return message.channel.send(e)
                    }
                    var descriptionString = `${currentPath}\n\n`
                    for (var i in currentLocation) {
                        if (typeof currentLocation[i] == "object") {
                            descriptionString += `\`${i}\` = \`{Object}\`\n\n`
                        } else if (typeof currentLocation[i] == "string" || typeof currentLocation[i] == "number") {
                            if (i != 'auth' && i != 'dev') {
                                descriptionString += `\`${i}\` = \`${currentLocation[i]}\`\n\n`
                            }
                        }
                    }
                    displayEmbed.setDescription(descriptionString)
                    await displayMessage.edit(displayEmbed)
                }
                break
            case 'close':
                fs.writeFileSync('config.json', JSON.stringify(config))
                messageCollector.stop()
                await displayMessage.delete()
                commandsEmbed.setDescription("The setup has been stopped. Please run the restart command to activate the changes.")
                await commandsMessage.edit(commandsEmbed)
                break
            default:
                displayEmbed.addField("Error:", "Command Not Found")
                await displayMessage.edit(displayEmbed)
        }
    })
}
let commands = {
    'mv': 'move'
}