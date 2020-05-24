const fs = require('fs')

exports.run = async (client, message, args, Discord, sudo = false) => {
    if (!sudo) {
        let commandFile = require(`./permcheck.js`);
        var auth = await commandFile.run(client, message.member, 1)
        if (!auth) {
            return message.channel.send("You do not have permission to use this command.")
        }
    }
    const config = JSON.parse(fs.readFileSync('config.json'))
    var reportObject = {
        "messageLink": message.url,
        "messageAuthor": `<@!${message.author.id}>`,
        "messageGuild": message.guild.name,
        "messageCommand": "None",
        "messageComplaint": "None",
        "messageProcess": "None",
        "originalLink": "None"
    }
    var explanationObject = {
        "messageCommand": "What command did you use to cause this problem?",
        "messageComplaint": "What was the problem? (Please describe as specifically as you can)",
        "messageProcess": "How did this happen? (Please describe in as much detail as possible)",
        "originalLink": "Please link your original message (Right click the message and press `Copy Message Link`):"
    }
    var cancelled = false
    const filter = m => m == m
    message.author.send("Beginning error report. You can reply with `cancel` to cancel at any time or with `none` if you have no answer.")
    for (var i in reportObject) {
        if (reportObject[i] == 'None' && !cancelled) {
            let promptMessage = await message.author.send(explanationObject[i])
            let result = await promptMessage.channel.awaitMessages(filter, { max: 1 })
            result = result.map(m => m.content)[0]
            if (result.toLowerCase() == "cancel") {
                cancelled = true
            }
            reportObject[i] = result
        }
    }
    if (cancelled) {
        return message.author.send("The complaint has been cancelled.")
    }
    let descriptionString = `From User: ${reportObject.messageAuthor}\nIn guild: ${reportObject.messageGuild}\nCommand: \`${reportObject.messageCommand}\`\nOriginal Link: ${reportObject.originalLink}\nComplaint: \`\`\`${reportObject.messageComplaint}\`\`\`\nProcess:\`\`\`${reportObject.messageProcess}\`\`\``
    if(descriptionString.length >=2048){
        return message.author.send("Sorry, but your complaint was too long. There is a limit of 2000 characters.")
    }
    var returnEmbed = new Discord.MessageEmbed()
        .setColor("#ff1212")
        .setAuthor(`Error Report by ${message.member.displayName}`, message.author.avatarURL(), reportObject.messageLink)
        .setDescription(descriptionString)
    var owner = await client.users.fetch(config.dev)
    owner.send(returnEmbed)
}