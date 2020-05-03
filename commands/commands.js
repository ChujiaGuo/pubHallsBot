const fs = require('fs')

exports.run = async (client, message, args, Discord) => {
    var commands = JSON.parse(fs.readFileSync("commands.json"))
    if (args.length == 0) {
        var commandsEmbed = new Discord.MessageEmbed()
            .setColor("#ff1212")
            .setTitle("Commands List")
            .setDescription("**__Raiding:__**\n```css\nafk, resetafk, clean, lock, unlock, bazaarparse, parsecharacters, parsemembers, location```\n**__Moderation:__**```css\nmanualverify, manualvetverify, suspend, vetsuspend, unsuspend, unvetsuspend, kick, addalt, changename```\n**__Restricted:__**```css\nsetup```")
        return message.channel.send(commandsEmbed)
    }
    var cmd = args.shift()
    cmd = commands.aliases[cmd] || cmd
    var returnEmbed = new Discord.MessageEmbed()
        .setColor("#ff1212")
        .setTitle(`Help Panel for: ${cmd.toLowerCase()}`)
        .setFooter("Capitalization does not matter | () means required | [] means optional | / means either or")
    if (commands.help[cmd] == undefined) {
        returnEmbed.setDescription("This command does not have a help panel. Please check your spelling.")
        return message.channel.send(returnEmbed)
    }else{
        returnEmbed.setDescription(commands.help[cmd])
        return message.channel.send(returnEmbed)
    }

}