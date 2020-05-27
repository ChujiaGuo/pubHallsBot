const fs = require('fs')
const vision = require('@google-cloud/vision')
const ocrClient = new vision.ImageAnnotatorClient()
const { createWorker } = require('tesseract.js')
const worker = createWorker()


exports.run = async (client, message, args, Discord, sudo = false) => {
    var config = JSON.parse(fs.readFileSync('config.json'))
    try {
        if (args.length < 1) {
            return message.channel.send(`You are missing arguments. Expected 1, received ${args.length}.`)
        }

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
        var channelNumber = args.shift()
        var statusChannel;
        if (isNaN(channelNumber)) {
            return message.channel.send(`\`${channelNumber}\` is an invalid channel number.`)
        }
        //Channel Available?
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
        //Fetch channel
        var raidingChannel = await message.guild.channels.cache.find(c => c.id == channelNumber)
        var channelMembers = raidingChannel.members

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
            //var result = await parseImage(imageURL)
            var result = await ocrClient.textDetection(imageURL)
        } catch (e) {
            return message.channel.send(`There was an error using the image to text service.\`\`\`${e}\`\`\``)
        }
        await message.channel.send("Text Received")
        console.log(result)
        var players = result[0].fullTextAnnotation.text.replace(/\n/g, " ").split(' ')
        //var players = result.replace(/\n/g, " ").split(' ')
        players = players.slice(players.indexOf(players.find(i => i.includes("):"))) + 1)
        for (var i in players) {
            players[i] = players[i].replace(",", "").toLowerCase().trim()
        }
        players = players.filter(Boolean)

        var channelMembers = raidingChannel.members.map(m => m.displayName)
        var crasherList = [];

        await message.channel.send("Begin parsing...")
        //Start channel parsing
        for (var i in players) {
            if (channelMembers.find(n => n.toLowerCase().replace(/[^a-z|]/gi, '').split('|').includes(players[i].toLowerCase())) == undefined) {
                crasherList.push(players[i].replace(/[^a-z]/gi, ""))
            }
        }
        crasherList = crasherList.filter(Boolean)
        var draggedIn = []
        var crasherListNoRL = []
        var notVet = []
        for (var i in crasherList) {
            let nickname = crasherList[i].toLowerCase()
            let member = await message.guild.members.cache.find(m => m.displayName.toLowerCase().includes(nickname))
            if (member != undefined) {
                let commandFile = require(`./permcheck.js`);
                var auth = await commandFile.run(client, member, config.roles.staff.arl)
                if (!auth) {
                    if (origin == 100 && !member.roles.cache.has(config.roles.general.vetraider)) {
                        notVet.push(nickname)
                    } else {
                        if (member.voice.channel != undefined) {
                            try {
                                await member.voice.setChannel(raidingChannel)
                                draggedIn.push(member.displayName)
                            } catch (e) {
                                console.log(e)
                                message.channel.send(`An error occured when moving ${member.displayName} in.`)
                            }
                        } else {
                            crasherListNoRL.push(nickname)
                        }
                    }

                }
            } else {
                crasherListNoRL.push(nickname)
            }
        }

        var crasherListFormat = crasherListNoRL.join(', ')
        if (draggedIn.length > 0) {
            let draggedInEmbed = new Discord.MessageEmbed()
                .setColor("#ff1212")
                .setAuthor("The following people were moved in from other channels:")
                .setDescription(`\`\`\`${draggedIn.join(', ')}\`\`\``)
            await message.channel.send(draggedInEmbed)
        }
        if(notVet.length > 0){
            let notVetEmbed = new Discord.MessageEmbed()
                .setColor("#ff1212")
                .setAuthor("The following people do not have the veteran raider role:")
                .setDescription(`\`\`\`${notVet.join(', ')}\`\`\``)
            await message.channel.send(notVetEmbed)
        }
        if (crasherListNoRL.length > 0) {
            let embed1 = new Discord.MessageEmbed()
                .setColor("#ff1212")
                .setAuthor("The following people are in your run but not in the raiding channel (ARL+ Excluded):")
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