const fs = require('fs')

exports.run = async (client, message, args, Discord) => {
    try {
        var commands = JSON.parse(fs.readFileSync("commands.json"))
        if (args.length == 0) {
            var commandsEmbed = new Discord.MessageEmbed()
                .setColor("#ff1212")
                .setTitle("Commands List")
                .setDescription("**__General__**:```css\nreport, find```**__Raiding:__**\n```css\nafk, newafk, resetafk, clean, lock, unlock, bazaarparse, parsecharacters, parsemembers, location```\n**__Moderation:__**```css\nmanualverify, manualvetverify, suspend, vetsuspend, unsuspend, vetunsuspend, kick, addalt, changename```\n**__Restricted:__**```css\nsetup```")
                .setFooter(`Capitalization does not matter | () means required | [] means optional | / means either or\n\`<@!${client.user.id}> prefix\` to show prefix`)
            return message.channel.send(commandsEmbed)
        }
        var cmd = args.shift()
        cmd = commands.aliases[cmd] || cmd
        var returnEmbed = new Discord.MessageEmbed()
            .setColor("#ff1212")
            .setTitle(`Help Panel for: ${cmd.toLowerCase()}`)
            .setFooter(`Capitalization does not matter | () means required | [] means optional | / means either or\n\`<@!${client.user.id}> prefix\` to show prefix`)
        if (commands.help[cmd] == undefined) {
            returnEmbed.setDescription("This command does not have a help panel. Please check your spelling.")
            return message.channel.send(returnEmbed)
        } else {
            returnEmbed.setDescription(commands.help[cmd])
            .addField("Minimum Role Required:", `<@&${commands.settings[cmd].permsint=="0"?message.guild.id:commands.settings[cmd].permsint}>`)
            return message.channel.send(returnEmbed)
        }
    }
    catch (e) {
        let owner = await client.users.fetch(config.dev)
        var errorEmbed = new Discord.MessageEmbed()
            .setColor("#ff1212")
            .setTitle("Error")
            .setDescription(`Error Processing: \`commands\`\nError Message:\`\`\`${e.toString()}\`\`\`\From User: <@${message.author.id}>\nIn guild: \`${message.guild.name}\``)
        await owner.send(errorEmbed)
        owner.send()
    }
}