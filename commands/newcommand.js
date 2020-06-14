const fs = require('fs')

exports.run = async (client, message, args, Discord, sudo = false) => {
    var commands = JSON.parse(fs.readFileSync("commands.json"))
    let command = args.shift() || await prompt("command")
    let category = args.shift() || await prompt("category")
    let description = args.shift() || await prompt("description")
    let role = args.shift() || await prompt("role id")
    let aliases = args.shift() || await prompt("aliases (separated by commas and no spaces, `None` if none)")
    aliases = aliases.split(",")
    aliases = aliases.map(a => a.trim())
    let example = args.shift() || await prompt("example (This would look something like this: `afk (channelNumber) (runType) (runLocation)`")
    let arguments = args.shift() || await prompt("arguments (separated by commas and no spaces, `none` if none)")
    arguments = arguments.split(",")
    arguments = arguments.map(a => a.trim())
    let argumentsString = ""
    for (var i in arguments) {
        let arg = arguments[i]
        let argDesc = await prompt(`Please describe ${arg}`, true)
        argumentsString += `\`${arg}\` = ${argDesc}\n`
    }
    let theoreticalEmbed = new Discord.MessageEmbed()
        .setColor("#ff1212")
        .setFooter(`Capitalization does not matter | () means required | [] means optional | / means either or\n\`<@!${client.user.id}> prefix\` to show prefix`)
        .setDescription(`**Help Panel for: ${command.toLowerCase()}**\n\n**Description:** ${description}\n\n**Usage: \`${example}\`**\n${argumentsString}\n**Aliases:** ${aliases}\n\n**Minimum Role Required:** <@&${role}>\n\nCommand Status: Enabled`)
    await message.channel.send("This is your theoretical help embed. Please confirm (y/n).", theoreticalEmbed)
    commands.settings[command] = {
        "enabled":"true",
        "permsint": role,
        "category": category
    }
    for(var a in aliases){
        commands.aliases[aliases[a]] = command
    }
    commands.help[command] = `**Help Panel for: ${command.toLowerCase()}**\n\n**Description:** ${description}\n\n**Usage: \`${example}\`**\n${argumentsString}\n**Aliases:**`
    

    async function prompt(item, custom = false) {
        if (!custom) {
            var promptMessage = await message.channel.send(`Please enter the ${item}:`)
        }else{
            var promptMessage = await message.channel.send(`${item}`)

        }
        let response;
        const filter = m => m.author.id == message.author.id
        let promptResponse = await promptMessage.channel.awaitMessages(filter, { max: 1, time: 15000 })
            .then(async m => {
                m = m.map(a => a)[0]
                response = m.content
            })
        return response
    }
}