const fs = require('fs')
const runTemplates = JSON.parse(fs.readFileSync("runTemplates.json"))
const config = JSON.parse(fs.readFileSync('config.json'))
const errorHelper = require('../helpers/errorHelper.js')

exports.run = async (client, message, args, Discord) => {
    let chosenTemplate = runTemplates[args[0]] || runTemplates[message.member.id]
    if (!chosenTemplate) return message.channel.send(`Invalid Template Identifier: ${args[0]}`)

    //Creating the Embed
    let templateEmbed = new Discord.MessageEmbed()
        .setColor(chosenTemplate.color)
        .setAuthor(`Headcount for: ${chosenTemplate.name}`)
        .setDescription(`**THIS IS NOT AN AFK CHECK**\n${chosenTemplate.description}\n\nIf you are willing to bring any of the following items or classes, please react accordingly.`)
        .setFooter(`Headcount started by: ${message.member.nickname}`)
        .setTimestamp()

    //Fetching Status Channel
    //Command Origin
    var origin =
        message.channel.id == config.channels.veteran.control.command ? 100 :
            message.channel.id == config.channels.normal.control.command ? 10 :
                message.channel.id == config.channels.event.control.command ? 1 :
                    0
    if (origin == 0) {
        return message.channel.send("You cannot use this command here.")
    }
    var statusChannel = origin == 100 ? config.channels.veteran.control.status : origin == 10 ? config.channels.normal.control.status : config.channels.event.control.status
    statusChannel = message.guild.channels.cache.find(c => c.id == statusChannel)

    await statusChannel.send(`@here Headcount for ${chosenTemplate.name}`).then(m => m.delete())
    let hcMessage = await statusChannel.send(templateEmbed)
    for (var i of Object.keys(chosenTemplate.specialReacts)) {
        await hcMessage.react(i).catch(e => e.toString().includes("Error") ? errorHelper.report(message, client, e):null)
    }
    for (var i of Object.keys(runTemplates.global.special)) {
        await hcMessage.react(i).catch(e => e.toString().includes("Error") ? errorHelper.report(message, client, e):null)
    }
    for (var i in chosenTemplate.generalReacts) {
        await hcMessage.react(chosenTemplate.generalReacts[i]).catch(e => e.toString().includes("Error") ? errorHelper.report(message, client, e):null)
    }
    for (var i in runTemplates.global.general) {
        await hcMessage.react(runTemplates.global.general[i]).catch(e => e.toString().includes("Error") ? errorHelper.report(message, client, e):null)
    }
    
}