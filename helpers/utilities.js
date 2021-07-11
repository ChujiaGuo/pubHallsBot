const Discord = require('discord.js');
const fs = require('fs')
let config = JSON.parse(fs.readFileSync(`./configs/globalConfig.json`));


module.exports = {
    isRaidChannel: function isRaidChannel(message, args, reject) {
        let guildConfig = JSON.parse(fs.readFileSync(`./configs/${message.guild.id}.json`));
        //Get Channel
        //Find Origin
        var origin = 0;
        //Check origin channel
        if (message.channel.id == guildConfig.channels.veteran.control.command) {
            origin = 100
        } else if (message.channel.id == guildConfig.channels.normal.control.command) {
            origin = 10
        } else if (message.channel.id == guildConfig.channels.event.control.command) {
            origin = 1
        } else {
            return message.channel.send("You cannot use this command here.")
        }
        //Channel Number
        var channelNumber = args[0]

        //Channel Available?
        if (message.guild.channels.cache.find(c => c.id == channelNumber) && message.guild.channels.cache.find(c => c.id == channelNumber).type == "voice") { // User is in a channel
            return channelNumber;
        } else if (message.member.voice.channelID) {
            return message.member.voice.channelID;
        } else {
            if (origin == 100) {
                if (guildConfig.channels.veteran.raiding[channelNumber] == undefined) {
                    reject()
                    return message.channel.send(`\`${channelNumber}\` is an invalid channel number.`)
                }
                if (guildConfig.channels.veteran.raiding[channelNumber].length == 0) {
                    reject()
                    return message.channel.send(`Raiding Channel \`${channelNumber}\` has not been configured. Please have an admin add it using setup.`)
                } else {
                    return guildConfig.channels.veteran.raiding[channelNumber]
                }
            } else if (origin == 10) {
                if (guildConfig.channels.normal.raiding[channelNumber] == undefined) {
                    reject()
                    return message.channel.send(`\`${channelNumber}\` is an invalid channel number.`)
                }
                if (guildConfig.channels.normal.raiding[channelNumber].length == 0) {
                    reject()
                    return message.channel.send(`Raiding Channel \`${channelNumber}\` has not been configured. Please have an admin add it using setup.`)
                } else {
                    return guildConfig.channels.normal.raiding[channelNumber]
                }
            } else if (origin = 1) {
                if (guildConfig.channels.event.raiding[channelNumber] == undefined) {
                    reject()
                    return message.channel.send(`\`${channelNumber}\` is an invalid channel number.`)
                }
                if (guildConfig.channels.event.raiding[channelNumber].length == 0) {
                    reject()
                    return message.channel.send(`Raiding Channel \`${channelNumber}\` has not been configured. Please have an admin add it using setup.`)
                }
                else {
                    reject()
                    return message.channel.send("Events aren't supported yet. Sorry.")
                    return guildConfig.channels.event.raiding[channelNumber]
                }
            } else {
                reject()
                return message.channel.send("You should not be here.")
            }

        }
    }

}