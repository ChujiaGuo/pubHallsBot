const fs = require('fs')
const vision = require('@google-cloud/vision')
const ocrClient = new vision.ImageAnnotatorClient()


exports.run = async (client, message, args, Discord, sudo = false) => {
    if(!sudo){
        return message.channel.send("Parsing is currently not supported")
    }
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

    //Start Image Parsing
    var imageURL = args.shift();
    if (imageURL == undefined) {
        if (message.attachments.size == 1) {
            imageURL = message.attachments.map(a => a.proxyURL)[0]
        } else {
            return message.channel.send("Please attach a single image, either as an URL or as a raw image.")
        }
    }
    var result = await ocrClient.textDetection(imageURL)
    var players = result[0].fullTextAnnotation.text.split(' ').slice(3)
    var channelMembers = raidingChannel.members.map(m => m.nickname)
    var crasherList = [];

    //Start channel parsing
    for(var i in players){
        players[i].replace("\n","")
    }
}