const fs = require("fs");
const dist = require("js-levenshtein")
const Discord = require("discord.js");
const { Socket } = require("dgram");
const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });
var config = JSON.parse(fs.readFileSync("config.json"))
var commands = JSON.parse(fs.readFileSync("commands.json"))
var owner = await client.users.fetch(config.dev)

client.once("ready", async () => {
    /* var time = Date.now()
    var reset = 86400000 - (time % 86400000)
    setTimeout(async () => {
        let owner = await client.users.fetch(config.dev)
        await owner.send("Daily Restart.")
        process.exit(1)
    }, reset) */
    client.user.setPresence({ activity: { type: "WATCHING", name: "something do a thing" } })
    let commandFile = require(`./commands/updatesuspensions.js`);
    let message = undefined,
        args = undefined
    try {
        commandFile.run(client, message, args, Discord);
    } catch (e) {
        console.log(e)
    }
    let currentRuns = JSON.parse(fs.readFileSync('afk.json')).currentRuns || {}
    afk = {
        100: {
            "afk": false,
            "location": "",
            "statusMessageId": "",
            "infoMessageId": "",
            "commandMessageId": "",
            "earlyLocationIds": []
        },
        10: {
            "afk": false,
            "location": "",
            "statusMessageId": "",
            "infoMessageId": "",
            "commandMessageId": "",
            "earlyLocationIds": []
        },
        1: {
            "afk": false,
            "location": "",
            "statusMessageId": "",
            "infoMessageId": "",
            "commandMessageId": "",
            "earlyLocationIds": []
        },
        "currentRuns": currentRuns
    }
    fs.writeFileSync('afk.json', JSON.stringify(afk))
    console.log("Bot Up.")
    setInterval(async () => {
        let leaverequests = JSON.parse(fs.readFileSync('acceptedleaverequests.json'))
        for (var i in leaverequests) {
            let currentTime = Date.now()
            if (currentTime >= leaverequests[i].endingAt) {
                let guild = await client.guilds.resolve(leaverequests[i].guildId)
                let member = await guild.members.fetch(i)
                let channel = await guild.channels.cache.find(c => c.id == config.channels.log.leaverequest)
                let embed = new Discord.MessageEmbed()
                    .setColor("#41f230")
                    .setAuthor(`${member.nickname}(Username: ${member.user.username})'s leave has expired`)
                    .setDescription(`Their roles:\n${leaverequests[i].roles.join(", ")}`)
                await channel.send(`<@!${leaverequests[i].approvedBy}>, <@!${member.id}>'s leave has expired. If they want to stay on leave, please have them request leave again.`, embed)
                delete leaverequests[i]
            }
        }
        fs.writeFileSync('acceptedleaverequests.json', JSON.stringify(leaverequests))
    }, 60000)
})
client.on("guildMemberAdd", async member => {
    //People Leaving and Rejoin Guild to Bypass Suspensions
    let guildId = member.guild.id
    let id = member.id
    const suspensions = JSON.parse(fs.readFileSync('suspensions.json'))
    var temp, vet, perma
    if (suspensions.normal.id) {
        await member.roles.add(config.roles.general.tempsuspended)
        temp == true;
    }
    if (suspensions.veteran.id && temp != true) {
        await member.roles.add(config.roles.general.vetsuspended)
    }
    if (suspensions.perma.id) {
        await member.roles.add(config.roles.general.permasuspended)
    }

})
client.on("messageReactionAdd", async (r, u) => {
    if (u.bot) return;
    if (r.partial) await r.fetch().catch(e => console.log(e))
    var afk = JSON.parse(fs.readFileSync('afk.json'))
    var currentleaverequests = JSON.parse(fs.readFileSync('currentleaverequests.json'))
    if (!afk.currentRuns[r.message.id] && !currentleaverequests[r.message.id]) {
        return
    } else if (afk.currentRuns[r.message.id]) {
        let raidChannel = await r.message.guild.channels.cache.find(c => c.id == afk.currentRuns[r.message.id])
        await raidChannel.delete().catch(e => console.log(e))
        await r.message.delete().catch(e => console.log(e))
        delete afk.currentRuns[r.message.id]
        fs.writeFileSync('afk.json', JSON.stringify(afk))
    } else if (currentleaverequests[r.message.id]) {
        var requestMessage = r.message
        var requestEmbed = requestMessage.embeds[0]
        var requestObject = currentleaverequests[r.message.id]
        let logChannelGeneral = await r.message.guild.channels.cache.find(c => c.id == config.channels.log.statusupdatesgeneral)
        let logChannelMod = await r.message.guild.channels.cache.find(c => c.id == config.channels.log.statusupdatesmod)
        let mod = await r.message.guild.member(u)
        if (r.emoji.name == "✅") {
            try {
                await requestMessage.reactions.removeAll()
            } catch (e) { }
            let d = new Date(requestEmbed.timestamp)
            requestEmbed
                .setColor("#41f230")
                .setFooter(requestEmbed.footer.text.trim() + ` ${d.toDateString()}\nRequest approved by ${mod.nickname} at `)
                .setDescription(requestEmbed.description.substring(0, requestEmbed.description.lastIndexOf("React")))
                .setTimestamp()
            await requestMessage.edit(requestEmbed)
            requestObject["approvedBy"] = mod.id
            let acceptedleaverequests = JSON.parse(fs.readFileSync("acceptedleaverequests.json"))
            acceptedleaverequests[requestObject.requestFrom] = requestObject
            fs.writeFileSync("acceptedleaverequests.json", JSON.stringify(acceptedleaverequests))
            delete currentleaverequests[r.message.id]
            fs.writeFileSync('currentleaverequests.json', JSON.stringify(currentleaverequests))
            await logChannelGeneral.send(`<@!${requestObject.requestFrom}> on leave for ${await toTimeString(requestObject.duration)}`)
            await logChannelMod.send(requestEmbed)
            let member = await r.message.guild.members.fetch(requestObject.requestFrom)
            await member.send("You request for leave has been accepted.")
        } else if (r.emoji.name == "❌") {
            try {
                await requestMessage.reactions.removeAll()
            } catch (e) { }
            let d = new Date(requestEmbed.timestamp)
            requestEmbed
                .setColor("#ff1212")
                .setFooter(requestEmbed.footer.text.trim() + ` ${d.toDateString()}\nRequest denied by ${mod.nickname} at `)
                .setDescription(requestEmbed.description.substring(0, requestEmbed.description.lastIndexOf("React")))
                .setTimestamp()
            await requestMessage.edit(requestEmbed)
            delete currentleaverequests[r.message.id]
            fs.writeFileSync('currentleaverequests.json', JSON.stringify(currentleaverequests))
            let member = await r.message.guild.members.fetch(requestObject.requestFrom)
            await member.send("You request for leave has been denied.")
        } else if (r.emoji.name == "❓") {
            let d = new Date(requestEmbed.timestamp)
            requestEmbed
                .setColor("#7f9a67")
                .setFooter(requestEmbed.footer.text.trim() + ` ${d.toDateString()}\nRequest pending review from ${mod.nickname} at `)
            await requestMessage.edit(requestEmbed)
        }
    }
})
client.on("message", async message => {
    config = JSON.parse(fs.readFileSync("config.json"))
    commands = JSON.parse(fs.readFileSync("commands.json"))

    //Filters
    //Bot
    if (message.author.bot) return;
    if (message.content.includes(`<@!${client.user.id}> prefix`)) return message.channel.send(config.prefix)
    //Not a command
    if (message.content.indexOf(config.prefix) != 0) return;

    //Define Command
    let args = message.content.slice(config.prefix.length).trim().split(' ');
    let cmd = args.shift().toLowerCase();

    //Deal with unwanted commands
    if (cmd.length == 0) return;
    if (/[^a-z]/gi.test(cmd)) return;
    cmd = commands.aliases[cmd] || cmd

    //Check channel
    //Not a command channel
    let restrictedCommands = ['addalt', 'afk', 'bazaarparse', 'changename', 'clean', 'find', 'kick', 'location', 'lock', 'manualverify', 'manualvetverifiy', 'parsecharacters', 'parsemembers', 'resetafk', 'restart', 'setup', 'suspend', 'unlock', 'unsuspend', 'vetsuspend', 'vetunsuspend']
    let commandArray = Object.values(config.channels.command)
    commandArray.push(config.channels.veteran.control.command)
    commandArray.push(config.channels.normal.control.command)
    commandArray.push(config.channels.event.control.command)
    if (!commandArray.includes(message.channel.id) && restrictedCommands.includes(cmd)) return message.channel.send("Commands have to be used in a designated command channel.");
    if (message.channel.type != 'text') return message.channel.send("Sorry, but all commands have to be used in a server.")

    //Attempt Command
    try {

        //Retrive Command File
        let cmdFile = `./commands/${cmd}.js`

        delete require.cache[require.resolve(cmdFile)];
        let commandFile = require(cmdFile);
        if (cmd != "sudo" && (commands.settings[cmd] == undefined || commands.settings[cmd].enabled.toLowerCase() != "true")) {
            return message.channel.send(`This command is not enabled. Please get a mod to enable it.`)
        }
        if (cmd != "sudo" && (!isNaN(commands.settings[cmd].permsint) && commands.settings[cmd].permsint.length == 0)) {
            return message.channel.send("The perms int for this command is not a number. Please get a mod to fix it.")
        }
        if (cmd != "sudo" && commands.settings[cmd].permsint != "0") {
            let commandFile = require(`./commands/permcheck.js`);
            var auth;
            auth = await commandFile.run(client, message.member, commands.settings[cmd].permsint);
            if (!auth) {
                let noPerms = new Discord.MessageEmbed()
                    .setColor("#ff1212")
                    .setAuthor("Permission Denied")
                    .setDescription(`You do not have permission to use this command.\n<@&${commands.settings[cmd].permsint}> or higher is required to use it.`)
                return message.channel.send(noPerms)
            }
        }
        try {
            await message.guild.members.fetch()
            commandFile.run(client, message, args, Discord);
        } catch (e) {
            await message.channel.send(`There was an error updating the cache: \`\`\`${e}\`\`\``)
            let errorUpdate = await message.channel.send("Would you like to run the command with a previous cache?")
            await errorUpdate.react("✅")
            await errorUpdate.react("❌")
            const confirmationFilter = (r, u) => !u.bot && (r.emoji.name == "✅" || r.emoji.name == "❌") && u.id == message.author.id
            await errorUpdate.awaitReactions(confirmationFilter, { max: 1, time: 15000 })
                .then(async (r, u) => {
                    if (r.size > 0) {
                        r = r.map(e => e)[0]
                        console.log(r)
                        if (r.emoji.name == "✅") {
                            errorUpdate.edit("Confirmation given. The command will now run.")
                            commandFile.run(client, message, args, Discord)
                            try {
                                errorUpdate.reactions.removeAll()
                            } catch (e) { }
                        } else {
                            errorUpdate.edit("Confirmation withheld. The command is now aborted.")
                            try {
                                errorUpdate.reactions.removeAll()
                            } catch (e) { }
                        }
                    } else {
                        errorUpdate.edit("No confirmation was given. The command is now aborted.")
                        try {
                            errorUpdate.reactions.removeAll()
                        } catch (e) { }
                    }
                })
        }


    } catch (e) {
        var errorEmbed = new Discord.MessageEmbed()
            .setColor("#ff1212")
            .setTitle("Error")
        if (e.code == "MODULE_NOT_FOUND") {
            var suggestionString = []
            var listAlias = Object.keys(commands.aliases)
            for (var i = 0; i < listAlias.length; i++) {
                if (dist(cmd, listAlias[i]) <= 4) {
                    suggestionString.push(`\`${commands.aliases[listAlias[i]]}\``)
                }
            }
            suggestionString = [...new Set(suggestionString)]
            suggestionString = suggestionString.join(', ')
            errorEmbed.setDescription(`There was a problem processing \`$${cmd}\` for the following reason: \n\n\`$${cmd}\` is not a command.\nPerhaps you mean one of these or their aliases?\n${suggestionString}`)
            message.channel.send(errorEmbed)
        } else {
            console.log(e)
            var owner = await client.users.fetch(config.dev)
            errorEmbed.setDescription(`There was a problem processing \`$${cmd}\` for the following reason: \n\nAn internal error occured. The developer has been notified of this and will fix it as soon as possible. The bot will DM you once finished.`)
            await message.channel.send(errorEmbed)
            errorEmbed.setDescription(`Error Processing: \`${cmd}\`\nError Message:\`\`\`${e.toString()}\`\`\`\From User: <@${message.author.id}>\nIn guild: \`${message.guild.name}\``)
            await owner.send(errorEmbed)
        }
    }
})
client.on("error", async error => {
    var owner = await client.users.fetch(config.dev)
    let errorEmbed = new Discord.MessageEmbed()
        .setColor("#ff1212")
        .setAuthor("Error")
        .setDescription(`Error Type: ${error.name}\nError Message: ${error.message}\nFull Error Message: ${error.stack}`)
    await owner.send(errorEmbed)
})
process.on("uncaughtException", (err) => {
    await owner.send(`An uncaught error occured: \`\`\`${err.stack}\`\`\``)
    process.exit(1)
})
client.login(config.auth)
async function toTimeString(time) {
    return `${Math.floor(time / 604800000)} Weeks ${Math.floor(time % 604800000) / 86400000} Days`
}