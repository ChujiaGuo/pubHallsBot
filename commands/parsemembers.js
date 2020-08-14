const fs = require('fs')
const vision = require('@google-cloud/vision')
const ocrClient = new vision.ImageAnnotatorClient()
const { createWorker } = require('tesseract.js')
const worker = createWorker()


exports.run = async (client, message, args, Discord, sudo = false) => {
    var config = JSON.parse(fs.readFileSync('config.json'))
    try {

        //Get Channel
        //Find Origin
        var origin = 0;
        //Check origin channel
        if (message.channel.id == config.channels.veteran.control.command) {
            origin = 100
        } else if (message.channel.id == config.channels.normal.control.command) {
            origin = 10
        } else if (message.channel.id == config.channels.event.control.command) {
            origin = 1
        } else {
            return message.channel.send("You cannot use this command here.")
        }

        //Channel Number
        var channelNumber = args[0]
        var imageURL = "";

        //Channel Available?
        if (message.member.voice.channelID) {
            channelNumber = message.member.voice.channelID
            if (args.length == 1) {
                imageURL = args[0]
            } else {
                imageURL = args[1]
            }
        } else if (message.guild.channels.cache.find(c => c.id == channelNumber) && message.guild.channels.cache.find(c => c.id == channelNumber).type == "voice") {
            channelNumber = channelNumber
            imageURL = args[1]
        } else {
            if (origin == 100) {
                if (config.channels.veteran.raiding[channelNumber] == undefined) {
                    return message.channel.send(`\`${channelNumber}\` is an invalid channel number.`)
                }
                if (config.channels.veteran.raiding[channelNumber].length == 0) {
                    return message.channel.send(`Raiding Channel \`${channelNumber}\` has not been configured. Please have an admin add it using setup.`)
                } else {
                    channelNumber = config.channels.veteran.raiding[channelNumber]
                }
            } else if (origin == 10) {
                if (config.channels.normal.raiding[channelNumber] == undefined) {
                    return message.channel.send(`\`${channelNumber}\` is an invalid channel number.`)
                }
                if (config.channels.normal.raiding[channelNumber].length == 0) {
                    return message.channel.send(`Raiding Channel \`${channelNumber}\` has not been configured. Please have an admin add it using setup.`)
                } else {
                    channelNumber = config.channels.normal.raiding[channelNumber]
                }
            } else if (origin = 1) {
                if (config.channels.event.raiding[channelNumber] == undefined) {
                    return message.channel.send(`\`${channelNumber}\` is an invalid channel number.`)
                }
                if (config.channels.event.raiding[channelNumber].length == 0) {
                    return message.channel.send(`Raiding Channel \`${channelNumber}\` has not been configured. Please have an admin add it using setup.`)
                }
                else {
                    return message.channel.send("Events aren't supported yet. Sorry.")
                    channelNumber = config.channels.event.raiding[channelNumber]
                }
            } else {
                return message.channel.send("You should not be here.")
            }
            imageURL = args[1]
        }

        //Fetch channel
        var raidingChannel = await message.guild.channels.cache.find(c => c.id == channelNumber)
        if (!raidingChannel) {
            return message.channel.send("Invalid Channel")
        }
        var channelMembers = raidingChannel.members

        //Begin Image Parsing
        if (message.attachments.size == 1 || imageURL) {
            imageURL = message.attachments.map(a => a.proxyURL)[0] || imageURL
        } else {
            return message.channel.send("Please attach a single image, either as an URL or as a raw image.")
        }
        var statusEmbed = new Discord.MessageEmbed()
            .setColor("#41f230")
            .setAuthor("Parsing Information")
            .setDescription(`Parsing done by: <@!${message.member.id}>\nParse status: Retrieving Text`)
        var statusMessage = await message.channel.send(statusEmbed)
        var google = true;
        try {
            var result = await ocrClient.textDetection(imageURL)
        } catch (e) {
            statusEmbed
                .setColor("#ff1212")
                .setDescription(`Parsing done by: <@!${message.member.id}>\nParse status: Error\nAttempting to use Tesseract Text Recognition. This may take a bit longer.\`\`\`${e}\`\`\``)
            statusMessage.edit(statusEmbed)
            try {
                var result = await parseImage(imageURL)
                google = false;
            } catch (e) {
                statusEmbed
                    .setColor("#ff1212")
                    .setDescription(`Parsing done by: <@!${message.member.id}>\nParse status: Error Tesseract Failed\`\`\`${e}\`\`\``)
                statusMessage.edit(statusEmbed)
            }
        }
        statusEmbed
            .setDescription(`Parsing done by: <@!${message.member.id}>\nParse status: Text Received`)
        await statusMessage.edit(statusEmbed)
        if(google){
            var players = result[0].fullTextAnnotation.text.replace(/\n/g, " ").split(' ')
        }else{
            var players = result.replace(/\n/g, " ").split(' ')
        }
        players = players.slice(players.indexOf(players.find(i => i.includes("):"))) + 1)
        for (var i in players) {
            players[i] = players[i].replace(",", "").toLowerCase().trim()
        }
        players = players.filter(Boolean)
        var channelMembers = raidingChannel.members.map(m => `<@!${m.id}>`)
        try {
            statusEmbed
                .setDescription(`Parsing done by: <@!${message.member.id}>\nParse status: Text Received`)
                .setFooter("Parse done at ")
                .setTimestamp()
            if (config.parsesettings.displayNames.toLowerCase() == "true") {
                statusEmbed.addField(`Players detected by text recognition:`, players.join(", "))

            }
            if (config.parsesettings.displayImage.toLowerCase() == "true") {
                statusEmbed.setImage(imageURL)
            }
            await statusMessage.edit(statusEmbed)
        } catch (e) { }
        channelMembers = raidingChannel.members.map(m => m)
        var crasherList = []
        var crasherListNames = []
        var otherVCList = []
        var otherVCNames = []
        var altList = []

        try {
            statusEmbed
                .setDescription(`Parsing done by: <@!${message.member.id}>\nParse status: Beginning Parsing`)
            await statusMessage.edit(statusEmbed)
        } catch (e) { }
        //Start channel parsing
        //People in /who but not in channel
        for (var i in players) {
            let member = message.guild.members.cache.find(n => n.nickname != null && n.displayName.toLowerCase().replace(/[^a-z|]/gi, '').split('|').includes(players[i].toLowerCase()))
            if (member == undefined) {
                //People who aren't in the server
                crasherList.push(players[i].replace(/[^a-z]/gi, ""))
                crasherListNames.push(players[i].replace(/[^a-z]/gi, ""))
            } else if (member.voice.channel == undefined) {
                //People who aren't in a voice channel but are a member
                crasherList.push(`<@!${member.id}>`)
                crasherListNames.push(players[i].replace(/[^a-z]/gi, ""))
            } else if (member.voice.channel != undefined && member.voice.channel != raidingChannel) {
                //People in a different voice channel
                otherVCList.push(`<@!${member.id}> \`${players[i]}\`: <#${member.voice.channelID}>`)
                otherVCNames.push(`${member.displayName}`.replace(/[^a-z]/gi, ""))
            } else {
                //Removes them from channelMembers if they are in the correct voice channel
                channelMembers.splice(channelMembers.indexOf(member), 1)
            }
        }

        altList = channelMembers.map(m => `<@!${m.id}>`)

        crasherList = crasherList.filter(Boolean)
        crasherListNames = crasherListNames.filter(Boolean)
        var crasherListNoRL = []
        var notVet = []
        for (var i in crasherListNames) {
            let nickname = crasherListNames[i].toLowerCase()
            let member = await message.guild.members.cache.find(m => m.nickname != null && m.displayName.toLowerCase().replace(/[^a-z|]/gi, '').split('|').includes(nickname))
            if (member != undefined) {
                let commandFile = require(`./permcheck.js`);
                var auth = await commandFile.run(client, member, config.roles.staff.arl)
                if (!auth) {
                    if (config.parsesettings.displayVet.toLowerCase() == "true") {
                        if (origin == 100 && !member.roles.cache.has(config.roles.general.vetraider)) {
                            notVet.push(nickname)
                        } else {
                            crasherListNoRL.push(nickname)
                        }
                    } else {
                        crasherListNoRL.push(nickname)
                    }

                } else {
                    let thing = crasherList.find(n => n.includes(member.id))
                    if (thing) {
                        crasherList.splice(crasherList.indexOf(thing), 1)
                    }
                }
            } else {
                crasherListNoRL.push(nickname)
            }
        }
        try {
            if (altList.length > 0) {
                let altEmbed = new Discord.MessageEmbed()
                    .setColor("#41f230")
                    .setAuthor("The following people are in your voice channel but not in game (potential alts):")
                    .setDescription(altList.join(", "))
                await message.channel.send(altEmbed)
            }
        } catch (e) { }
        try {
            if (otherVCList.length > 0) {
                let otherVCEmbed = new Discord.MessageEmbed()
                    .setColor("#41f230")
                    .setAuthor("The following people are in a different voice channel:")
                    .setDescription(otherVCList.join("\n"))
                    .addField("As input for find:", otherVCNames.join(" "))
                await message.channel.send(otherVCEmbed)
            }
        } catch (e) { }
        try {
            if (notVet.length > 0) {
                let notVetEmbed = new Discord.MessageEmbed()
                    .setColor("#41f230")
                    .setAuthor("The following people are not veteran raiders:")
                    .setDescription(notVet.join(", "))
                    .addField("As input for find:", notVet.join(" "))
                await message.channel.send(notVetEmbed)
            }
        } catch (e) { }
        try {
            if (crasherListNoRL.length > 0) {
                let crasherEmbed = new Discord.MessageEmbed()
                    .setColor("#41f230")
                    .setAuthor("The following people are not in the voice channel (ARL+ Excluded):")
                    .setDescription(crasherList.join(", "))
                    .addField("As input for find:", crasherListNoRL.join(" "))
                await message.channel.send(crasherEmbed)
            }
        } catch (e) { }
        try {
            statusEmbed
                .setDescription(`Parsing done by: <@!${message.member.id}>\nParse status: Parse Complete`)
                .setFooter("Parse done at ")
                .setTimestamp()
            await statusMessage.edit(statusEmbed)
        } catch (e) { }
        let parsecharacters = require("./parsecharacters.js")
        await parsecharacters.run(client, message, [imageURL], Discord)
    }
    catch (e) {
        console.log(e)
        let owner = await client.users.fetch(config.dev)
        var errorEmbed = new Discord.MessageEmbed()
            .setColor("#ff1212")
            .setTitle("Error")
            .setDescription(`Error Processing: \`parsemembers\`\nError Message:\`\`\`${e.toString()}\`\`\`\From User: <@${message.author.id}>\nIn guild: \`${message.guild.name}\``)
        await owner.send(errorEmbed)
        message.channel.send(errorEmbed)
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