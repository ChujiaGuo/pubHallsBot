const fs = require("fs");
const dist = require("js-levenshtein")
const Discord = require("discord.js");
const { Socket } = require("dgram");
const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });
var config = JSON.parse(fs.readFileSync("config.json"))
var commands = JSON.parse(fs.readFileSync("commands.json"))
var sqlHelper = require("./helpers/sqlHelper.js");
var processManager = require("./helpers/processManager.js")
var confirmationHelper = require("./helpers/confirmationHelper.js")
var activeDMs = []
var errorHelper = require('./helpers/errorHelper.js')

client.once("ready", async () => {
    let processes = JSON.parse(fs.readFileSync('processes.json'))
    processes.botStatus = "#16c60c"
    processes.pendingRestart = false
    processes.activeProcesses = []
    processes.additionalInfo = ""
    fs.writeFileSync('processes.json',JSON.stringify(processes))
    await processManager.updateStatusMessage(client)
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
    if (!afk.currentRuns[r.message.id] && !currentleaverequests[r.message.id] && r.message.channel.id != config.channels.log.modmail) {
        return
    } else if (afk.currentRuns[r.message.id]) {
        let raidChannel = await r.message.guild.channels.cache.find(c => c.id == afk.currentRuns[r.message.id])
        await raidChannel.delete().catch(e => console.log(e))
        await r.message.delete().catch(e => console.log(e))
        delete afk.currentRuns[r.message.id]
        fs.writeFileSync('afk.json', JSON.stringify(afk))
        let currentAfks = JSON.parse(fs.readFileSync('currentAfks.json'))
        delete currentAfks[raidChannel.id]
        fs.writeFileSync('currentAfks.json', JSON.stringify(currentAfks))
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
    } else if (r.message.channel.id == config.channels.log.modmail && r.message.author.id == client.user.id && (r.message.embeds[0].author && !r.message.embeds[0].author.name.includes(" -- Resolved"))) {
        if (r.emoji.name == "🔑") {
            await r.message.reactions.removeAll()
            if (!r.message.embeds[0].author.name.includes(" -- Resolved")) {
                await r.message.react("📧")
            }
            if (!r.message.embeds[0].author.name.includes(" -- Resolved")) {
                await r.message.react("👀")
            }
            if (!r.message.embeds[0].author.name.includes(" -- Resolved")) {
                await r.message.react("🗑️")
            }
            if (!r.message.embeds[0].author.name.includes(" -- Resolved")) {
                await r.message.react("❌")
            }
            if (!r.message.embeds[0].author.name.includes(" -- Resolved")) {
                await r.message.react("🔨")
            }
            if (!r.message.embeds[0].author.name.includes(" -- Resolved")) {
                await r.message.react("🔒")
            }
        } else if (r.emoji.name == "📧") {
            async function response() {
                return new Promise(async (resolve, reject) => {
                    let sender = await r.message.guild.members.fetch(r.message.embeds[0].footer.text.split(" ")[2]).catch(e => errorHelper.report(message, client, e))
                    let responsePromptEmbed = new Discord.MessageEmbed()
                        .setColor("#30ffea")
                        .setDescription(`__How would you like to respond to ${sender}'s [message](${r.message.url})?__\n${r.message.embeds[0].description.split(" ").slice(4).join(" ").slice(1, -1)}`)
                    let response = await r.message.channel.send(responsePromptEmbed)
                    let responseCollectorFilter = m => m.author.id == u.id
                    let responseCollector = response.channel.createMessageCollector(responseCollectorFilter, { max: 1 })
                    responseCollector.on('collect', async m => {
                        await m.delete()
                        responsePromptEmbed.setDescription(`__Are you sure you want to respond with the following?__\n${m.content}`)
                        await response.edit(responsePromptEmbed)
                        let confirmed = await confirmationHelper.confirmMessage(response).catch(e => errorHelper.report(message, client, e))
                        if (confirmed) {
                            let responseEmbed = new Discord.MessageEmbed()
                                .setColor("#30ffea")
                                .setDescription(`Question: ${r.message.embeds[0].description.split(" ").slice(4).join(" ").slice(1, -1)}\nResponse: ${m.content}`)
                            await sender.send(responseEmbed)
                            await response.delete().catch(e => errorHelper.report(message, client, e))
                            await r.message.edit(r.message.embeds[0].addField(`Response by ${r.message.guild.members.cache.find(m => m.id == u.id).nickname}:`, m.content))
                            resolve(true)
                        } else {
                            await response.delete().catch(e => errorHelper.report(message, client, e))
                            reject(false)
                        }
                    })
                })
            }
            let responded = await response().catch(e => errorHelper.report(message, client, e))

            if (responded) {
                let embed = r.message.embeds[0]
                embed.setAuthor(embed.author.name + " -- Resolved with 📧")
                await r.message.edit(embed)
                await r.message.reactions.removeAll()
                await r.message.react("📧")
            } else {
                await r.message.reactions.removeAll()
                await r.message.react("🔑")
            }
        } else if (r.emoji.name == "👀") {
            let sender = await r.message.guild.members.fetch(r.message.embeds[0].footer.text.split(" ")[2]).catch(e => errorHelper.report(message, client, e))
            await sender.user.createDM()
            let messageURL = await sender.user.dmChannel.messages.fetch(r.message.embeds[0].footer.text.split(" ")[6])
            let receivedEmbed = new Discord.MessageEmbed()
                .setColor("#30ffea")
                .setDescription(`Your [message](${messageURL.url}) has been received and read.`)
            await sender.send(receivedEmbed)
            let embed = r.message.embeds[0]
            embed.setAuthor(embed.author.name + " -- Resolved with 👀")
            await r.message.edit(embed)
            await r.message.reactions.removeAll()
            await r.message.react("👀")
        } else if (r.emoji.name == "🗑️") {
            let embed = r.message.embeds[0]
            embed.setAuthor(embed.author.name + " -- Resolved with 🗑️")
            await r.message.edit(embed)
            await r.message.reactions.removeAll()
            await r.message.react("🗑️")
        } else if (r.emoji.name == "❌") {
            await r.message.delete()
        } else if (r.emoji.name == "🔨") {
            let success = await sqlHelper.modmailBlacklist(r.message.embeds[0].footer.text.split(" ")[2]).catch(e => errorHelper.report(message, client, e))
            if (success != true) {
                await r.message.channel.send(`<@!${r.message.embeds[0].footer.text.split(" ")[2]}> was not able to be blacklisted.`)
            } else {
                await r.message.channel.send(`<@!${r.message.embeds[0].footer.text.split(" ")[2]}> was successfully blacklisted.`)
            }
            let embed = r.message.embeds[0]
            embed.setAuthor(embed.author.name + " -- Resolved with 🔨")
            await r.message.edit(embed)
            await r.message.reactions.removeAll()
            await r.message.react("🔨")
        } else if (r.emoji.name == "🔒") {
            await r.message.reactions.removeAll()
            await r.message.react("🔑")
        }
    }
})
client.on("message", async message => {
    config = JSON.parse(fs.readFileSync("config.json"))
    commands = JSON.parse(fs.readFileSync("commands.json"))
    processes = JSON.parse(fs.readFileSync('processes.json'))

    //Filters
    //Bot
    if (message.author.bot) return;
    if (message.content.includes(`<@!${client.user.id}> prefix`)) return message.channel.send(config.prefix)

    //Modmail
    if (message.channel.type == "dm" && !activeDMs.includes(message.author.id)) {
        if(processes.pendingRestart) return message.channel.send("Bot is pending a restart. Please try again later.")
        let allow = await sqlHelper.checkModMailBlacklist(message.author.id).catch(e => errorHelper.report(message, client, e))
        if (allow) {
            activeDMs.push(message.author.id)
            let confirmModMailEmbed = new Discord.MessageEmbed()
                .setColor("#30ffea")
                .setAuthor("Are you sure you want to send the following message to modmail?")
                .setDescription(`\`\`\`${message.content}\`\`\``)
                .setFooter("Spamming modmail will result in a blacklist.")
            let confirmModMailMessage = await message.channel.send(confirmModMailEmbed)
            let confirmationFilter = (r, u) => !u.bot && (r.emoji.name == "✅" || r.emoji.name == "❌")
            let confirmationCollector = confirmModMailMessage.createReactionCollector(confirmationFilter, { max: 1, time: 60000 })
            confirmationCollector.on('end', async (c, r) => {
                if (r == 'time') {
                    confirmModMailEmbed.setColor("#ff1212")
                        .setAuthor("Modmail cancelled due to time.")
                        .setDescription("")
                        .setFooter("")
                    confirmModMailMessage.edit(confirmModMailEmbed)
                }
            })
            confirmationCollector.on("collect", async (r, u) => {
                if (r.emoji.name == "✅") {
                    async function selectGuild() {
                        return new Promise(async (resolve, reject) => {
                            let emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"]
                            const emojiServers = ['739623118833713214', '738506334521131074', '738504422396788798', '719905601131511850', '719905712507191358', '719930605101383780', '719905684816396359', '719905777363714078', '720260310014885919', '720260593696768061', '720259966505844818', '719905506054897737', '720260132633706577', '719934329857376289', '720260221720592394', '720260562390351972', '720260005487575050', '719905949409869835', '720260467049758781', '720260436875935827', '719905747986677760', '720260079131164692', '719932430126940332', '719905565035200573', '719905806082113546', '722999001460244491', '720260272488710165', '722999622372556871', '720260194596290650', '720260499312476253', '720259927318331513', '722999694212726858', '722999033387548812', '720260531901956166', '720260398103920670', '719905651337461820', '701251065227640932', '729861475698737193', '729859159704600648']
                            let mutualGuilds = []
                            var guild;
                            client.guilds.cache.each(g => {
                                if (g.members.cache.has(message.author.id) && !emojiServers.includes(g.id)) {
                                    mutualGuilds.push(g)
                                }
                            })
                            let guildList = mutualGuilds.length > 10 ? mutualGuilds.map((g, i) => `${i + 1} ${g.name}`).join("\n") : mutualGuilds.map((g, i) => `${emojis[i]} ${g.name}`).join("\n")
                            let promptGuildEmbed = new Discord.MessageEmbed()
                                .setColor("#30ffea")
                                .setAuthor(mutualGuilds.length > 10 ? "Please type the number of server you would like to send this message to:" : "Please select which server you would like to send this message to:")
                                .setDescription(guildList)
                            var promptGuildMessage;
                            if (mutualGuilds.length == 0) {
                                return message.channel.send("Unfortunately, we have no shared servers.")
                            } else if (mutualGuilds.length == 1) {
                                guild = client.guilds.resolve(mutualGuilds[0])
                                resolve(guild)
                                promptGuildEmbed
                                    .setAuthor(`Modmail sent to ${guild}.`)
                                    .setDescription("")
                                    .setFooter("")
                                promptGuildMessage = await message.channel.send(promptGuildEmbed)
                            } else {
                                promptGuildMessage = await message.channel.send(promptGuildEmbed)
                                if (mutualGuilds.length < 10) {
                                    let promptGuildFilter = (r, u) => !u.bot
                                    let promptGuildReactionCollector = promptGuildMessage.createReactionCollector(promptGuildFilter, { max: 1, time: 60000 })
                                    promptGuildReactionCollector.on('end', async (c, r) => {
                                        if (r == 'time') {
                                            promptGuildEmbed.setColor("#ff1212")
                                                .setAuthor("Modmail cancelled due to time.")
                                                .setDescription("")
                                                .setFooter("")
                                            promptGuildMessage.edit(promptGuildEmbed)
                                            reject(undefined)
                                        }
                                    })
                                    promptGuildReactionCollector.on('collect', async (r, u) => {
                                        if (r.emoji.name == "❌") {
                                            promptGuildEmbed.setColor("#ff1212")
                                                .setAuthor("Modmail cancelled.")
                                                .setDescription("")
                                                .setFooter("")
                                            promptGuildMessage.edit(promptGuildEmbed)
                                            reject(undefined)
                                        } else {
                                            guild = guildList.split("\n").find(v => v.split(" ")[0] == r.emoji.name).split(" ").slice(1).join(" ")
                                            guild = mutualGuilds.find(g => g.name == guild)
                                            resolve(guild)
                                            promptGuildEmbed
                                                .setAuthor(`Modmail sent to ${guild}.`)
                                                .setDescription("")
                                                .setFooter("")
                                            await promptGuildMessage.edit(promptGuildEmbed)
                                        }
                                    })
                                    for (var i in mutualGuilds) {
                                        await promptGuildMessage.react(emojis[i])
                                    }
                                    await promptGuildMessage.react("❌")
                                }
                            }
                        })
                    }
                    let guild = await selectGuild().catch(e => errorHelper.report(message, client, e))
                    activeDMs.splice(activeDMs.indexOf(message.author.id), 1)
                    if (!guild) {
                        return message.channel.send("There was some problem selecting a guild.")
                    }
                    let modmailChannel = guild.channels.cache.find(c => c.id == config.channels.log.modmail)
                    if (!modmailChannel) {
                        return message.channel.send("Unfortunately, the guild you have selected does not have a modmail channel.")
                    }
                    let guildMember = guild.members.resolve(message.author)
                    let modmailEmbed = new Discord.MessageEmbed()
                        .setColor("30ffea")
                        .setAuthor(message.author.username + "#" + message.author.discriminator)
                        .setDescription(`${message.author} sent the bot: "${message.content}"`)
                        .setFooter(`User ID: ${message.author.id} | Message ID: ${message.id}`)
                        .setTimestamp()
                    let modmailMessage = await modmailChannel.send(modmailEmbed).catch(e => console.log(e))
                    await modmailMessage.react("🔑")
                } else {
                    activeDMs.splice(activeDMs.indexOf(message.author.id), 1)
                    confirmModMailEmbed.setColor("#ff1212")
                        .setAuthor("Modmail cancelled.")
                        .setDescription("")
                        .setFooter("")
                    confirmModMailMessage.edit(confirmModMailEmbed)
                }
            })
            await confirmModMailMessage.react("✅")
            await confirmModMailMessage.react("❌")
        }
    }

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
    let restrictedCommands = ['addalt', 'afk', 'bazaarparse', 'changename', 'clean', 'kick', 'location', 'lock', 'manualverify', 'manualvetverifiy', 'parsecharacters', 'parsemembers', 'resetafk', 'restart', 'setup', 'suspend', 'unlock', 'unsuspend', 'vetsuspend', 'vetunsuspend']
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
            if(cmd=="report"){
                activeDMs.push(message.author.id)
            }
            if(processes.pendingRestart) return message.channel.send("Bot is pending a restart. Please try again later.")

            //Log into active processes
            var processes = JSON.parse(fs.readFileSync('processes.json'))
            var hidden = args.includes("-hidden") || args.includes("-h") ? true:false
            processes.activeProcesses.push([message.author.id, cmd, message.url, hidden])
            fs.writeFileSync('processes.json', JSON.stringify(processes))
            await processManager.updateStatusMessage(client)
            //Run Command
            await commandFile.run(client, message, args, Discord).catch(e => errorHelper.report(message, client, e));
            //Remove from active processes
            processes = JSON.parse(fs.readFileSync('processes.json'))
            processes.activeProcesses.splice(processes.activeProcesses.indexOf([message.author.id, cmd, message.url, hidden]), 1)
            fs.writeFileSync('processes.json', JSON.stringify(processes))
            await processManager.updateStatusMessage(client)

            activeDMs.splice(activeDMs.indexOf(message.author.id), 1)
        } catch (e) {
            console.log(e)
            await message.channel.send(`There was an error updating the cache: \`\`\`${e}\`\`\``)
            await message.channel.send(`Restarting the bot...`)
            process.exit(1)
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
            errorEmbed.setDescription(`There was a problem processing \`$${cmd}\` for the following reason: \n\nMissing File: \`${e.message.match(/'(.*)'/)[1]}\`.`)
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

process.stdin.resume()
process.on("uncaughtException", async (err) => {
    var owner = await client.users.fetch(config.dev)
    await owner.send(`An uncaught error occured: \`\`\`${err.stack}\`\`\``)
    console.log(err)

    let processes = JSON.parse(fs.readFileSync('processes.json'))
    processes.pendingRestart = true;
    processes.botStatus = "#ff1212"
    processes.additionalInfo = "Unexpected Restart"
    fs.writeFileSync("processes.json", JSON.stringify(processes))
    await processManager.updateStatusMessage(client)
    restart()
})
async function restart() {
    let processes = JSON.parse(fs.readFileSync('processes.json'))
    if(processes.activeProcesses.length > 0){
        let timeout = setTimeout(restart, 5000)
    }else{
        process.exit(1)
    }
}
client.login(config.auth)
async function toTimeString(time) {
    return `${Math.floor(time / 604800000)} Weeks ${Math.floor(time % 604800000) / 86400000} Days`
}