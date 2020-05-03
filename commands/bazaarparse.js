const fs = require('fs')
const vision = require('@google-cloud/vision')
const ocrClient = new vision.ImageAnnotatorClient()


exports.run = async (client, message, args, Discord, sudo = false) => {
    var config = JSON.parse(fs.readFileSync('config.json'))
    //Permissions
    if (!sudo) {
        let commandFile = require(`./permcheck.js`);
        var auth = await commandFile.run(client, message.member, 100)
        if (!auth) {
            return message.channel.send("You do not have permission to use this command.")
        }
    }
    if (args.length < 1) {
        return message.channel.send(`You are missing arguments. Expected 1, received ${args.length}.`)
    }

    //Get embed message
    var infoChannel = message.guild.channels.cache.find(c => c.id == config.channels.log.raid)
    var commandsChannel = message.channel
    var messageId = args.shift()
    var embedMessage;
    try {
        embedMessage = await commandsChannel.messages.fetch(messageId)
    } catch (e) {
        try {
            embedMessage = await infoChannel.messages.fetch(messageId)
        } catch (e) {
            return message.channel.send(`Invalid Message: \`\`\`${e1}\`\`\``)
        }
    }

    var embed = embedMessage.embeds
    if (embed == undefined) {
        return message.channel.send(`Invalid Message: \`\`\`No Embeds\`\`\``)
    }

    //Begin Embed Parsing
    embed = embed[0]
    var fieldString = ""
    var userIdArray = []
    embed.fields.forEach(f => {
        fieldString += f.value
    })
    while (fieldString.indexOf("<@!") != -1) {
        var idBegin = fieldString.indexOf("<@!") + 3
        var idEnd = idBegin + 18
        userIdArray.push(fieldString.substring(idBegin, idEnd))
        fieldString = fieldString.substring(0, idBegin - 3) + fieldString.substring(idEnd)
    }
    userIdArray = [... new Set(userIdArray)]
    var usernameArray = []
    for (var i in userIdArray) {
        let user = await message.guild.members.fetch(userIdArray[i])
        if (/^[a-z0-9]+$/i.test(user.nickname)) {
            usernameArray.push(user.nickname.toLowerCase())
        } else {
            usernameArray.push(user.nickname.toLowerCase().substring(1))
        }
    }

    //Begin Image Parsing
    var imageURL = args.shift();
    if (imageURL == undefined) {
        if (message.attachments.size == 1) {
            imageURL = message.attachments.map(a => a.proxyURL)[0]
        } else {
            return message.channel.send("Please attach a single image, either as an URL or as a raw image.")
        }
    }
    var result = await ocrClient.textDetection(imageURL)
    var players = result[0].fullTextAnnotation.text.replace(/\n/g, " ").split(' ')
    players = players.slice(players.indexOf(players.find(i => i.includes("):")))+1)
    for (var i in players) {
        players[i] = players[i].replace(",", "").toLowerCase().trim()
    }

    //Begin Comparisons
    var crasherList = []
    for (var i in players) {
        let nickname = players[i]
        if (nickname.length > 0) {
            if (!usernameArray.includes(nickname)) {
                crasherList.push(nickname)
            }
        }
    }
    crasherList = [... new Set(crasherList)]
    for (var i in crasherList) {
        crasherList[i] = crasherList[i].charAt(0).toUpperCase() + crasherList[i].substring(1)
    }
    //Remove ARL+ from crasherList
    var crasherListNoRL = []
    for (var i in crasherList) {
        let nickname = crasherList[i].toLowerCase()
        let member = await message.guild.members.cache.find(m => m.displayName.toLowerCase().includes(nickname))
        if (member != undefined) {
            let commandFile = require(`./permcheck.js`);
            var auth = await commandFile.run(client, member, 100)
            if (!auth) {
                crasherListNoRL.push(nickname)
            }
        } else {
            crasherListNoRL.push(nickname)
        }
    }

    //Send stuff
    var crasherListFormat = crasherListNoRL.join(', ')
    if (crasherListNoRL.length > 0) {
        await message.channel.send("The following people are at your location when they should not be (ARL+ Excluded):")
        await message.channel.send(`\`\`\`${crasherListFormat}\`\`\``)
        await message.channel.send("As input for -find:")
        await message.channel.send(`\`\`\`${crasherListNoRL.join(' ')}\`\`\``)
    } else {
        await message.channel.send("There are no crashers")
    }

}