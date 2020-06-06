const fs = require('fs')

exports.run = async (client, message, args, Discord) => {
    var config = JSON.parse(fs.readFileSync("config.json"))
    var permcheck = require(`./permcheck.js`)
    try {
        var commands = JSON.parse(fs.readFileSync("commands.json"))
        if (args.length == 0) {
            let categories = [... new Set(Object.values(commands.settings).map(cmd => cmd.category))].sort()
            let sorted = {}
            for(var x in categories){
                let type = categories[x]
                sorted[type] = Object.entries(commands.settings).filter(cmd => cmd.length > 1 && cmd[1].category != undefined && cmd[1].category.toLowerCase() == type && cmd[1].enabled.toLowerCase() == "true")
                let allowedCommands = []
                for(var y in sorted[type]){   
                    let auth = await permcheck.run(client, message.member, sorted[type][y][1].permsint == "0"? message.guild.id:sorted[type][y][1].permsint)
                    if(auth){
                        allowedCommands.push(sorted[type][y])
                    }
                }
                sorted[type] = allowedCommands
            }
            var descriptionString = ""
            for(var x in sorted){
                descriptionString += `**__${x.charAt(0).toUpperCase() + x.substring(1)}__**:\`\`\`css\n${sorted[x].map(a => a[0]).join(", ").length == 0 ? "None":sorted[x].map(a => a[0]).join(", ")}\`\`\``
            }
            var commandsEmbed = new Discord.MessageEmbed()
                .setColor("#ff1212")
                .setTitle("Commands List")
                .setDescription(descriptionString)
                .setFooter(`Capitalization does not matter | () means required | [] means optional | / means either or\n\`<@!${client.user.id}> prefix\` to show prefix`)
            return message.channel.send(commandsEmbed)
        }
        var cmd = args.shift()
        cmd = commands.aliases[cmd] || cmd
        var returnEmbed = new Discord.MessageEmbed()
            .setColor("#ff1212")
            .setFooter(`Capitalization does not matter | () means required | [] means optional | / means either or\n\`<@!${client.user.id}> prefix\` to show prefix`)
        if (commands.help[cmd] == undefined) {
            returnEmbed.setDescription(`**Help Panel for: ${cmd.toLowerCase()}**\n\n` + "This command does not have a help panel. Please check your spelling.")
            return message.channel.send(returnEmbed)
        } else {
            returnEmbed.setDescription(`**Help Panel for: ${cmd.toLowerCase()}**\n\n` + commands.help[cmd] + ` ${Object.keys(commands.aliases).filter(c => commands.aliases[c] == cmd).join(", ")}\n\n**Minimum Role Required: **<@&${commands.settings[cmd].permsint == "0" ? message.guild.id : commands.settings[cmd].permsint}>\n\n**Command Status: **${commands.settings[cmd].enabled.toLowerCase() == "true" ? "Enabled" : "Disabled"}`)
            return message.channel.send(returnEmbed)
        }
    }
    catch (e) {
        console.log(e)
        let owner = await client.users.fetch(config.dev)
        var errorEmbed = new Discord.MessageEmbed()
            .setColor("#ff1212")
            .setTitle("Error")
            .setDescription(`Error Processing: \`commands\`\nError Message:\`\`\`${e.toString()}\`\`\`\From User: <@${message.author.id}>\nIn guild: \`${message.guild.name}\``)
        await owner.send(errorEmbed)
        owner.send()
    }
}