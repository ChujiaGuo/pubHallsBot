const fs = require('fs')
const vision = require('@google-cloud/vision')
const ocrClient = new vision.ImageAnnotatorClient()
const { createWorker } = require('tesseract.js')
const worker = createWorker()


exports.run = async (client, message, args, Discord, sudo = false) => {
    var config = JSON.parse(fs.readFileSync('config.json'))
    try {
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
                return message.channel.send(`Invalid Message: \`\`\`${e}\`\`\``)
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
        await message.channel.send("Retrieving text...")
        try {
            var result = await ocrClient.textDetection(imageURL)
        } catch (e) {
            return message.channel.send(`There was an error using the image to text service.\`\`\`${e}\`\`\``)
        }
        await message.channel.send("Text Received")
        var players = result[0].fullTextAnnotation.text.replace(/\n/g, " ").split(' ')
        //var players = result.replace(/\n/g, " ").split(' ')
        players = players.slice(players.indexOf(players.find(i => i.includes("):"))) + 1)
        for (var i in players) {
            players[i] = players[i].replace(",", "").toLowerCase().trim()
        }
        players = players.filter(Boolean)

        await message.channel.send("Begin parsing...")
        //Begin Comparisons
        var crasherList = []
        for (var i in players) {
            let nickname = players[i]
            if (nickname.length > 0) {
                if (!usernameArray.find(n => n.toLowerCase().replace(/[^a-z|]/gi, '').split('|').includes(nickname))) {
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
            let embed1 = new Discord.MessageEmbed()
                .setColor("#ff1212")
                .setAuthor("The following people are in your location when they should not be (ARL+ Excluded):")
                .setDescription(`\`\`\`${crasherListFormat}\`\`\``)
            let embed2 = new Discord.MessageEmbed()
                .setColor("#ff1212")
                .setAuthor("As input for find:")
                .setDescription(`\`\`\`${crasherListNoRL.join(' ')}\`\`\``)
            await message.channel.send(embed1)
            await message.channel.send(embed2)
        } else {
            await message.channel.send("There are no crashers")
        }
    }
    catch (e) {
        let owner = await client.users.fetch(config.dev)
        var errorEmbed = new Discord.MessageEmbed()
            .setColor("#ff1212")
            .setTitle("Error")
            .setDescription(`Error Processing: \`bazaarparse\`\nError Message:\`\`\`${e.toString()}\`\`\`\From User: <@${message.author.id}>\nIn guild: \`${message.guild.name}\``)
        await owner.send(errorEmbed)
        owner.send()
    }
}

async function parseImage(image) {
    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    const { data: { text } } = await worker.recognize(image);
    await worker.terminate();
    return text;
}