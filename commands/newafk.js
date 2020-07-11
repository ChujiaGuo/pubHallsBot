const fs = require('fs')
var sqlHelper = require("../helpers/sqlHelper.js")

exports.run = async (client, message, args, Discord, sudo = false) => {
    var config = JSON.parse(fs.readFileSync("config.json"))
    var commands = JSON.parse(fs.readFileSync("commands.json"))
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
    var nitrodelay = JSON.parse(fs.readFileSync("nitrodelay.json"))
    var afk = JSON.parse(fs.readFileSync("afk.json"))

    //Check Perms
    if (message.channel.type != 'text') {
        return message.channel.send("You cannot use this command here.")
    }
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
    //Argument Parsing
    //Channel Number
    var cloneChannel = args.shift()
    var runType = cloneChannel
    if (!isNaN(cloneChannel)) {
        return message.channel.send(`It seems you have added a channel number. This new afk style does not use channel numbers. Please try again.`)
    }
    var statusChannel, runLogChannel;

    //Retrieve Clone Channel
    if (origin == 100) {
        cloneChannel = config.channels.veteran.clone
        statusChannel = config.channels.veteran.control.status
        runLogChannel = config.channels.veteran.channellog
    } else if (origin == 10) {
        cloneChannel = config.channels.normal.clone
        statusChannel = config.channels.normal.control.status
        runLogChannel = config.channels.normal.channellog
    } else if (origin = 1) {
        return message.channel.send("If you would like to do an event afk, please use `eventafk`.")
        cloneChannel = config.channels.event.clone
        statusChannel = config.channels.event.control.status
        runLogChannel = config.channels.event.channellog
    } else {
        return message.channel.send("You should not be here.")
    }
    //Fetch channels
    var raidingChannel = await message.guild.channels.cache.find(c => c.id == cloneChannel)
    var statusChannel = await message.guild.channels.cache.find(c => c.id == statusChannel)
    var runLogChannel = await message.guild.channels.cache.find(c => c.id == runLogChannel)
    if (!raidingChannel || !statusChannel || !runLogChannel) {
        return message.channel.send("Cannot start afk due to a config error. Please have a mod look at it.")
    }
    var logChannel = message.guild.channels.cache.find(c => c.id == config.channels.log.raid)

    //Run Type
    if (!dungeons.hasOwnProperty(runType)) {
        return message.channel.send(`\`${runType}\` is not a valid run type. Please check your spelling.`)
    }
    runType = dungeons[runType]
    var runName = ""
    //Run Type Emoji
    var mainEmoji
    if (runType == 'cult') {
        mainEmoji = cult
        runName = "Cult"
    } else if (runType == 'void') {
        mainEmoji = entity
        runName = "Void"
    } else if (runType == 'fullskipvoid') {
        mainEmoji = speedy
        runName = "Fullskip Void"
    } else if (runType == 'oryx3') {
        mainEmoji == oryx
        runName = "Oryx 3"
    } else {
        mainEmoji == portal
        runName = "Event"
    }

    //Location
    var runLocation = args.join(' ').trim()
    if (runLocation.length == 0) {
        return message.channel.send("Please input a location.")
    }
    afk[origin].location = runLocation
    fs.writeFileSync('afk.json', JSON.stringify(afk))

    //Check for other afks
    if (afk[origin].afk == true) {
        return message.channel.send("There is already another AFK check up. For more information, please use `runstatus`.")
    } else {
        afk[origin].afk = true
        fs.writeFileSync('afk.json', JSON.stringify(afk))
    }

    //Create the raiding channel
    var lounge;
    var parentID;
    if (origin == 100) {
        lounge = config.channels.veteran.control.lounge
        parentID = config.channels.veteran.parent
    } else if (origin == 10) {
        lounge = config.channels.normal.control.lounge
        parentID = config.channels.normal.parent
    } else if (origin == 1) {
        lounge = config.channels.event.control.lounge
        parentID = config.channels.event.parent
    }
    lounge = await message.guild.channels.cache.find(c => c.id == lounge)
    raidingChannel = await raidingChannel.clone({ name: `${message.member.nickname.replace(/[^a-z|]/gi, "").split("|")[0]}'s ${runName}`, parent: message.channel.parent.id })
    await raidingChannel.setPosition(lounge.position)
    await raidingChannel.updateOverwrite(config.roles.general.raider, {
        CONNECT: true,
        VIEW_CHANNEL: true
    })
    if (origin == 100) {
        await raidingChannel.updateOverwrite(config.roles.general.vetraider, {
            CONNECT: true,
            VIEW_CHANNEL: true
        })
        await raidingChannel.updateOverwrite(config.roles.general.raider, {
            CONNECT: false,
            VIEW_CHANNEL: false
        })
    }
    await message.channel.send(`${raidingChannel.name} has been created. Beginning AFK Check.`)

    await raidingChannel.setUserLimit(config.afksettings.maxinraiding)

    //Define Messages and Embeds
    var statusMessage, logMessage, commandMessage
    var statusEmbed = new Discord.MessageEmbed(), controlEmbed = new Discord.MessageEmbed()

    //Setting up the embeds
    var afkFilter = (r, u) => !u.bot && (["702140477432004618", "702140045871808632", "702154477569835048", "702131716726456501", "702140245159837717", "702141265545920562", "702141266057625721", "707410220883902514", "707410220674056223", "707410220607078412"].includes(r.emoji.id) || r.emoji.name == "❌")
    var afkCollector
    await beginAfk(runType, statusEmbed)
    afkCollector = statusMessage.createReactionCollector(afkFilter)
    var afkTimeout = setTimeout(async () => {
        addReactions(runType, statusEmbed)
    }, config.afksettings.afkdelay)
    //Put AFK Info into file
    afk[origin].statusMessageId = statusMessage.id
    afk[origin].infoMessageId = logMessage.id
    afk[origin].commandMessageId = commandMessage.id
    fs.writeFileSync('afk.json', JSON.stringify(afk))

    //Timing Events
    var timeleft = config.afksettings.afktime
    //Edit AFK every 5 seconds
    var afkEdit;
    afkEdit = setTimeout(async () => {
        afkEdit = setInterval(async () => {
            timeleft -= 5000
            statusEmbed.setFooter(`Time Remaining: ${Math.floor(timeleft / 60000)} Minutes ${(timeleft % 60000) / 1000} Seconds`)
            await statusMessage.edit(statusEmbed)
        }, 5000)
    }, config.afksettings.afkdelay)
    var endAfkTimeout = setTimeout(endAfk, config.afksettings.afkdelay + config.afksettings.afktime)

    //Dealing with reactions 
    var nitroCounter = 0;
    var nitroArray = [];

    //Collector on Main Run Message
    afkCollector.on('collect', async (r, u) => {
        await manageReactions(r, u)
    })

    //Abort Collector
    var controlFilter = (r, u) => !u.bot && r.emoji.name == "❌"
    var controlCollector = commandMessage.createReactionCollector(controlFilter)
    controlCollector.on('collect', async r => {
        await abortAfk(r)
    })

    //Define functions
    async function beginAfk(runType) {
        //Sending the announcement message
        if (runType == 'cult') {
            statusEmbed
                .setColor("#ff1212")
                .setAuthor(`Cult starting soon in ${raidingChannel.name}`, message.author.avatarURL())
                .setDescription(`Cult starting soon in ${raidingChannel.name}! Be prepared to join.`)
            statusMessage = await statusChannel.send(`@here \`Cult\` (${cult}) starting in \`${raidingChannel.name}\` by <@${message.author.id}> in \`${config.afksettings.afkdelay / 1000}\` seconds.`, statusEmbed)
            controlEmbed
                .addField("Location:", runLocation)
                .addField(`People who reacted with ${key}:`, "None")
                .setColor("#ff1212")
                .setDescription(`**[AFK Check](${statusMessage.url}) control panel for \`${raidingChannel.name}\`\nRun Type: \`Cult\`**`)
                .addField(`People who reacted with ${rusher}:`, "None")
                .addField("Nitro Boosters:", "None")
            commandMessage = await message.channel.send(controlEmbed)
            logMessage = await logChannel.send(controlEmbed)
        } else if (runType == 'void') {
            statusEmbed
                .setColor("#000080")
                .setAuthor(`Void starting soon in ${raidingChannel.name}`, message.author.avatarURL())
                .setDescription(`Void starting soon in ${raidingChannel.name}! Be prepared to join.`)
            statusMessage = await statusChannel.send(`@here \`Void\` (${entity}) starting in \`${raidingChannel.name}\` by <@${message.author.id}> in \`${config.afksettings.afkdelay / 1000}\` seconds.`, statusEmbed)
            controlEmbed
                .addField("Location:", runLocation)
                .addField(`People who reacted with ${key}:`, "None")
                .setColor("#000080")
                .setDescription(`**[AFK Check](${statusMessage.url}) control panel for \`${raidingChannel.name}\`\nRun Type: \`Void\`**`)
                .addField(`People who reacted with ${vial}:`, "None")
                .addField("Nitro Boosters:", "None")
            commandMessage = await message.channel.send(controlEmbed)
            logMessage = await logChannel.send(controlEmbed)
        } else if (runType == 'fullskipvoid') {
            statusEmbed
                .setColor("#000080")
                .setAuthor(`Fullskip Void starting soon in ${raidingChannel.name}`, message.author.avatarURL())
                .setDescription(`Fullskip Void starting soon in ${raidingChannel.name}! Be prepared to join.`)
            statusMessage = await statusChannel.send(`@here \`Fullskip Void\` (${speedy}) starting in \`${raidingChannel.name}\` by <@${message.author.id}> in \`${config.afksettings.afkdelay / 1000}\` seconds.`, statusEmbed)
            controlEmbed
                .addField("Location:", runLocation)
                .addField(`People who reacted with ${key}:`, "None")
                .setColor("#000080")
                .setDescription(`**[AFK Check](${statusMessage.url}) control panel for \`${raidingChannel.name}\`\nRun Type: \`Fullskip Void\`**`)
                .addField(`People who reacted with ${vial}:`, "None")
                .addField(`People who reacted with ${brain}:`, "None")
                .addField(`People who reacted with ${mystic}:`, "None")
                .addField("Nitro Boosters:", "None")
            commandMessage = await message.channel.send(controlEmbed)
            logMessage = await logChannel.send(controlEmbed)
        } else if (runType == 'o3') {
            statusEmbed
                .setColor("#ffffff")
                .setAuthor(`Oryx 3 starting soon in ${raidingChannel.name}`, message.author.avatarURL())
                .setDescription(`Oryx 3 starting soon in ${raidingChannel.name}! Be prepared to join.`)
            statusMessage = await statusChannel.send(`@here \`Oryx 3\` (${oryx}) starting in \`${raidingChannel.name}\` by <@${message.author.id}> in \`${config.afksettings.afkdelay}\` seconds.`, statusEmbed)
            controlEmbed
                .addField("Location:", runLocation)
                .addField(`People who reacted with ${helmetRune}:`, "None")
                .addField(`People who reacted with ${swordRune}:`, "None")
                .addField(`People who reacted with ${shieldRune}:`, "None")
                .setColor("#ffffff")
                .setDescription(`**[AFK Check](${statusMessage.url}) control panel for \`${raidingChannel.name}\`\nRun Type: \`Oryx 3\`**`)
                .addField("Nitro Boosters:", "None")
            commandMessage = await message.channel.send(controlEmbed)
            logMessage = await logChannel.send(controlEmbed)
        } else if (runType == 'realmclearing') {

        }
        await commandMessage.react("❌")
    }
    async function addReactions(runType) {
        //Adding reactions and editing the first message
        if (runType == 'cult') {
            statusEmbed
                .setColor("#ff1212")
                .setAuthor(`Cult started by ${message.member.nickname} in ${raidingChannel.name}`, message.author.avatarURL())
                .setDescription(`To join, **connect to the raiding channel** and then react with ${mainEmoji}\nIf you have a key, react with ${key}\nIf you are bringing one of the following classes, please with react that class respectively ${warrior}${pally}${knight}\nIf you are bringing one of the following items (and plan on using it), please react with that item respectively ${mseal}${puri}\nIf you plan on rushing and have the <@&${config.roles.general.rusher}> role, you may react with ${rusher}\nIf you have the <@&${config.roles.general.nitro}> role, you may react with ${shinynitro} for early location\n(10 max, randomly chosen)\nTo end this AFK Check, the raid leader can react with ❌`)
                .setFooter(`Time Remaining: ${Math.floor(config.afksettings.afktime / 60000)} Minutes ${(config.afksettings.afktime % 60000) / 1000} Seconds`)
            await statusMessage.edit(`@here \`Cult\` (${cult}) started by <@${message.author.id}> in \`${raidingChannel.name}\``, statusEmbed)
            await raidingChannel.updateOverwrite(config.roles.general.raider, {
                'CONNECT': true
            })
            if (!raidingChannel.name.includes(" <-- Join!")) {
                await raidingChannel.setName(raidingChannel.name + " <-- Join!")
            }
            await statusMessage.edit(statusEmbed)
            await statusMessage.react(mainEmoji.slice(1, -1))
            await statusMessage.react(key.slice(1, -1))
            await statusMessage.react(warrior.slice(1, -1))
            await statusMessage.react(pally.slice(1, -1))
            await statusMessage.react(knight.slice(1, -1))
            await statusMessage.react(puri.slice(1, -1))
            await statusMessage.react(mseal.slice(1, -1))
            await statusMessage.react(rusher.slice(1, -1))
            if (["true", "on", "enabled"].includes(config.afksettings.nitrosettings.enabled.toLowerCase())) {
                await statusMessage.react(shinynitro.slice(1, -1))
            }
            await statusMessage.react('❌')
        } else if (runType == 'void') {
            statusEmbed
                .setColor("#000080")
                .setAuthor(`Void started by ${message.member.nickname} in ${raidingChannel.name}`, message.author.avatarURL())
                .setDescription(`To join, **connect to the raiding channel** and then react with ${mainEmoji}\nIf you have a key or a vial, react with ${key} or ${vial} respectively\nIf you are bringing one of the following classes, please react with that class respectively ${warrior}${pally}${knight}\nIf you are bringing one of the following items (and plan on using it), please react with that item respectively ${mseal}${puri}\nIf you plan on rushing and have the <@&${config.roles.general.rusher}> role, you may react with ${rusher}\nIf you have the <@&${config.roles.general.nitro}> role, you may react with the ${shinynitro} for early location\n(10 max, randomly chosen)\nTo end this AFK Check, the raid leader can react with the ❌`)
                .setFooter(`Time Remaining: ${Math.floor(config.afksettings.afktime / 60000)} Minutes ${(config.afksettings.afktime % 60000) / 1000} Seconds`)
            await statusMessage.edit(`@here \`Void\` (${entity}) started by <@${message.author.id}> in \`${raidingChannel.name}\``, statusEmbed)
            await raidingChannel.updateOverwrite(config.roles.general.raider, {
                'CONNECT': true
            })
            if (!raidingChannel.name.includes(" <-- Join!")) {
                await raidingChannel.setName(raidingChannel.name + " <-- Join!")
            }
            await statusMessage.edit(statusEmbed)
            await statusMessage.react(mainEmoji.slice(1, -1))
            await statusMessage.react(key.slice(1, -1))
            await statusMessage.react(vial.slice(1, -1))
            await statusMessage.react(warrior.slice(1, -1))
            await statusMessage.react(pally.slice(1, -1))
            await statusMessage.react(knight.slice(1, -1))
            await statusMessage.react(puri.slice(1, -1))
            await statusMessage.react(mseal.slice(1, -1))
            if (["true", "on", "enabled"].includes(config.afksettings.nitrosettings.enabled.toLowerCase())) {
                await statusMessage.react(shinynitro.slice(1, -1))
            }
            await statusMessage.react('❌')
        } else if (runType == 'fullskipvoid') {
            statusEmbed
                .setColor("#000080")
                .setAuthor(`Fullskip Void started by ${message.member.nickname} in ${raidingChannel.name}`, message.author.avatarURL())
                .setDescription(`To join, **connect to the raiding channel** and then react with ${mainEmoji}\nIf you have a key or a vial, react with ${key} or ${vial} respectively\nIf you are bringing one of the following classes, please react that with class respectively ${warrior}${pally}${knight}\nIf you are bringing one of the following items (and plan on using it), please react with that item respectively ${mseal}${puri}\nIf have a mystic or a brain trickster and plan on bringing it, react with the one you are bringing ${mystic}${brain}\nIf you have the <@&${config.roles.general.nitro}> role, you may react with the ${shinynitro} for early location (10 max, randomly chosen)\nTo end this AFK Check, the raid leader can react with the ❌`)
                .setFooter(`Time Remaining: ${Math.floor(config.afksettings.afktime / 60000)} Minutes ${(config.afksettings.afktime % 60000) / 1000} Seconds`)
            await statusMessage.edit(`@here \`Fullskip Void\` (${entity}) started by <@${message.author.id}> in \`${raidingChannel.name}\``, statusEmbed)
            await raidingChannel.updateOverwrite(config.roles.general.raider, {
                'CONNECT': true
            })
            if (!raidingChannel.name.includes(" <-- Join!")) {
                await raidingChannel.setName(raidingChannel.name + " <-- Join!")
            }
            await statusMessage.edit(statusEmbed)
            await statusMessage.react(mainEmoji.slice(1, -1))
            await statusMessage.react(key.slice(1, -1))
            await statusMessage.react(vial.slice(1, -1))
            await statusMessage.react(warrior.slice(1, -1))
            await statusMessage.react(pally.slice(1, -1))
            await statusMessage.react(knight.slice(1, -1))
            await statusMessage.react(puri.slice(1, -1))
            await statusMessage.react(mseal.slice(1, -1))
            await statusMessage.react(brain.slice(1, -1))
            await statusMessage.react(mystic.slice(1, -1))
            if (["true", "on", "enabled"].includes(config.afksettings.nitrosettings.enabled.toLowerCase())) {
                await statusMessage.react(shinynitro.slice(1, -1))
            }
            await statusMessage.react('❌')
        } else if (runType == 'o3') {
            statusEmbed
                .setColor("#ffffff")
                .setAuthor(`Oryx 3 started by ${message.member.nickname} in ${raidingChannel.name}`, message.author.avatarURL())
                .setDescription(`To join, **connect to the raiding channel** and then react with ${oryx}\nIf you have a rune, please react with your respective rune. ${helmetRune}${swordRune}${shieldRune}\nIf you are bringing one of the following classes, please react that with class respectively ${warrior}${pally}${knight}\nIf you are bringing one of the following items (and plan on using it), please react with that item respectively ${mseal}${puri}\nIf you have the <@&${config.roles.general.nitro}> role, you may react with the ${shinynitro} for early location (10 max)\nTo end this AFK Check, the raid leader can react with the ❌`)
                .setFooter(`Time Remaining: ${Math.floor(config.afksettings.afktime / 60000)} Minutes ${(config.afksettings.afktime % 60000) / 1000} Seconds`)
            await statusMessage.edit(`@here \`Oryx 3\` (${oryx}) started by <@${message.author.id}> in \`${raidingChannel.name}\``, statusEmbed)
            await raidingChannel.updateOverwrite(config.roles.general.raider, {
                'CONNECT': true
            })
            if (!raidingChannel.name.includes(" <-- Join!")) {
                await raidingChannel.setName(raidingChannel.name + " <-- Join!")
            }
            await statusMessage.edit(statusEmbed)
            await statusMessage.react(mainEmoji.slice(1, -1))
            await statusMessage.react(helmetRune.slice(1, -1))
            await statusMessage.react(swordRune.slice(1, -1))
            await statusMessage.react(shieldRune.slice(1, -1))
            await statusMessage.react(warrior.slice(1, -1))
            await statusMessage.react(pally.slice(1, -1))
            await statusMessage.react(knight.slice(1, -1))
            await statusMessage.react(puri.slice(1, -1))
            await statusMessage.react(mseal.slice(1, -1))
            if (["true", "on", "enabled"].includes(config.afksettings.nitrosettings.enabled.toLowerCase())) {
                await statusMessage.react(shinynitro.slice(1, -1))
            }
            await statusMessage.react('❌')
        } else if (runType == 'realmclearing') {

        }
    }
    async function endAfk(member) {
        try {
            //Stop reaction collectors
            clearInterval(afkEdit)
            clearTimeout(endAfkTimeout)
            afkCollector.stop()
            controlCollector.stop()
        } catch (e) { console.log(e) }
        //Edit AFK status
        afk[origin] = {
            "afk": false,
            "location": "",
            "statusMessageId": "",
            "infoMessageId": "",
            "commandMessageId": "",
            "earlyLocationIds": []
        }
        fs.writeFileSync('afk.json', JSON.stringify(afk))
        //Edit the embeds
        if (member) {
            controlEmbed.setFooter(`The afk check has been ended by ${member.displayName}`)
            statusEmbed.setFooter(`The afk check has been ended by ${member.displayName}`)
        } else {
            controlEmbed.setFooter(`The afk check has ended automatically.`)
            statusEmbed.setFooter(`The afk check ended automatically.`)
        }
        await commandMessage.edit(controlEmbed).catch(e => console.log(e))
        await logMessage.edit(controlEmbed).catch(e => console.log(e))
        try {
            await commandMessage.reactions.removeAll().catch(e => console.log(e))
        } catch (e) { }
        statusEmbed
            .setDescription(`The afk check has ended. We are currently running with ${raidingChannel.members.map(u => u.id).length} raiders.\nIf you missed this run, another will be starting shortly.`)
            .setTimestamp()
        await statusMessage.edit("", statusEmbed).catch(e => console.log(e))
        try {
            await message.reply(`Remember to log the key pop! The command is: \`-pop lh ${controlEmbed.fields.find(f => f.name.includes("lhkey")).value.substring(controlEmbed.fields.find(f => f.name.includes(key)).value.indexOf(": ")).replace(/[^0-9]/gi, "")}\``)
        } catch (e) {
            console.log(e)
        }
        //Edit the channel
        let newName = ""
        newName = raidingChannel.name.replace(" <-- Join!", "")
        await raidingChannel.updateOverwrite(config.roles.general.raider, {
            CONNECT: false
        })
        await raidingChannel.edit({ name: newName, position: raidingChannel.parent.children.filter(c => c.type == "voice").size - 1 }).catch(e => console.log(e))
        let runEmbed = new Discord.MessageEmbed()
        if (runType == "cult") {
            runEmbed
                .setColor("#ff1212")
                .setAuthor(`Cult by ${message.member.nickname.replace(/[^a-z|]/gi, "").split("|")[0]}`)
                .setDescription(`Once your run is complete, react with the ❌ to delete your channel.`)
                .setFooter(`Run started at`)
                .setTimestamp()
        } else if (runType == "void") {
            runEmbed
                .setColor("#000080")
                .setAuthor(`Void by ${message.member.nickname.replace(/[^a-z|]/gi, "").split("|")[0]}`)
                .setDescription(`Once your run is complete, react with the ❌ to delete your channel.`)
                .setFooter(`Run started at`)
                .setTimestamp()
        } else if (runType == "fullskipvoid") {
            runType = "void"
            runEmbed
                .setColor("#000080")
                .setAuthor(`Fullskip Void by ${message.member.nickname.replace(/[^a-z|]/gi, "").split("|")[0]}`)
                .setDescription(`Once your run is complete, react with the ❌ to delete your channel.`)
                .setFooter(`Run started at`)
                .setTimestamp()
        } else if (runType == "oryx3") {
            runType = "event"
            runEmbed
                .setColor("#ffffff")
                .setAuthor(`Oryx 3 by ${message.member.nickname.replace(/[^a-z|]/gi, "").split("|")[0]}`)
                .setDescription(`Once your run is complete, react with the ❌ to delete your channel.`)
                .setFooter(`Run started at`)
                .setTimestamp()
        }
        let runMessage = await runLogChannel.send(`<@!${message.author.id}>`, runEmbed)
        await runMessage.react("❌")
        afk.currentRuns[runMessage.id] = raidingChannel.id
        fs.writeFileSync('afk.json', JSON.stringify(afk))
        //Log in database
        try {
            //Log Key Pop
            await sqlHelper.editUser("users", controlEmbed.fields.find(f => f.name.includes("lhkey")).value.substring(controlEmbed.fields.find(f => f.name.includes(key)).value.indexOf(": ")).replace(/[^0-9]/gi, ""), "keypops", 1)
            //Log Runs
            if (runType != "void" && runType != "cult") {
                raidingChannel.members.each(async m => {
                    await sqlHelper.editUser("users", m.id, `eventruns`, 1)
                })
            } else {
                raidingChannel.members.each(async m => {
                    await sqlHelper.editUser("users", m.id, `${runType}Runs`, 1)
                })
            }
            //Close Connection
            await sqlHelper.close()
        } catch (e) {
            console.log(e)
        }
    }
    async function abortAfk(r) {
        var reactor = await r.users.cache.map(u => u.id)
        reactor = await message.guild.members.fetch(reactor[reactor.length - 1])
        controlEmbed = commandMessage.embeds[0]
        //Aborting the afk check
        let commandFile = require(`./permcheck.js`);
        var auth = true;
        if (auth) {
            afkCollector.stop()
            controlCollector.stop()
            clearTimeout(afkTimeout)
            clearTimeout(endAfkTimeout)
            clearTimeout(afkEdit)
            clearInterval(afkEdit)
            try {
                await commandMessage.reactions.removeAll()
            } catch (e) { }
            let thing = await statusMessage.reactions.cache.find(r => r.emoji.name == '❌')
            if (thing) {
                try {
                    await thing.remove()
                } catch (e) { }
            }
            statusEmbed
                .setDescription(`The afk check has been aborted.`)
                .setFooter(`The afk check has been aborted by ${reactor.nickname}`)
                .setTimestamp()
            await statusMessage.edit("", statusEmbed)
            afk[origin] = {
                "afk": false,
                "location": "",
                "statusMessageId": "",
                "infoMessageId": "",
                "commandMessageId": "",
                "earlyLocationIds": []
            }
            fs.writeFileSync('afk.json', JSON.stringify(afk))
            controlEmbed.setFooter(`The afk check has been aborted by ${reactor.nickname}`)
            await commandMessage.edit(controlEmbed)
            await logMessage.edit(controlEmbed)
            try {
                await commandMessage.reactions.removeAll()
            } catch (e) { }
            await statusMessage.edit(statusEmbed)
            await raidingChannel.delete()
        }
    }
    async function manageReactions(r, u) {
        var name = r.emoji.name
        var reactor = await message.guild.members.fetch(u.id)
        afk = JSON.parse(fs.readFileSync('afk.json'))
        runLocation = afk[origin].location
        controlEmbed = commandMessage.embeds[0]
        //General Reacts
        if (name == "❌") {
            //Does the user have perms?
            let commandFile = require(`./permcheck.js`);
            var auth;
            auth = await commandFile.run(client, reactor, commands.settings.afk.permsint);
            if (auth) {
                endAfk(reactor)
            }
        } else if ((name == "nitro" || name == "shinynitro") && reactor.roles.cache.has(config.roles.general.nitro) && ["true", "on", "enabled"].includes(config.afksettings.nitrosettings.enabled.toLowerCase())) {
            //Nitro
            try {
                if (config.afksettings.nitrosettings.nitrostyle.toLowerCase() == "normal") {
                    if (config.afksettings.nitrosettings.whattodo.toLowerCase() == "location") {
                        if (nitroCounter < config.afksettings.nitrosettings.amount && !afk[origin].earlyLocationIds.includes(reactor.id)) {
                            await reactor.send(`The location of the run in \`${raidingChannel.name}\` has been set to: \n\`${afk[origin].location}\``)
                            nitroCounter += 1
                            nitroArray.push(`<@!${reactor.id}>`)
                            afk[origin].earlyLocationIds.push(reactor.id)
                            fs.writeFileSync('afk.json', JSON.stringify(afk))
                            controlEmbed = commandMessage.embeds[0]
                            controlEmbed.fields.find(f => f.name.includes("Nitro Boosters")).value = nitroArray.join(", ")
                            commandMessage.edit(controlEmbed)
                            logMessage.edit(controlEmbed)
                        } else if (afk[origin].earlyLocationIds.includes(reactor.id)) {
                            await reactor.send("You have already received location through this or another method.")
                        } else if (nitroCounter >= config.afksettings.nitrosettings.amount) {
                            await reactor.send("The nitro cap has been reached. Please try again next run.")
                        }
                    } else if (config.afksettings.nitrosettings.whattodo.toLowerCase() == "spot" && nitroCounter < config.afksettings.nitrosettings.amount) {
                        if (!nitroArray.includes(`<@!${reactor.id}>`)) {
                            await moveIn(reactor).then((bool) => {
                                if (!bool) {
                                    nitroCounter += 1
                                    nitroArray.push(`<@!${reactor.id}>`)
                                }
                            })
                        } else {
                            await reactor.send("You have already reacted to nitro.")
                            await moveIn(reactor)
                        }

                    }

                } else if (config.afksettings.nitrosettings.nitrostyle.toLowerCase() == "delay") {
                    let nitrodelay = JSON.parse(fs.readFileSync("nitrodelay.json"))
                    if (nitrodelay[reactor.id] == undefined || nitrodelay[reactor.id].endTime <= Date.now()) {
                        if (config.afksettings.nitrosettings.whattodo.toLowerCase() == "location") {
                            if (nitroCounter < config.afksettings.nitrosettings.amount && !afk[origin].earlyLocationIds.includes(reactor.id)) {
                                await reactor.send(`The location of the run in \`${raidingChannel.name}\` has been set to: \n\`${afk[origin].location}\``)
                                nitroCounter += 1
                                nitroArray.push(`<@!${reactor.id}>`)
                                nitrodelay[reactor.id] = {
                                    'startTime': Date.now(),
                                    'endTime': Date.now() + parseInt(config.afksettings.nitrosettings.nitrodelay)
                                }
                                fs.writeFileSync('nitrodelay.json', JSON.stringify(nitrodelay))
                                afk[origin].earlyLocationIds.push(reactor.id)
                                fs.writeFileSync('afk.json', JSON.stringify(afk))
                                controlEmbed = commandMessage.embeds[0]
                                controlEmbed.fields.find(f => f.name.includes("Nitro Boosters")).value = nitroArray.join(", ")
                                commandMessage.edit(controlEmbed)
                                logMessage.edit(controlEmbed)
                            } else if (afk[origin].earlyLocationIds.includes(reactor.id)) {
                                await reactor.send("You have already received location through this or another method.")
                            } else if (nitroCounter >= config.afksettings.nitrosettings.amount) {
                                await reactor.send("The nitro cap has been reached. Please try again next run.")
                            }
                        } else if (config.afksettings.nitrosettings.whattodo.toLowerCase() == "spot") {
                            if (!nitroArray.includes(`<@!${reactor.id}>`) && nitroCounter < config.afksettings.nitrosettings.amount) {
                                await moveIn(reactor).then((bool) => {
                                    if (!bool) {
                                        nitroCounter += 1
                                        nitroArray.push(`<@!${reactor.id}>`)
                                        nitrodelay[reactor.id] = {
                                            'startTime': Date.now(),
                                            'endTime': Date.now() + parseInt(config.afksettings.nitrosettings.nitrodelay)
                                        }
                                        fs.writeFileSync('nitrodelay.json', JSON.stringify(nitrodelay))
                                    }
                                })
                            } else {
                                await reactor.send("You have already reacted to nitro.")
                                await moveIn(reactor)
                            }
                        }
                    } else {
                        reactor.send(`You have already used your nitro. It will be available again in ${await toTimeString(nitrodelay[reactor.id].endTime - Date.now())}`)
                    }
                }
            } catch (e) {
                console.error(e)
            }
        } else {
            await confirmReaction(r, reactor)
        }
    }
    async function moveIn(reactor) {
        if (reactor.voice.channel != undefined && reactor.voice.channelID != raidingChannel.id) {
            try {
                await reactor.voice.setChannel(raidingChannel)
                await reactor.send(`You have been moved into \`${raidingChannel.name}\``)

            } catch (e) {
                message.channel.send(`<@!${reactor.id}> reacted with nitro, but they could not be moved in.`)
            }
        } else if (reactor.voice.channelID == raidingChannel.id) {
            await reactor.send(`You are already in ${raidingChannel.name}`)
            return true
        } else if (reactor.voice.channel == undefined) {
            let draggedMessage = await reactor.send("You are not currently in a Voice Channel. Once you have joined any voice channel, react to the ✅ to get moved in to the voice channel. You can cancel at any time by reacting to the ❌")
            await draggedMessage.react("✅")
            await draggedMessage.react("❌")
            const dragFilter = (r, u) => !u.bot && (r.emoji.name == "✅" || r.emoji.name == "❌")
            let dragCollector = draggedMessage.createReactionCollector(dragFilter)
            dragCollector.on('collect', async (r, u) => {
                if (r.emoji.name == "✅") {
                    try {
                        await reactor.voice.setChannel(raidingChannel)
                        await draggedMessage.edit("You have successfully been dragged in to the voice channel.")
                        dragCollector.stop()
                    } catch (e) {
                        await draggedMessage.edit("The attempt to drag you in was unsuccessful. Please try again.")
                    }
                } else if (r.emoji.name == "❌") {
                    dragCollector.stop()
                    await draggedMessage.edit("The dragging process has been cancelled.")
                }
            })
        }
    }
    async function confirmReaction(reaction, reactor) {
        try {
            controlEmbed = commandMessage.embeds[0]
            let confirmationMessage = await reactor.send(`You have reacted with ${reaction.emoji} (${reaction.emoji.name}). If you actually plan on bringing and using a ${reaction.emoji}, react with the ✅. If this was an accident, or you don't want to bring and use the ${reaction.emoji}, react with the ❌.`)
            const confirmationFilter = (r, u) => !u.bot && (r.emoji.name == "✅" || r.emoji.name == "❌")
            let confirmationCollector = confirmationMessage.createReactionCollector(confirmationFilter, { max: 1 })
            await confirmationMessage.react("✅")
            await confirmationMessage.react("❌")
            confirmationCollector.on('collect', async (r, u) => {
                if (r.emoji.name == "❌") {
                    confirmationMessage.edit("The process has been cancelled.")
                } else {
                    controlEmbed = commandMessage.embeds[0]
                    if (controlEmbed.fields.find(f => f.name.includes(reaction.emoji)).value.split('\n').length >= config.afksettings.keyamount && reaction.emoji.name.includes("key") && controlEmbed.fields.find(f => f.name.includes(reaction.emoji)).value != "None") {
                        return reactor.send("There are too many people who have reacted with this. Please try again during the next afk.")
                    } else if (controlEmbed.fields.find(f => f.name.includes(reaction.emoji)).value.split('\n').length >= config.afksettings.reactionamount && controlEmbed.fields.find(f => f.name.includes(reaction.emoji)).value != "None") {
                        return reactor.send("There are too many people who have reacted with this. Please try again during the next afk.")
                    }
                    if (controlEmbed.fields.find(f => f.name.includes(reaction.emoji)).value.includes(reactor.id)) {
                        return reactor.send(`You have already reacted and confirmed a ${reaction.emoji}`)
                    }
                    controlEmbed.fields.find(f => f.name.includes(reaction.emoji)).value = (controlEmbed.fields.find(f => f.name.includes(reaction.emoji)).value.includes("None")) ? `${reaction.emoji}: <@!${reactor.id}>` : controlEmbed.fields.find(f => f.name.includes(reaction.emoji)).value.concat(`\n${reaction.emoji}: <@!${reactor.id}>`)
                    await commandMessage.edit(controlEmbed)
                    await logMessage.edit(controlEmbed)
                    afk = JSON.parse(fs.readFileSync("afk.json"))
                    afk[origin].earlyLocationIds.push(u.id)
                    afk[origin].earlyLocationIds = [... new Set(afk[origin].earlyLocationIds)]
                    fs.writeFileSync('afk.json', JSON.stringify(afk))
                    confirmationMessage.edit(`The location of the run in \`${raidingChannel.name}\` has been set to: \`${afk[origin].location}\`. The RL ${message.member.displayName} will be there to confirm your ${reaction.emoji}.`)
                    await moveIn(reactor)
                }
            })
        } catch (e) {
            message.channel.send(`<@!${reactor.id}> tried to react with ${reaction.emoji}, but I could not DM them.`)
        }
    }
    async function toTimeString(time) {
        return `${Math.floor(time / 86400000)} Days ${Math.floor((time - Math.floor(time / 86400000) * 86400000) / 3600000)} Hours ${Math.round((time - Math.floor(time / 86400000) * 86400000 - Math.floor((time - Math.floor(time / 86400000) * 86400000) / 3600000) * 3600000) / 60000)} Minutes`
    }
}

//Global Variables
const dungeons = {
    'c': 'cult',
    'cult': 'cult',
    'v': 'void',
    'void': 'void',
    'fsv': 'fullskipvoid',
    'fullskipvoid': 'fullskipvoid',
    'oryx3': "oryx3",
    'o3': "oryx3",
    "rc": "realmclearing",
    "realmclearing": "realmclearing"
}
//Important Emojis
var speedy = "<:fastvoid:721756760448434278>"
var entity = "<:void:702140045997375558>"
var cult = "<:malus:702140045833928964>"
var key = "<:lhkey:702140477432004618>"
var vial = "<:vial:702140045871808632>"
var mystic = "<:mystic:702131716726456501>"
var brain = "<:fsvbrain:702154477569835048>"
var warrior = "<:warrior:702131716739039233>"
var pally = "<:paladin:702131716650958939>"
var knight = "<:knight:702131716927782963>"
var puri = "<:puri:702140045859225640>"
var mseal = "<:mseal:702140045930528798>"
var rusher = "<:planewalker:702140245159837717>"
var nitro = "<:nitro:702141265545920562>"
var shinynitro = "<a:shinynitro:702141266057625721>"
var helmetRune = "<:helmetRune:707410220883902514>"
var swordRune = "<:swordRune:707410220674056223>"
var shieldRune = "<:shieldRune:707410220607078412>"
var oryx = "<:oryx2:707410551491395684>"
var portal = "<:portal:707585220500783144>"