const fs = require('fs')
var sqlHelper = require("../helpers/sqlHelper.js")
var confirmationHelper = require("../helpers/confirmationHelper.js")
var errorHelper = require("../helpers/errorHelper.js")

var reactions = JSON.parse(fs.readFileSync('runTemplates.json'))
exports.run = async (client, message, args, Discord, sudo = false) => {
    if (args.length < 2) {
        return message.channel.send("You are missing some arguments!")
    }
    var config = JSON.parse(fs.readFileSync('config.json'))
    var commands = JSON.parse(fs.readFileSync('commands.json'))
    var afk = JSON.parse(fs.readFileSync("afk.json"))
    var nitroCounter = 0,
        nitroArray = []
    //Clean up config
    for (var i in config.afksettings) {
        if (!isNaN(config.afksettings[i])) {
            config.afksettings[i] = parseInt(config.afksettings[i])
        } else if (typeof config.afksettings[i] == "object") {
            for (var x in config.afksettings[i]) {
                if (!isNaN(config.afksettings[i][x])) {
                    config.afksettings[i][x] = parseInt(config.afksettings[i][x])
                }
            }
        }
    }
    return new Promise(async (resolve, reject) => {
        //Channel type
        if (message.channel.type != "text") {
            await message.channel.send("You cannot use this command here.")
            return reject(false)
        }
        //Command Origin
        var origin =
            message.channel.id == config.channels.veteran.control.command ? 100 :
                message.channel.id == config.channels.normal.control.command ? 10 :
                    message.channel.id == config.channels.event.control.command ? 1 :
                        0
        if (origin == 0) {
            await message.channel.send("You cannot use this command here.")
            return reject(false)
        }

        //Parse Arguments
        var typeArg = args.shift()
        var runType = typeof reactions[typeArg] == 'object' ? typeArg : reactions[typeArg]
        runType = runType ? runType : message.member.id
        var runLocation = args.join(" ")

        if (!runType || !reactions[runType]) {
            await message.channel.send("Invalid run type");
            return reject(false);
        }

        if (runLocation.length > 1024) {
            await message.channel.send(`Location too long: ${runLocation.length}/1024 characters`);
            return reject(false)
        }

        //Other AFKs
        if (afk[origin].afk == true) {
            await message.channel.send("There is already another AFK check up. For more information, please use `runstatus`");
            return reject(false)
        } else {
            afk[origin].afk = true;
            fs.writeFileSync('afk.json', JSON.stringify(afk))
        }

        //Retrieve Channels and Validity
        var [baseChannel, statusChannel, runLogChannel, logChannel, lounge] = await fetchChannels(origin)
        if ([baseChannel, statusChannel, runLogChannel, logChannel, lounge].some(e => !e)) {
            await message.channel.send("Cannot start afk check due to a config error. Please have a moderator check the following in setup:\nclone, control.status, channellog");
            return reject(false)
        }
        var queueChannel = message.guild.channels.cache.find(c => c.id == config.channels.command.queuechannel) // Retrive Queue Sign-up channel
        var next
        var raidingChannel = await createRaidingChannel(baseChannel, lounge, origin).catch(e => errorHelper.report(message, client, e))
        await message.channel.send(`${raidingChannel} has been created. Beginning AFK check in ${config.afksettings.afkdelay / 1000} seconds.`)
        var statusMessage, logMessage, commandMessage
        var statusEmbed = new Discord.MessageEmbed().setColor(reactions[runType].color),
            controlEmbed = new Discord.MessageEmbed().setColor(reactions[runType].color)
        var controlCollector, afkCollector
        await createEmbeds()
        await createCollectors()
        await addReactions()
        //Begins AFK
        //Timing Events
        var timeleft = config.afksettings.afktime
        //Edit AFK every 5 seconds
        var afkEdit = setTimeout(async () => {
            afkEdit = setInterval(async () => {
                timeleft -= 5000;
                statusEmbed.setFooter(`Time Remaining: ${Math.floor(timeleft / 60000)} Minutes ${(timeleft % 60000) / 1000} Seconds`);
                await statusMessage.edit(statusEmbed)
            }, 5000)
        }, config.afksettings.afkdelay)
        var endAfkTimeout = setTimeout(endAfk, config.afksettings.afkdelay + config.afksettings.afktime)
        var opened = false;
        //Define Functions
        async function fetchChannels(origin) {
            //Retrieve IDs
            var raidingChannel = origin == 100 ? config.channels.veteran.clone : origin == 10 ? config.channels.normal.clone : config.channels.event.clone
            var statusChannel = origin == 100 ? config.channels.veteran.control.status : origin == 10 ? config.channels.normal.control.status : config.channels.event.control.status
            var runLogChannel = origin == 100 ? config.channels.veteran.channellog : origin == 10 ? config.channels.normal.channellog : config.channels.event.channellog
            var lounge = origin == 100 ? config.channels.veteran.control.lounge : origin == 10 ? config.channels.normal.control.lounge : config.channels.event.control.lounge
            //Return Channels
            return [await message.guild.channels.cache.find(c => c.id == raidingChannel), await message.guild.channels.cache.find(c => c.id == statusChannel), await message.guild.channels.cache.find(c => c.id == runLogChannel), await message.guild.channels.cache.find(c => c.id == config.channels.log.raid), await message.guild.channels.cache.find(c => c.id == lounge)]
        }
        async function createRaidingChannel(base, lounge, origin) {
            //Create Channel
            var raidingChannel = await base.clone({
                name: `${message.member.nickname.replace(/[^a-z|]/gi, "").split("|")[0]}'s ${reactions[runType].name}`,
                parent: message.channel.parent.id
            })
            await raidingChannel.setPosition(lounge.position) //Set to top of list
            if (reactions[runType].max.length > 0) {
                try {
                    await raidingChannel.setUserLimit(parseInt(reactions[runType].max))
                } catch (e) {
                    errorHelper.report(message, client, e)
                }
            } //Change channel cap if needed
            //Permissions
            let channelPermissions = raidingChannel.permissionOverwrites
            if (origin == 100) {
                channelPermissions.set(config.roles.general.vetraider, {
                    id: config.roles.general.vetraider,
                    allow: "VIEW_CHANNEL"
                })
            } else if (origin == 10) {
                channelPermissions.set(config.roles.general.raider, {
                    id: config.roles.general.raider,
                    allow: "VIEW_CHANNEL"
                })
            } //Allow raider/vetraider to see the channel based on location
            channelPermissions.set(message.guild.id, {
                id: message.guild.id,
                deny: "CONNECT"
            })
            //Next in Queue (normal runs only)
            if (origin == 10 && queueChannel != undefined && config.afksettings.queue == 'true') {
                next = await sqlHelper.nextInQueue(runType);
                next = next.map(r => r.userid)
                for (i in next) {
                    let id = next[i]
                    channelPermissions.set(id, {
                        id: id,
                        type: 'member',
                        allow: 'CONNECT'
                    })
                }
                if (next.length > 0) {
                    queueChannel.send(`${next.map(id => `<@!${id}>`).join(", ")} Please now join the run in ${raidingChannel}! You will no longer be able to join once the channel fills up.`).then(m => m.delete({
                        timeout: 10000
                    }));
                    await sqlHelper.removeFromQueue(next);
                }
            }
            await raidingChannel.overwritePermissions(channelPermissions)
            return raidingChannel
        }
        async function editQueue(queueChannel) {
            //Updating queue message (if applicable)
            let queueMessage = await queueChannel.messages.cache.find(m => m.id == config.afksettings.queueMessage)
            console.log(queueMessage)
            let queueEmbed = queueMessage.embeds[0]
            //Normal voids
            next = await sqlHelper.nextInQueue('void')
            queueEmbed.fields.find(f => f.name.includes("702140045997375558")).value = (next.map(r => `<@!${r.userid}>`).join('\n') || "None")
            //Fullskip voids
            next = await sqlHelper.nextInQueue('fullskipvoid')
            queueEmbed.fields.find(f => f.name.includes("721756760448434278")).value = (next.map(r => `<@!${r.userid}>`).join('\n') || "None")
            //Cult
            next = await sqlHelper.nextInQueue('cult')
            queueEmbed.fields.find(f => f.name.includes("702140045833928964")).value = (next.map(r => `<@!${r.userid}>`).join('\n') || "None")
            queueMessage.edit(queueEmbed)
        }
        async function createEmbeds() {
            let specialReacts = Object.keys(reactions[runType].specialReacts).concat(Object.keys(reactions.global.special))
            let specialReactsResolved = specialReacts.map(id => client.emojis.cache.find(e => e.id == id))
            //Status Embed
            statusEmbed.setAuthor(`${reactions[runType].name} starting soon in ${raidingChannel.name}`, message.author.avatarURL()).setDescription(`${reactions[runType].name} starting soon in ${raidingChannel.name}!\nIf you have any of the following, please react now to get moved in. You will not be able to react once the afk has started.\n\n${specialReactsResolved.join("")}`)
            statusMessage = await statusChannel.send(`@here <@&${runType == 'cult' ? '787198010748567562' : runType.includes('void') ? '787198246111805440' : ''}> ${reactions[runType].name} (${await client.emojis.resolve(reactions[runType].emoji)}) starting in \`${raidingChannel.name}\` in \`${config.afksettings.afkdelay / 1000}\` seconds.`, statusEmbed)
            //Control Embed
            controlEmbed.setDescription(`**[AFK Check](${statusMessage.url}) control panel for \`${raidingChannel.name}\`\nRun Type: \`${reactions[runType].name}\`**`).addField("Location:", runLocation)
            for (var r in specialReactsResolved) {
                controlEmbed.addField(`People who reacted with ${specialReactsResolved[r]}:`, "None")
            }
            if (config.afksettings.queue == "true" && next != undefined) { controlEmbed.addField("Queue:", next.map(r => `<@!${r}>`).slice(0, -1).join(", ") || "None") }
            commandMessage = await message.channel.send(controlEmbed.setFooter("React with 🔓 to open the channel. React with ❌ to abort this AFK check."))
            await commandMessage.react("🔓")
            await commandMessage.react("❌")
            logMessage = await logChannel.send(controlEmbed)
            afk[origin] = {
                afk: true,
                location: runLocation,
                statusMessageId: statusMessage.id,
                infoMessageId: logMessage.id,
                commandMessageId: commandMessage.id,
                earlyLocationIds: []
            }
            fs.writeFileSync('afk.json', JSON.stringify(afk))
        }
        async function createCollectors() {
            controlCollector = commandMessage.createReactionCollector((r, u) => !u.bot && (r.emoji.name == "❌" || r.emoji.name == "🔓"), {
                max: 2
            })
            controlCollector.on('collect', async (r, u) => {
                if (r.emoji.name == "🔓") {
                    await message.channel.send("The channel will be opening in 5 seconds.");
                    await statusChannel.send(`${raidingChannel} opening in 5 seconds!`).then(m => m.delete({
                        timeout: 5000
                    }));
                    setTimeout(openChannel, 5000);
                } else {
                    await abortAfk(u);
                }
            })
            afkCollector = statusMessage.createReactionCollector((r, u) => !u.bot && Object.keys(reactions[runType].specialReacts).concat(Object.keys(reactions.global.special)).includes(r.emoji.id || r.emoji.name))
            afkCollector.on('collect', async (r, u) => {
                await manageReactions(r, u)
            })
        }
        async function openChannel() {
            opened = true;
            let m = await statusChannel.send(`The run in ${raidingChannel} is now open!`)
            await raidingChannel.updateOverwrite(config.roles.general.raider, {
                CONNECT: true
            })
            m.delete({ timeout: 2000 })
            statusEmbed.setDescription(reactions[runType].description)
            await statusMessage.edit(statusEmbed)
            for (var r in reactions[runType].generalReacts) { //Custom Normal
                try {
                    await statusMessage.react(reactions[runType].generalReacts[r])
                } catch (e) {
                    errorHelper.report(message, client, e)
                }
            }
            for (var r in reactions.global.general) { //Global Normal
                try {
                    await statusMessage.react(reactions.global.general[r])
                } catch (e) {
                    errorHelper.report(message, client, e)
                }
            }
            await statusMessage.react("764652567296606258")
        }
        async function addReactions() {
            if (statusEmbed.description == "This afk check has been aborted.") return;
            statusEmbed.setAuthor(`${reactions[runType].name} started in ${raidingChannel.name}`, message.author.avatarURL()).setFooter(`Time Remaining: ${Math.floor(config.afksettings.afktime / 60000)} Minute(s) ${(config.afksettings.afktime % 60000) / 1000} Seconds`)
            await statusMessage.edit(`@here <@&${runType == 'cult' ? '787198010748567562' : runType.includes('void') ? '787198246111805440' : ''}> ${reactions[runType].name} (${await client.emojis.resolve(reactions[runType].emoji)}) started by ${message.author} in \`${raidingChannel.name}\`.`, statusEmbed)
            for (var r of Object.keys(reactions[runType].specialReacts)) { //Custom Special
                try {
                    await statusMessage.react(r)
                } catch (e) {
                    errorHelper.report(message, client, e)
                }
            }
            for (var r of Object.keys(reactions.global.special)) { //Global Special
                try {
                    await statusMessage.react(r)
                } catch (e) {
                    errorHelper.report(message, client, e)
                }
            }
        }
        async function manageReactions(r, u) {
            let member = await message.guild.members.resolve(u)
            //❌ React
            if (r.emoji.id == "764652567296606258") {
                let permcheck = require(`./permcheck.js`)
                var auth = await permcheck.run(client, member, commands.settings.afk.permsint)
                if (auth) endAfk(member)
            }
            //Nitro React
            else if (r.emoji.id == "703409258129129482" && !opened) {
                //Check Enabled
                if (!member.roles.cache.has(config.roles.general.nitro) || !["true", "on", "enabled"].includes(config.afksettings.nitrosettings.enabled.toLowerCase())) {
                    return
                }
                //Check Time
                let user = await sqlHelper.retrieveUser(member.id)
                user.endTime = parseInt(user.lastnitrouse) + parseInt(config.afksettings.nitrosettings.nitrodelay)
                if (user.endTime > Date.now()) return member.send(`You have already used your nitro. It will be available again in ${await toTimeString(user.endTime - Date.now())}`)
                //Move In
                if (!nitroArray.includes(member.id) && nitroCounter < config.afksettings.nitrosettings.amount) {
                    await moveIn(member, raidingChannel, true)
                } else {
                    return member.send("Nitro is no longer available for this AFK check. Please wait for the next one.")
                }

            }
            //Other Reacts + Ticket
            else if (!opened) {
                confirmReaction(r, member)
            }
        }
        async function confirmReaction(r, member) {
            afk = JSON.parse(fs.readFileSync("afk.json"))
            if (r.emoji.name.toLowerCase().includes("planewalker") && !member.roles.cache.has(config.roles.general.rusher)) {
                return
            }
            //Ticket React
            if (r.emoji.id == '764652567103275028') { //Ticket
                if (afk[origin].earlyLocationIds.includes(member.id)) {
                    return member.send("You have already obtained early location from this or another means.")
                } // Pointless Reacts
                let user = await sqlHelper.retrieveUser(member.id) // Get User
                if (user.points < reactions[runType].earlyLocPrice) {
                    return member.send("You do not have enough points to use this feature.")
                } // Check Points
                if (await manageLimits(controlEmbed, r, config.afksettings.ticketamount)) return member.send("There are too many people who have used this. Please try again during the next afk.") // Check Limits
                let confirmationMessage = await member.send(`You currently have ${user.points} points. Would you like to use ${reactions[runType].earlyLocPrice} points for early location?`) // Confirm Use
                let result = await confirmationHelper.confirmMessage(confirmationMessage).catch(e => e)
                if (result) {
                    controlEmbed = commandMessage.embeds[0]
                    await sqlHelper.managePoints(member.id, reactions[runType].earlyLocPrice, "subtract")
                    controlEmbed.fields.find(f => f.name.includes(r.emoji)).value = controlEmbed.fields.find(f => f.name.includes(r.emoji)).value.split(", ").filter(n => n != 'None').concat(`<@!${member.id}>`).join(", ")
                    await commandMessage.edit(controlEmbed)
                    await logMessage.edit(controlEmbed)
                    await giveLocation(member)
                    await moveIn(member, raidingChannel)
                } else {
                    await confirmationMessage.edit("The process has been cancelled.")
                }
            }
            //Custom Special Reacts
            else {
                controlEmbed = commandMessage.embeds[0]
                let confirmationMessage = await member.send(`You have reacted with ${r.emoji} (${r.emoji.name}). If you actually plan on bringing and using a ${r.emoji}, react with the ✅. If this was an accident, or you don't want to bring and use the ${r.emoji}, react with the ❌.`)
                let result = await confirmationHelper.confirmMessage(confirmationMessage).catch(e => e)
                if (result) {
                    controlEmbed = commandMessage.embeds[0]
                    if (await manageLimits(controlEmbed, r, reactions[runType].specialReacts[r.emoji.id] || reactions.global.special[r.emoji.id])) return member.send("There are too many people who have reacted with this. Please try again during the next afk.")
                    //Deal with duplicate reacts
                    if (controlEmbed.fields.find(f => f.name.includes(r.emoji)).value.includes(member.id)) return member.send(`You have already reacted with ${r.emoji}.`)
                    controlEmbed.fields.find(f => f.name.includes(r.emoji)).value = controlEmbed.fields.find(f => f.name.includes(r.emoji)).value.split(", ").filter(n => n != 'None').concat(`<@!${member.id}>`).join(", ")
                    await commandMessage.edit(controlEmbed)
                    await logMessage.edit(controlEmbed)
                    await giveLocation(member)
                    await moveIn(member, raidingChannel)
                } else {
                    await confirmationMessage.edit("The process has been cancelled.")
                }
            }
        }
        async function manageLimits(controlEmbed, r, limit) {
            return (controlEmbed.fields.find(f => f.name.includes(r.emoji)).value.split(", ").filter(n => n != 'None').length >= limit)
        }
        async function giveLocation(user) {
            afk = JSON.parse(fs.readFileSync("afk.json"))
            await user.send(`The location of this run has been set to: \`${afk[origin].location}\``)
            afk[origin].earlyLocationIds.push(user.id)
            afk[origin].earlyLocationIds = [...new Set(afk[origin].earlyLocationIds)]
            fs.writeFileSync('afk.json', JSON.stringify(afk))
        }
        async function moveIn(user, channel, nitro) {
            if (user.voice.channel && user.voice.channelID != channel.id) {
                try {
                    await user.voice.setChannel(channel);
                    await user.send(`You have been moved into \`${channel.name}\``);
                    if (nitro) {
                        nitroCounter += 1;
                        nitroArray.push(user.id);
                        await sqlHelper.editUser("users", user.id, "lastnitrouse", `${Date.now()}`).catch(e => errorHelper.report(message, client, e))
                    }
                } catch (e) {
                    message.channel.send(`${user} reacted with nitro, but they could not be moved in.`)
                }
            } else if (!user.voice.channel) {
                let dragMessage = await user.send("You are not currently in a Voice Channel. Once you have joined any voice channel (Prefereably #lounge ASAP), react to the ✅ to get moved in to the voice channel. You can cancel at any time by reacting to the ❌.")
                let dragCollector = dragMessage.createReactionCollector((r, u) => !u.bot && (r.emoji.name == "✅" || r.emoji.name == "❌"), {
                    time: 30000
                })
                await dragMessage.react("✅")
                await dragMessage.react("❌")
                dragCollector.on('end', async (r) => {
                    if (r == "time") await dragMessage.edit("The dragging process has automatically ended.")
                })
                dragCollector.on('collect', async (r, u) => {
                    if (r.emoji.name == "✅") {
                        try {
                            await user.voice.setChannel(channel)
                            await dragMessage.edit("You have successfully been dragged in to the voice channel.")
                            if (nitro) {
                                nitroCounter += 1;
                                nitroArray.push(user.id);
                                await sqlHelper.editUser("users", user.id, "lastnitrouse", `${Date.now()}`).catch(e => errorHelper.report(message, client, e))
                            }
                            dragCollector.stop()
                        } catch (e) {
                            await dragMessage.edit("The attempt to drag you in was unsuccessful. Please unreact and try again.")
                        }
                    } else if (r.emoji.name == "❌") {
                        await dragMessage.edit("The dragging process has been cancelled.")
                        dragCollector.stop()
                    }
                })
            } else {
                await reactor.send(`You are already in ${raidingChannel.name}`)
                return true
            }
        }
        async function endAfk(member) {
            //Remove users from queue
            sqlHelper.removeFromQueue(raidingChannel.members.map(m => m.id))
            //Stop Collectors
            afkCollector.stop()
            controlCollector.stop()
            //Clear Timers
            clearInterval(afkEdit)
            clearTimeout(endAfkTimeout)
            //Edit Messages
            controlEmbed = commandMessage.embeds[0]
            controlEmbed.setFooter(member ? `This AFK Check has been ended by ${member.displayName}` : `This AFK Check has ended automatically.`)
            statusEmbed.setDescription(`This afk check has ended. We are currently running with ${raidingChannel.members.map(u => u.id).length} raiders.\nIf you missed this run, another will be starting shortly.\nIf you get disconnected from the voice channel, send \`${config.prefix}join\` in any commands channel.`).setFooter(member ? `This AFK Check has been ended by ${member.displayName}` : `This AFK Check has ended automatically.`).setTimestamp()
            await commandMessage.edit(controlEmbed).then(m => m.reactions.removeAll())
            await logMessage.edit(controlEmbed)
            await statusMessage.edit("", statusEmbed)
            //Edit raiding channel
            await raidingChannel.updateOverwrite(config.roles.general.raider, {
                CONNECT: false
            })
            await raidingChannel.updateOverwrite(config.roles.general.vetraider, {
                CONNECT: false
            })
            await raidingChannel.edit({
                position: raidingChannel.parent.children.filter(c => c.type == "voice").size - 1
            }).catch(e => errorHelper.report(message, client, e))
            //Log Key Pop/Points
            try {
                let keyId = controlEmbed.fields.find(f => f.name.includes("lhkey")).value.substring(controlEmbed.fields.find(f => f.name.includes('key')).value.indexOf(": ")).replace(/[^0-9]/gi, "");
                if (keyId.length > 0) {
                    await sqlHelper.editUser("users", keyId, "keypops", 1);
                    await sqlHelper.managePoints(keyId, 5, 'add', message.guild.members.cache.find(m => m.id == keyId).roles.cache.has(config.roles.general.nitro) ? 2 : 1)
                }
            } catch (e) {
                errorHelper.report(message, client, e)
            }
            //Log Runs
            try {
                raidingChannel.members.each(async m => {
                    await sqlHelper.editUser("users", m.id, (runType != "void" && runType != "cult") ? `eventruns` : `${runType}Runs`, 1)
                })
            } catch (e) {
                errorHelper.report(message, client, e)
            }
            //Edit Queue Message
            if (config.afksettings.queue == 'true') editQueue(queueChannel)
            //Delete Message
            let runEmbed = new Discord.MessageEmbed().setColor(reactions[runType].color).setAuthor(`${reactions[runType].name} by ${message.member.displayName.replace(/[^a-z|]/gi, "").split("|")[0]}`).setDescription(`Once your run is complete, react with the ❌ to delete your channel.`).setFooter("Run started at ").setTimestamp()
            let runMessage = await runLogChannel.send(`${message.member}`, runEmbed)
            await runMessage.react("❌")
            //Log Channels
            JSON.parse(fs.readFileSync('afk.json'))
            afk.currentRuns[runMessage.id] = raidingChannel.id
            fs.writeFileSync('afk.json', JSON.stringify(afk))
            let currentAfks = JSON.parse(fs.readFileSync("currentAfks.json"))
            currentAfks[raidingChannel.id] = {
                "channelId": raidingChannel.id,
                "guildId": message.guild.id,
                "raidLeader": message.member.id,
                "earlyUsers": afk.earlyLocationIds,
                "allRaiders": raidingChannel.members.map(m => m.id)
            }
            fs.writeFileSync("currentAfks.json", JSON.stringify(currentAfks))
            //Clear AFK 
            afk[origin] = {
                "afk": false,
                "location": "",
                "statusMessageId": "",
                "infoMessageId": "",
                "commandMessageId": "",
                "earlyLocationIds": []
            }
            fs.writeFileSync('afk.json', JSON.stringify(afk))
            return resolve(true)
        }
        async function abortAfk(u) {
            //Stop Collectors
            controlCollector.stop()
            afkCollector.stop()
            //Stop Timers
            clearInterval(afkEdit)
            clearTimeout(endAfkTimeout)
            //Edit Messages
            controlEmbed = commandMessage.embeds[0]
            controlEmbed.setFooter(`This afk check was aborted by ${await message.guild.members.fetch(u).then(m => m.nickname).catch(e => e)}`)
            statusEmbed.setDescription(`This afk check has been aborted.`).setFooter(`The afk check has been aborted by ${await message.guild.members.fetch(u).then(m => m.nickname).catch(e => e)}`).setTimestamp()
            await commandMessage.edit(controlEmbed).then(m => m.reactions.removeAll())
            await logMessage.edit(controlEmbed)
            await statusMessage.edit("", statusEmbed)
            //Remove from afk log
            afk[origin] = {
                "afk": false,
                "location": "",
                "statusMessageId": "",
                "infoMessageId": "",
                "commandMessageId": "",
                "earlyLocationIds": []
            }
            fs.writeFileSync('afk.json', JSON.stringify(afk))
            //Delete channel
            raidingChannel.delete()
            return reject(false)
        }
        async function toTimeString(time) {
            return `${Math.floor(time / 86400000)} Days ${Math.floor((time - Math.floor(time / 86400000) * 86400000) / 3600000)} Hours ${Math.round((time - Math.floor(time / 86400000) * 86400000 - Math.floor((time - Math.floor(time / 86400000) * 86400000) / 3600000) * 3600000) / 60000)} Minutes`
        }
    })
}