const fs = require('fs')
var sqlHelper = require("../helpers/sqlHelper.js")

exports.run = async (client, message, args, Discord, sudo = false) => {
    var guildConfig = JSON.parse(fs.readFileSync(`./configs/${message.guild.id}.json`));
    const commands = JSON.parse(fs.readFileSync("commands.json"))
    for (var i in guildConfig.afksettings) {
        if (!isNaN(guildConfig.afksettings[i])) {
            guildConfig.afksettings[i] = parseInt(guildConfig.afksettings[i])
        } else if (typeof guildConfig.afksettings[i] == "object") {
            for (var x in guildConfig.afksettings[i]) {
                if (!isNaN(guildConfig.afksettings[i][x])) {
                    guildConfig.afksettings[i][x] = parseInt(guildConfig.afksettings[i][x])
                }
            }
        }
    }
    var afk = JSON.parse(fs.readFileSync("afk.json"))
    //Check Perms
    if (message.channel.type != 'text') {
        return message.channel.send("You cannot use this command here.")
    }
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

    //Argument Parsing
    //Channel Number
    var channelNumber = args.shift()
    var statusChannel;
    if (isNaN(channelNumber)) {
        return message.channel.send(`\`${channelNumber}\` is an invalid channel number.`)
    }
    //Channel Available?
    if (origin == 100) {
        if (guildConfig.channels.veteran.raiding[channelNumber] == undefined) {
            return message.channel.send(`\`${channelNumber}\` is an invalid channel number.`)
        }
        if (guildConfig.channels.veteran.raiding[channelNumber].length == 0) {
            return message.channel.send(`Raiding Channel \`${channelNumber}\` has not been configured. Please have an admin add it using setup.`)
        } else {
            channelNumber = guildConfig.channels.veteran.raiding[channelNumber]
            statusChannel = guildConfig.channels.veteran.control.status
        }
    } else if (origin == 10) {
        if (guildConfig.channels.normal.raiding[channelNumber] == undefined) {
            return message.channel.send(`\`${channelNumber}\` is an invalid channel number.`)
        }
        if (guildConfig.channels.normal.raiding[channelNumber].length == 0) {
            return message.channel.send(`Raiding Channel \`${channelNumber}\` has not been configured. Please have an admin add it using setup.`)
        } else {
            channelNumber = guildConfig.channels.normal.raiding[channelNumber]
            statusChannel = guildConfig.channels.normal.control.status
        }
    } else if (origin = 1) {
        if (guildConfig.channels.event.raiding[channelNumber] == undefined) {
            return message.channel.send(`\`${channelNumber}\` is an invalid channel number.`)
        }
        if (guildConfig.channels.event.raiding[channelNumber].length == 0) {
            return message.channel.send(`Raiding Channel \`${channelNumber}\` has not been configured. Please have an admin add it using setup.`)
        }
        else {
            return message.channel.send("If you would like to do an event afk, please use the command `eventafk`.")
            channelNumber = guildConfig.channels.event.raiding[channelNumber]
            statusChannel = guildConfig.channels.event.control.status
        }
    } else {
        return message.channel.send("You should not be here.")
    }
    //Fetch channel
    var raidingChannel = await message.guild.channels.cache.find(c => c.id == channelNumber)
    var statusChannel = await message.guild.channels.cache.find(c => c.id == statusChannel)

    //Run Type
    var runType = args.shift()
    if (runType == undefined || !dungeons.hasOwnProperty(runType)) {
        return message.channel.send(`\`${runType}\` is not a valid run type. Please check your spelling.`)
    }
    runType = dungeons[runType]

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


    //Begin Commands/Log embed
    var logChannel = message.guild.channels.cache.find(c => c.id == guildConfig.channels.log.raid)
    var controlEmbed;
    var logMessage;
    var commandMessage;
    //End Commands/Log embed
    //Setup and send the embed in status
    if (!raidingChannel.name.includes(" <-- Join!")) {
        await raidingChannel.setName(`${raidingChannel.name}  <-- Join!`)
    }
    await raidingChannel.updateOverwrite(guildConfig.roles.general.raider, {
        'CONNECT': true
    })
    await raidingChannel.setUserLimit(null)
    var runEmbed = new Discord.MessageEmbed()
        .setFooter(`Time Remaining: ${Math.floor(guildConfig.afksettings.afktime / 60000)} Minutes ${(guildConfig.afksettings.afktime % 60000) / 1000} Seconds`)
    var runAnnouncement;
    var runMessage;
    switch (runType) {
        case "cult":
            runAnnouncement = await statusChannel.send(`@here \`Cult\` (${cult}) started by <@${message.author.id}> in \`${raidingChannel.name}\``)
            runEmbed
                .setColor("#ff1212")
                .setAuthor(`Cult started by ${message.member.nickname} in ${raidingChannel.name}`, message.author.avatarURL())
                .setDescription(`To join, **connect to the raiding channel** and then react with ${cult}\nIf you have a key, react with ${key}\nIf you are bringing one of the following classes, please with react that class respectively ${warrior}${pally}${knight}\nIf you are bringing one of the following items (and plan on using it), please react with that item respectively ${mseal}${puri}\nIf you plan on rushing and have the <@&${guildConfig.roles.general.rusher}> role, you may react with ${rusher}\nIf you have the <@&${guildConfig.roles.general.nitro}> role, you may react with ${shinynitro} for early location\n(10 max)\nTo end this AFK Check, the raid leader can react with ❌`)
            runMessage = await statusChannel.send(runEmbed)
            controlEmbed = new Discord.MessageEmbed()
                .addField("Location:", runLocation)
                .addField("Key:", "None")
                .setColor("#ff1212")
                .setDescription(`**[AFK Check](${runMessage.url}) control panel for \`${raidingChannel.name}\`\nRun Type: \`Cult\`**`)
                .addField("Rushers:", "None")
                .addField("Nitro Boosters:", "None")
            logMessage = await logChannel.send(controlEmbed)
            commandMessage = await message.channel.send(controlEmbed)
            break;
        case "void":
            runAnnouncement = await statusChannel.send(`@here \`Void\` (${entity}) started by <@${message.author.id}> in \`${raidingChannel.name}\``)
            runEmbed
                .setColor("#000080")
                .setAuthor(`Void started by ${message.member.nickname} in ${raidingChannel.name}`, message.author.avatarURL())
                .setDescription(`To join, **connect to the raiding channel** and then react with ${entity}\nIf you have a key or a vial, react with ${key} or ${vial} respectively\nIf you are bringing one of the following classes, please react with that class respectively ${warrior}${pally}${knight}\nIf you are bringing one of the following items (and plan on using it), please react with that item respectively ${mseal}${puri}\nIf you plan on rushing and have the <@&${guildConfig.roles.general.rusher}> role, you may react with ${rusher}\nIf you have the <@&${guildConfig.roles.general.nitro}> role, you may react with the ${shinynitro} for early location\n(10 max)\nTo end this AFK Check, the raid leader can react with the ❌`)
            runMessage = await statusChannel.send(runEmbed)
            controlEmbed = new Discord.MessageEmbed()
                .addField("Location:", runLocation)
                .addField("Key:", "None")
                .setColor("#000080")
                .setDescription(`**[AFK Check](${runMessage.url}) control panel for \`${raidingChannel.name}\`\nRun Type: \`Void\`**`)
                .addField("Vials:", "None")
                .addField("Nitro Boosters:", "None")
            logMessage = await logChannel.send(controlEmbed)
            commandMessage = await message.channel.send(controlEmbed)
            break;
        case "fullskipvoid":
            runAnnouncement = await statusChannel.send(`@here \`Fullskip Void\` (${speedy}) started by <@${message.author.id}> in \`${raidingChannel.name}\``)
            runEmbed
                .setColor("#000080")
                .setAuthor(`Fullskip Void started by ${message.member.nickname} in ${raidingChannel.name}`, message.author.avatarURL())
                .setDescription(`To join, **connect to the raiding channel** and then react with ${speedy}\nIf you have a key or a vial, react with ${key} or ${vial} respectively\nIf you are bringing one of the following classes, please react that with class respectively ${warrior}${pally}${knight}\nIf you are bringing one of the following items (and plan on using it), please react with that item respectively ${mseal}${puri}\nIf have a mystic or a brain trickster and plan on bringing it, react with the one you are bringing ${mystic}${brain}\nIf you have the <@&${guildConfig.roles.general.nitro}> role, you may react with the ${shinynitro} for early location (10 max)\nTo end this AFK Check, the raid leader can react with the ❌`)
            runMessage = await statusChannel.send(runEmbed)
            controlEmbed = new Discord.MessageEmbed()
                .addField("Location:", runLocation)
                .addField("Key:", "None")
                .setColor("#000080")
                .setDescription(`**[AFK Check](${runMessage.url}) control panel for \`${raidingChannel.name}\`\nRun Type: \`Fullskip Void\`**`)
                .addField("Vials:", "None")
                .addField("Brains:", "None")
                .addField("Mystics:", "None")
                .addField("Nitro Boosters:", "None")
            logMessage = await logChannel.send(controlEmbed)
            commandMessage = await message.channel.send(controlEmbed)
            break;
        case "oryx3":
            runAnnouncement = await statusChannel.send(`@here \`Oryx 3\` (${oryx}) started by <@${message.author.id}> in \`${raidingChannel.name}\``)
            runEmbed
                .setColor("#ffffff")
                .setAuthor(`Oryx 3 started by ${message.member.nickname} in ${raidingChannel.name}`, message.author.avatarURL())
                .setDescription(`To join, **connect to the raiding channel** and then react with ${oryx}\nIf you have a rune, please react with your respective rune. ${helmetRune}${swordRune}${shieldRune}\nIf you are bringing one of the following classes, please react that with class respectively ${warrior}${pally}${knight}\nIf you are bringing one of the following items (and plan on using it), please react with that item respectively ${mseal}${puri}\nIf you have the <@&${guildConfig.roles.general.nitro}> role, you may react with the ${shinynitro} for early location (10 max)\nTo end this AFK Check, the raid leader can react with the ❌`)
            runMessage = await statusChannel.send(runEmbed)
            controlEmbed = new Discord.MessageEmbed()
                .addField("Location:", runLocation)
                .addField("Helmet Runes:", "None")
                .addField("Sword Runes:", "None")
                .addField("Shield Runes:", "None")
                .setColor("#ffffff")
                .setDescription(`**[AFK Check](${runMessage.url}) control panel for \`${raidingChannel.name}\`\nRun Type: \`Oryx 3\`**`)
                .addField("Nitro Boosters:", "None")
            logMessage = await logChannel.send(controlEmbed)
            commandMessage = await message.channel.send(controlEmbed)
            break
    }
    afk[origin].statusMessageId = runMessage.id
    afk[origin].infoMessageId = logMessage.id
    afk[origin].commandMessageId = commandMessage.id
    fs.writeFileSync('afk.json', JSON.stringify(afk))
    //Timing Events
    var timeleft = guildConfig.afksettings.afktime
    //Edit AFK every 5 seconds
    var afkEdit = setInterval(async () => {
        timeleft -= 5000
        runEmbed.setFooter(`Time Remaining: ${Math.floor(timeleft / 60000)} Minutes ${(timeleft % 60000) / 1000} Seconds`)
        await runMessage.edit(runEmbed)
    }, 5000)
    //End AFK after this time
    var endAFK = setTimeout(async () => {
        clearInterval(afkEdit)
        afk[origin] = {
            "afk": false,
            "location": "",
            "statusMessageId": "",
            "infoMessageId": "",
            "commandMessageId": "",
            "earlyLocationIds": []
        }
        fs.writeFileSync('afk.json', JSON.stringify(afk))
        await runAnnouncement.delete()
        await raidingChannel.setName(raidingChannel.name.replace(' <-- Join!', ''))
        await raidingChannel.updateOverwrite(
            guildConfig.roles.general.raider,
            { 'CONNECT': false }
        )
        controlEmbed.setFooter(`The afk check has ended automatically.`)
        await commandMessage.edit(controlEmbed)
        await logMessage.edit(controlEmbed)
        try {
            await commandMessage.reactions.removeAll()
        } catch (e) { }
        await raidingChannel.setUserLimit(99)
        //Begin Moving people out
        var lounge;
        if (origin == 100) {
            lounge = guildConfig.channels.veteran.control.lounge
        } else if (origin == 10) {
            lounge = guildConfig.channels.normal.control.lounge
        } else if (origin == 1) {
            lounge = guildConfig.channels.event.control.lounge
        }
        lounge = await runMessage.guild.channels.cache.find(c => c.id == lounge)
        var userIds = await raidingChannel.members.map(u => u.id)
        var reactIds = (runType == 'cult') ? await runMessage.reactions.cache.map(e => e).find(e => e.emoji.name == 'malus').users.cache.map(u => u.id) : (runType == 'void') ? await runMessage.reactions.cache.map(e => e).find(e => e.emoji.name == 'void').users.cache.map(u => u.id) : (runType == 'fullskipvoid') ? await runMessage.reactions.cache.map(e => e).find(e => e.emoji.name == 'fastvoid').users.cache.map(u => u.id) : await runMessage.reactions.cache.map(e => e).find(e => e.emoji.name == 'oryx2').users.cache.map(u => u.id)
        let stayIn;
        if (origin >= 10) {
            stayIn = 100
        } else {
            stayIn = 1
        }
        for (var i in userIds) {
            let id = userIds[i]
            let user = await message.guild.members.fetch(id)
            let commandFile = require(`./permcheck.js`);
            var auth;
            auth = await commandFile.run(client, user, commands.settings.afk.permsint);
            if (!auth && !reactIds.includes(id) && !afk[origin].earlyLocationIds.includes(user.id)) {
                try {
                    user.voice.setChannel(lounge)
                } catch (e) {

                }

            }

        }
        //End Moving people out

        //Begin Post AFK
        //Post AFK Reactions Collector
        var filter = (r, u) => !u.bot && ((runType == 'cult') ? r.emoji.name == 'malus' : r.emoji.name == 'void') || r.emoji.name == '❌'
        var postAFK = runMessage.createReactionCollector(filter, { time: guildConfig.afksettings.posttime })

        //Post AFK Message
        var postTime = guildConfig.afksettings.posttime
        runEmbed
            .setDescription(`The post afk check has begun.\nIf you have been moved out, please join lounge and re-react with the ${(runType == 'cult') ? cult : (runType == 'void ') ? entity : (runType == 'fullskipvoid') ? speedy : oryx} icon to get moved back in.`)
            .setFooter(`Time Remaining: ${Math.floor(postTime / 60000)} Minutes ${(postTime % 60000) / 1000} Seconds | The afk check has ended automatically.`)
        await runMessage.edit(runEmbed)

        //Edit Post AFK
        var postAFKEdit = setInterval(async () => {
            postTime -= 5000
            runEmbed
                .setFooter(`Time Remaining: ${Math.floor(postTime / 60000)} Minutes ${(postTime % 60000) / 1000} Seconds | The afk check has ended automatically.`)
            await runMessage.edit(runEmbed)
        }, 5000)

        //End Post AFK
        var postAFKEnd = setTimeout(async () => {
            clearInterval(postAFKEdit)
            let thing = await runMessage.reactions.cache.find(r => r.emoji.name == '❌')
            try {
                await thing.remove()
            } catch (e) { }
            runEmbed
                .setDescription(`The afk check has ended. We are currently running with ${raidingChannel.members.map(u => u.id).length} raiders.\nIf you missed this run, another will be starting shortly.`)
                .setFooter(`The afk check has ended automatically`)
                .setTimestamp()
            await runMessage.edit(runEmbed)
            //Log in database
            try {
                //Log Key Pop
                await sqlHelper.editUser("users", controlEmbed.fields.find(f => f.name.includes("Key")).value.substring(controlEmbed.fields.find(f => f.name.includes("Key")).value.indexOf(": ")).replace(/[^0-9]/gi, ""), "keypops", 1)
                //Log Runs
                if (runType == "fullskipvoid") runType = "void"
                if (runType != "void" && runType != "cult") {
                    raidingChannel.members.each(async m => {
                        await sqlHelper.editUser("users", m.id, `eventruns`, 1)
                    })
                } else {
                    raidingChannel.members.each(async m => {
                        await sqlHelper.editUser("users", m.id, `${runType}Runs`, 1)
                    })
                }
                await sqlHelper.close()
            } catch (e) {
                console.log(e)
            }
        }, guildConfig.afksettings.posttime)

        postAFK.on('collect', async r => {
            let user = await r.users.cache.map(u => u.id)
            user = await message.guild.members.fetch(user[user.length - 1])
            if (r.emoji.name != '❌') {
                let inLounge = lounge.members.map(u => u.id)
                if (inLounge.includes(user.id)) {
                    try {
                        user.voice.setChannel(raidingChannel)
                    } catch (e) {

                    }
                }
            } else {
                let commandFile = require(`./permcheck.js`);
                var auth;
                auth = await commandFile.run(client, user, commands.settings.afk.permsint);
                if (auth) {
                    clearInterval(postAFKEdit)
                    clearTimeout(postAFKEnd)
                    let thing = await runMessage.reactions.cache.find(r => r.emoji.name == '❌')
                    try {
                        await thing.remove()
                    } catch (e) { }
                    runEmbed
                        .setDescription(`The afk check has ended. We are currently running with ${raidingChannel.members.map(u => u.id).length} raiders.\nIf you missed this run, another will be starting shortly.`)
                        .setFooter(`The afk check has been ended by ${user.nickname}`)
                        .setTimestamp()
                    await runMessage.edit(runEmbed)
                    //Log in database
                    try {
                        //Log Key Pop
                        await sqlHelper.editUser("users", controlEmbed.fields.find(f => f.name.includes("Key")).value.substring(controlEmbed.fields.find(f => f.name.includes("Key")).value.indexOf(": ")).replace(/[^0-9]/gi, ""), "keypops", 1)
                        //Log Runs
                        if (runType == "fullskipvoid") runType = "void"
                        if (runType != "void" && runType != "cult") {
                            raidingChannel.members.each(async m => {
                                await sqlHelper.editUser("users", m.id, `eventruns`, 1)
                            })
                        } else {
                            raidingChannel.members.each(async m => {
                                await sqlHelper.editUser("users", m.id, `${runType}Runs`, 1)
                            })
                        }
                        await sqlHelper.close()
                    } catch (e) {
                        console.log(e)
                    }
                }
            }
        })
    }, guildConfig.afksettings.afktime)

    //Begin collecting reactions
    var filterAFK = (r, u) => !u.bot && (r.emoji.id == "702140477432004618" || r.emoji.id == "702140045871808632" || r.emoji.id == "702154477569835048" || r.emoji.id == '702131716726456501' || r.emoji.id == '702140245159837717' || r.emoji.id == '702141265545920562' || r.emoji.id == '702141266057625721' || r.emoji.id == '707410220883902514' || r.emoji.id == '707410220674056223' || r.emoji.id == '707410220607078412' || r.emoji.name == "❌")
    collectorAFK = runMessage.createReactionCollector(filterAFK, { time: guildConfig.afksettings.afktime })
    var filterControl = (r, u) => !u.bot && (r.emoji.name == "❌")
    collectorControl = commandMessage.createReactionCollector(filterControl, { time: guildConfig.afksettings.afktime })
    await commandMessage.react("❌")
    //End status embed

    //Dealing with reactions on AFK Check
    var nitroCounter = 0;
    var nitroArray = [];
    var vialRusherCounter = 0;
    var vialRusherArray = [];
    var keyCounter = 0;
    var keyArray = [];
    var brainCounter = 0;
    var brainArray = [];
    var mysticCounter = 0;
    var mysticArray = [];
    var swordCounter = 0;
    var swordArray = [];
    var helmetCounter = 0;
    var helmetArray = [];
    var shieldCounter = 0;
    var shieldArray = [];

    collectorAFK.on('collect', async r => {
        let name = r.emoji.name
        var reactor = await r.users.cache.map(u => u.id)
        reactor = await message.guild.members.fetch(reactor[reactor.length - 1])
        reactorRoles = reactor.roles.cache.map(r => r.id)
        afk = JSON.parse(fs.readFileSync('afk.json'))
        runLocation = afk[origin].location
        controlEmbed = commandMessage.embeds[0]
        if (name == "nitro" || name == "shinynitro") {
            //Send Nitro Boosters location
            try {
                if (reactorRoles.includes(guildConfig.roles.general.nitro) && nitroCounter < guildConfig.afksettings.nitrosettings.amound && !nitroArray.includes(`<@!${reactor.id}>`)) {
                    nitroCounter += 1
                    nitroArray.push(`<@!${reactor.id}>`)
                    await reactor.send(`The location of the run in \`${raidingChannel.name}\` has been set to:\n\`${runLocation}\``)
                    controlEmbed
                        .spliceFields((runType == 'fullskipvoid') ? 5 : 3, 1, { name: "Nitro Boosters:", value: nitroArray.join(', '), inline: false })
                    await commandMessage.edit(controlEmbed)
                    await logMessage.edit(controlEmbed)
                    afk[origin].earlyLocationIds.push(reactor.id)
                    fs.writeFileSync('afk.json', JSON.stringify(afk))
                } else if (reactorRoles.includes(guildConfig.roles.general.nitro) && nitroCounter >= 10) {
                    await reactor.send("There have already been 10 people who received nitro.")
                } else if (reactorRoles.includes(guildConfig.roles.general.nitro) && nitroArray.includes(`<@!${reactor.id}>`)) {
                    await reactor.send("You have already received location.")
                }
            } catch (e) {

            }
        } else if (name == "vial" && (runType == "void" || runType == "fullskipvoid")) {
            //Confirming vials if necessary
            try {
                let confirmationMessage = await reactor.send(`You have reacted with ${vial}.\nIf you actually plan on bringing a vial, react with ✅.\nIf you did not, or this was a mistake, react with ❌.\nRemember, fake reacting results in suspensions!`)
                await confirmationMessage.react("✅")
                await confirmationMessage.react("❌")
                let confirmationFilter = (r, u) => !u.bot && (r.emoji.name == "✅" || r.emoji.name == "❌")
                let confirmationCollector = confirmationMessage.createReactionCollector(confirmationFilter, { max: 1, time: 15000 })
                confirmationCollector.on('collect', async r => {
                    let name = r.emoji.name
                    if (name == '✅') {
                        if (vialRusherCounter < 3 && !vialRusherArray.includes(`${vial}: <@!${reactor.id}>`)) {
                            vialRusherCounter += 1
                            vialRusherArray.push(`${vial}: <@!${reactor.id}>`)
                            await reactor.send(`The location of the run in \`${raidingChannel.name}\` has been set to:\n\`${runLocation}\`\nThe RL ${message.member.nickname} will be there to confirm your vial.`)
                            controlEmbed
                                .spliceFields(2, 1, { name: "Vials:", value: vialRusherArray.join('\n'), inline: false })
                            await commandMessage.edit(controlEmbed)
                            await logMessage.edit(controlEmbed)
                            afk[origin].earlyLocationIds.push(reactor.id)
                            fs.writeFileSync('afk.json', JSON.stringify(afk))
                        } else if (vialRusherCounter >= 3) {
                            await reactor.send(`You have reacted with ✅. However, since we already have enough vials, you will not be getting location early. You *are* however, allowed to bring the vial just in case.`)
                        } else if (vialRusherArray.includes(`${vial}: <@!${reactor.id}>`)) {
                            await reactor.send("You have already reacted, and confirmed a vial.")
                        }
                    } else {
                        await reactor.send(`You have reacted with ❌. As such, your vial will not be confirmed.`)
                    }

                })
            } catch (e) {
                message.channel.send(`<@!${reactor.id}> tried to react with vial, but there was an error. \`\`\`${e}\`\`\``)
            }

        } else if (name == "planewalker" && runType == "cult") {
            //Confirming rushers if necessary
            try {
                if (reactorRoles.includes(guildConfig.roles.general.rusher)) {
                    let confirmationMessage = await reactor.send(`You have reacted with ${rusher}.\nIf you actually plan on rushing, react with ✅.\nIf you did not, or this was a mistake, react with ❌.\nRemember, fake reacting results in suspensions!`)
                    await confirmationMessage.react("✅")
                    await confirmationMessage.react("❌")
                    let confirmationFilter = (r, u) => !u.bot && (r.emoji.name == "✅" || r.emoji.name == "❌")
                    let confirmationCollector = confirmationMessage.createReactionCollector(confirmationFilter, { max: 1, time: 15000 })
                    confirmationCollector.on('collect', async r => {
                        let name = r.emoji.name
                        if (name == '✅') {
                            if (vialRusherCounter < 3 && !vialRusherArray.includes(`${rusher}: <@!${reactor.id}>`)) {
                                vialRusherCounter += 1
                                vialRusherArray.push(`${rusher}: <@!${reactor.id}>`)
                                await reactor.send(`The location of the run in \`${raidingChannel.name}\` has been set to:\n\`${runLocation}\``)
                                controlEmbed
                                    .spliceFields(2, 1, { name: "Rushers:", value: vialRusherArray.join('\n'), inline: false })
                                await commandMessage.edit(controlEmbed)
                                await logMessage.edit(controlEmbed)
                                afk[origin].earlyLocationIds.push(reactor.id)
                                fs.writeFileSync('afk.json', JSON.stringify(afk))
                            } else if (vialRusherCounter >= 3) {
                                await reactor.send(`You have reacted with ✅. However, since we already have enough rushers, you will not be getting location early. You *are* however, allowed to bring your rushing class just in case.`)
                            } else if (vialRusherArray.includes(`${rusher}: <@!${reactor.id}>`)) {
                                await reactor.send("You have already reacted, and confirmed rushing.")
                            }
                        } else {
                            await reactor.send(`You have reacted with ❌. As such, you will not be confirmed rushing.`)
                        }
                    })
                }
            } catch (e) {
                message.channel.send(`<@!${reactor.id}> tried to react with rusher, but there was an error. \`\`\`${e}\`\`\``)
            }

        } else if (name == "lhkey") {
            //Confirming key
            try {
                let confirmationMessage = await reactor.send(`You have reacted with ${key}.\nIf you actually plan on bringing a key, react with ✅.\nIf you did not, or this was a mistake, react with ❌.\nRemember, fake reacting results in suspensions!`)
                await confirmationMessage.react("✅")
                await confirmationMessage.react("❌")
                let confirmationFilter = (r, u) => !u.bot && (r.emoji.name == "✅" || r.emoji.name == "❌")
                let confirmationCollector = confirmationMessage.createReactionCollector(confirmationFilter, { max: 1, time: 15000 })
                confirmationCollector.on('collect', async r => {
                    let name = r.emoji.name
                    if (name == '✅') {
                        if (keyCounter < 1 && !keyArray.includes(`${key}: <@!${reactor.id}>`)) {
                            keyCounter += 1
                            keyArray.push(`${key}: <@!${reactor.id}>`)
                            await reactor.send(`The location of the run in \`${raidingChannel.name}\` has been set to:\n\`${runLocation}\`\nThe RL ${message.member.nickname} will be there to confirm your key.`)
                            controlEmbed
                                .spliceFields(1, 1, { name: "Key:", value: keyArray.join('\n'), inline: false })
                            await commandMessage.edit(controlEmbed)
                            await logMessage.edit(controlEmbed)
                            afk[origin].earlyLocationIds.push(reactor.id)
                            fs.writeFileSync('afk.json', JSON.stringify(afk))
                        } else if (keyCounter >= 1) {
                            await reactor.send(`You have reacted with ✅. However, since we already have enough keys, you will not be getting location early. You *are* however, allowed to bring your key just in case.`)
                        } else if (vialRusherArray.includes(`${rusher}: <@!${reactor.id}>`)) {
                            await reactor.send("You have already reacted, and confirmed your key.")
                        }
                    } else {
                        await reactor.send(`You have reacted with ❌. As such, you will not be confirmed bringing a key.`)
                    }
                })
            } catch (e) {
                message.channel.send(`<@!${reactor.id}> tried to react with key, but there was an error. \`\`\`${e}\`\`\``)
            }


        } else if (name == "fsvbrain" && runType == "fullskipvoid") {
            //Confirming brains if necessary
            try {
                let confirmationMessage = await reactor.send(`You have reacted with ${brain}.\nIf you have **85+ MHeal and are 6/8+** and you actually plan on bringing your brain trickster, react with ✅.\nIf you did not, or this was a mistake, react with ❌.\nRemember, fake reacting results in suspensions!`)
                await confirmationMessage.react("✅")
                await confirmationMessage.react("❌")
                let confirmationFilter = (r, u) => !u.bot && (r.emoji.name == "✅" || r.emoji.name == "❌")
                let confirmationCollector = confirmationMessage.createReactionCollector(confirmationFilter, { max: 1, time: 15000 })
                confirmationCollector.on('collect', async r => {
                    let name = r.emoji.name
                    if (name == '✅') {
                        if (brainCounter < 3 && !brainArray.includes(`${brain}: <@!${reactor.id}>`)) {
                            brainCounter += 1
                            brainArray.push(`${brain}: <@!${reactor.id}>`)
                            await reactor.send(`The location of the run in \`${raidingChannel.name}\` has been set to:\n\`${runLocation}\`\nThe RL ${message.member.nickname} will be there to confirm your brain.`)
                            controlEmbed
                                .spliceFields(3, 1, { name: "Brains:", value: brainArray.join('\n'), inline: false })
                            await commandMessage.edit(controlEmbed)
                            await logMessage.edit(controlEmbed)
                            afk[origin].earlyLocationIds.push(reactor.id)
                            fs.writeFileSync('afk.json', JSON.stringify(afk))
                        } else if (brainCounter >= 3) {
                            await reactor.send(`You have reacted with ✅. However, since we already have enough brains, you will not be getting location early. You *are* however, allowed to bring your brain trickster just in case.`)
                        } else if (brainArray.includes(`${brain}: <@!${reactor.id}>`)) {
                            await reactor.send("You have already reacted, and been confirmed as a brain trickster")
                        }
                    } else {
                        await reactor.send(`You have reacted with ❌. As such, you will not be confirmed bringing a brain.`)
                    }

                })
            } catch (e) {
                message.channel.send(`<@!${reactor.id}> tried to react with brain, but there was an error. \`\`\`${e}\`\`\``)
            }


        } else if (name == "mystic" && runType == "fullskipvoid") {
            //Confirming mystics if necessary
            try {
                let confirmationMessage = await reactor.send(`You have reacted with ${mystic}.\nIf you have **85+ MHeal and are 6/8+** and you actually plan on bringing your mystic, react with ✅.\nIf you did not, or this was a mistake, react with ❌.\nRemember, fake reacting results in suspensions!`)
                await confirmationMessage.react("✅")
                await confirmationMessage.react("❌")
                let confirmationFilter = (r, u) => !u.bot && (r.emoji.name == "✅" || r.emoji.name == "❌")
                let confirmationCollector = confirmationMessage.createReactionCollector(confirmationFilter, { max: 1, time: 15000 })
                confirmationCollector.on('collect', async r => {
                    let name = r.emoji.name
                    if (name == '✅') {
                        if (mysticCounter < 3 && !mysticArray.includes(`${mystic}: <@!${reactor.id}>`)) {
                            mysticCounter += 1
                            mysticArray.push(`${mystic}: <@!${reactor.id}>`)
                            await reactor.send(`The location of the run in \`${raidingChannel.name}\` has been set to:\n\`${runLocation}\`\nThe RL ${message.member.nickname} will be there to confirm your mystic.`)
                            controlEmbed
                                .spliceFields(4, 1, { name: "Mystics:", value: mysticArray.join('\n'), inline: false })
                            await commandMessage.edit(controlEmbed)
                            await logMessage.edit(controlEmbed)
                            afk[origin].earlyLocationIds.push(reactor.id)
                            fs.writeFileSync('afk.json', JSON.stringify(afk))
                        } else if (mysticCounter >= 3) {
                            await reactor.send(`You have reacted with ✅. However, since we already have enough mystics, you will not be getting location early. You *are* however, allowed to bring your mystic just in case.`)
                        } else if (mysticArray.includes(`${mystic}: <@!${reactor.id}>`)) {
                            await reactor.send("You have already reacted, and been confirmed as mystic")
                        }
                    } else {
                        await reactor.send(`You have reacted with ❌. As such, you will not be confirmed bringing a mystic.`)
                    }
                })
            } catch (e) {
                message.channel.send(`<@!${reactor.id}> tried to react with mystic, but there was an error. \`\`\`${e}\`\`\``)
            }
        } else if (name == "helmetRune" && runType == "oryx3") {
            //Check for helmet runes if necessar
            try {
                let confirmationMessage = await reactor.send(`You have reacted with ${helmetRune} (Helmet Rune).\nIf you actually plan on bringing and using the helmet rune, react with ✅.\nIf you did not, or this was a mistake, react with ❌.\nRemember, fake reacting results in suspensions!`)
                await confirmationMessage.react("✅")
                await confirmationMessage.react("❌")
                let confirmationFilter = (r, u) => !u.bot && (r.emoji.name == "✅" || r.emoji.name == "❌")
                let confirmationCollector = confirmationMessage.createReactionCollector(confirmationFilter, { max: 1, time: 15000 })
                confirmationCollector.on('collect', async r => {
                    let name = r.emoji.name
                    if (name == '✅') {
                        if (helmetCounter < 3 && !helmetArray.includes(`${helmetRune}: <@!${reactor.id}>`)) {
                            helmetCounter += 1
                            helmetArray.push(`${helmetRune}: <@!${reactor.id}>`)
                            await reactor.send(`The location of the run in \`${raidingChannel.name}\` has been set to:\n\`${runLocation}\`\nThe RL ${message.member.nickname} will be there to confirm your helmet rune.`)
                            controlEmbed
                                .spliceFields(1, 1, { name: "Helmet Runes:", value: helmetArray.join('\n'), inline: false })
                            await commandMessage.edit(controlEmbed)
                            await logMessage.edit(controlEmbed)
                            afk[origin].earlyLocationIds.push(reactor.id)
                            fs.writeFileSync('afk.json', JSON.stringify(afk))
                        } else if (helmetCounter >= 3) {
                            await reactor.send(`You have reacted with ✅. However, since we already have enough helmet runes, you will not be getting location early. You *are* however, allowed to bring your helmet rune just in case.`)
                        } else if (helmetArray.includes(`${helmetRune}: <@!${reactor.id}>`)) {
                            await reactor.send("You have already reacted, and been confirmed with a helmet rune")
                        }
                    } else {
                        await reactor.send(`You have reacted with ❌. As such, you will not be confirmed bringing a helmet rune.`)
                    }
                })
            } catch (e) {
                message.channel.send(`<@!${reactor.id}> tried to react with the helmet rune, but there was an error. \`\`\`${e}\`\`\``)
            }
        } else if (name == "swordRune" && runType == "oryx3") {
            //Check for sword runes if necessary
            try {
                let confirmationMessage = await reactor.send(`You have reacted with ${swordRune} (Sword Rune).\nIf you actually plan on bringing and using the sword rune, react with ✅.\nIf you did not, or this was a mistake, react with ❌.\nRemember, fake reacting results in suspensions!`)
                await confirmationMessage.react("✅")
                await confirmationMessage.react("❌")
                let confirmationFilter = (r, u) => !u.bot && (r.emoji.name == "✅" || r.emoji.name == "❌")
                let confirmationCollector = confirmationMessage.createReactionCollector(confirmationFilter, { max: 1, time: 15000 })
                confirmationCollector.on('collect', async r => {
                    let name = r.emoji.name
                    if (name == '✅') {
                        if (swordCounter < 3 && !swordArray.includes(`${swordRune}: <@!${reactor.id}>`)) {
                            swordCounter += 1
                            swordArray.push(`${swordRune}: <@!${reactor.id}>`)
                            await reactor.send(`The location of the run in \`${raidingChannel.name}\` has been set to:\n\`${runLocation}\`\nThe RL ${message.member.nickname} will be there to confirm your sword rune.`)
                            controlEmbed
                                .spliceFields(2, 1, { name: "Sword Runes:", value: swordArray.join('\n'), inline: false })
                            await commandMessage.edit(controlEmbed)
                            await logMessage.edit(controlEmbed)
                            afk[origin].earlyLocationIds.push(reactor.id)
                            fs.writeFileSync('afk.json', JSON.stringify(afk))
                        } else if (swordCounter >= 3) {
                            await reactor.send(`You have reacted with ✅. However, since we already have enough sword runes, you will not be getting location early. You *are* however, allowed to bring your sword rune just in case.`)
                        } else if (swordArray.includes(`${swordRune}: <@!${reactor.id}>`)) {
                            await reactor.send("You have already reacted, and been confirmed with a sword rune")
                        }
                    } else {
                        await reactor.send(`You have reacted with ❌. As such, you will not be confirmed bringing a sword rune.`)
                    }
                })
            } catch (e) {
                message.channel.send(`<@!${reactor.id}> tried to react with the sword rune, but there was an error. \`\`\`${e}\`\`\``)
            }
        } else if (name == "shieldRune" && runType == "oryx3") {
            //Check for shield runes if necessary
            try {
                let confirmationMessage = await reactor.send(`You have reacted with ${shieldRune} (Shield Rune).\nIf you actually plan on bringing and using the shield rune, react with ✅.\nIf you did not, or this was a mistake, react with ❌.\nRemember, fake reacting results in suspensions!`)
                await confirmationMessage.react("✅")
                await confirmationMessage.react("❌")
                let confirmationFilter = (r, u) => !u.bot && (r.emoji.name == "✅" || r.emoji.name == "❌")
                let confirmationCollector = confirmationMessage.createReactionCollector(confirmationFilter, { max: 1, time: 15000 })
                confirmationCollector.on('collect', async r => {
                    let name = r.emoji.name
                    if (name == '✅') {
                        if (shieldCounter < 3 && !shieldArray.includes(`${shieldRune}: <@!${reactor.id}>`)) {
                            shieldCounter += 1
                            shieldArray.push(`${shieldRune}: <@!${reactor.id}>`)
                            await reactor.send(`The location of the run in \`${raidingChannel.name}\` has been set to:\n\`${runLocation}\`\nThe RL ${message.member.nickname} will be there to confirm your shield rune.`)
                            controlEmbed
                                .spliceFields(3, 1, { name: "Shield Runes:", value: shieldArray.join('\n'), inline: false })
                            await commandMessage.edit(controlEmbed)
                            await logMessage.edit(controlEmbed)
                            afk[origin].earlyLocationIds.push(reactor.id)
                            fs.writeFileSync('afk.json', JSON.stringify(afk))
                        } else if (shieldCounter >= 3) {
                            await reactor.send(`You have reacted with ✅. However, since we already have enough shield runes, you will not be getting location early. You *are* however, allowed to bring your shield rune just in case.`)
                        } else if (shieldArray.includes(`${shieldRune}: <@!${reactor.id}>`)) {
                            await reactor.send("You have already reacted, and been confirmed with a shield rune")
                        }
                    } else {
                        await reactor.send(`You have reacted with ❌. As such, you will not be confirmed bringing a shield rune.`)
                    }
                })
            } catch (e) {
                message.channel.send(`<@!${reactor.id}> tried to react with the shield rune, but there was an error. \`\`\`${e}\`\`\``)
            }
        } else if (name == "❌") {
            //Ending the afk check
            let commandFile = require(`./permcheck.js`);
            var auth;
            auth = await commandFile.run(client, reactor, commands.settings.afk.permsint);
            if (auth) {
                let x = await r.emoji.reaction.users
                try {
                    await x.remove(reactor.id)
                } catch (e) { }
                //await r.emoji.users.remove(reactor.id)
                collectorAFK.stop()
                clearTimeout(endAFK)
                clearInterval(afkEdit)
                await runAnnouncement.delete()
                afk[origin] = {
                    "afk": false,
                    "location": "",
                    "statusMessageId": "",
                    "infoMessageId": "",
                    "commandMessageId": "",
                    "earlyLocationIds": []
                }
                fs.writeFileSync('afk.json', JSON.stringify(afk))
                controlEmbed.setFooter(`The afk check has been ended by ${reactor.nickname}`)
                await commandMessage.edit(controlEmbed)
                await logMessage.edit(controlEmbed)
                try {
                    await commandMessage.reactions.removeAll()
                } catch (e) { }
                await raidingChannel.setName(raidingChannel.name.replace(' <-- Join!', ''))
                await raidingChannel.updateOverwrite(
                    guildConfig.roles.general.raider,
                    { 'CONNECT': false }
                )
                await raidingChannel.setUserLimit(99)

                //Begin Moving people out
                var lounge;
                if (origin == 100) {
                    lounge = guildConfig.channels.veteran.control.lounge
                } else if (origin == 10) {
                    lounge = guildConfig.channels.normal.control.lounge
                } else if (origin == 1) {
                    lounge = guildConfig.channels.event.control.lounge
                }
                lounge = await runMessage.guild.channels.cache.find(c => c.id == lounge)
                var userIds = await raidingChannel.members.map(u => u.id)
                var reactIds = (runType == 'cult') ? await runMessage.reactions.cache.map(e => e).find(e => e.emoji.name == 'malus').users.cache.map(u => u.id) : (runType == 'void') ? await runMessage.reactions.cache.map(e => e).find(e => e.emoji.name == 'void').users.cache.map(u => u.id) : (runType == "fullskipvoid") ? await runMessage.reactions.cache.map(e => e).find(e => e.emoji.name == 'fastvoid').users.cache.map(u => u.id) : await runMessage.reactions.cache.map(e => e).find(e => e.emoji.name == 'oryx2').users.cache.map(u => u.id)
                let stayIn;
                if (origin >= 10) {
                    stayIn = 100
                } else {
                    stayIn = 1
                }
                for (var i in userIds) {
                    let id = userIds[i]
                    let user = await message.guild.members.fetch(id)
                    let commandFile = require(`./permcheck.js`);
                    var auth;
                    auth = await commandFile.run(client, user, commands.settings.afk.permsint);
                    if (!auth && !reactIds.includes(id) && !afk[origin].earlyLocationIds.includes(user.id)) {
                        try {
                            user.voice.setChannel(lounge)
                        } catch (e) {

                        }

                    }

                }
                //End Moving people out

                //Begin Post AFK
                //Post AFK Reactions Collector
                var filter = (r, u) => !u.bot && ((runType == 'cult') ? r.emoji.name == 'malus' : r.emoji.name == 'void') || r.emoji.name == '❌'
                var postAFK = runMessage.createReactionCollector(filter, { time: guildConfig.afksettings.posttime })

                //Post AFK Message
                var postTime = guildConfig.afksettings.posttime
                runEmbed
                    .setDescription(`The post afk check has begun.\nIf you have been moved out, please join lounge and re-react with the ${(runType == 'cult') ? cult : (runType == "void") ? entity : (runType == "fullskipvoid") ? speedy : oryx} icon to get moved back in.`)
                    .setFooter(`Time Remaining: ${Math.floor(postTime / 60000)} Minutes ${(postTime % 60000) / 1000} Seconds | The afk check has been ended by ${reactor.nickname}`)
                await runMessage.edit(runEmbed)

                //Edit Post AFK
                var postAFKEdit = setInterval(async () => {
                    postTime -= 5000
                    runEmbed
                        .setFooter(`Time Remaining: ${Math.floor(postTime / 60000)} Minutes ${(postTime % 60000) / 1000} Seconds | The afk check has been ended by ${reactor.nickname}`)
                    await runMessage.edit(runEmbed)
                }, 5000)

                //End Post AFK
                var postAFKEnd = setTimeout(async () => {
                    clearInterval(postAFKEdit)
                    let thing = await runMessage.reactions.cache.find(r => r.emoji.name == '❌')
                    try {
                        await thing.remove()
                    } catch (e) { }
                    runEmbed
                        .setDescription(`The afk check has ended. We are currently running with ${raidingChannel.members.map(u => u.id).length} raiders.\nIf you missed this run, another will be starting shortly.`)
                        .setFooter(`The afk check has ended automatically`)
                        .setTimestamp()
                    await runMessage.edit(runEmbed)
                    //Log in database
                    try {
                        //Log Key Pop
                        await sqlHelper.editUser("users", controlEmbed.fields.find(f => f.name.includes("Key")).value.substring(controlEmbed.fields.find(f => f.name.includes("Key")).value.indexOf(": ")).replace(/[^0-9]/gi, ""), "keypops", 1)
                        //Log Runs
                        if (runType == "fullskipvoid") runType = "void"
                        if (runType != "void" && runType != "cult") {
                            raidingChannel.members.each(async m => {
                                await sqlHelper.editUser("users", m.id, `eventruns`, 1)
                            })
                        } else {
                            raidingChannel.members.each(async m => {
                                await sqlHelper.editUser("users", m.id, `${runType}Runs`, 1)
                            })
                        }
                        await sqlHelper.close()
                    } catch (e) {
                        console.log(e)
                    }
                }, guildConfig.afksettings.posttime)

                postAFK.on('collect', async r => {
                    let user = await r.users.cache.map(u => u.id)
                    user = await message.guild.members.fetch(user[user.length - 1])
                    if (r.emoji.name != '❌') {
                        let inLounge = lounge.members.map(u => u.id)
                        if (inLounge.includes(user.id)) {
                            try {
                                user.voice.setChannel(raidingChannel)
                            } catch (e) {

                            }

                        }
                    } else {
                        let commandFile = require(`./permcheck.js`);
                        var auth;
                        auth = await commandFile.run(client, user, commands.settings.afk.permsint);
                        if (auth) {
                            clearInterval(postAFKEdit)
                            clearTimeout(postAFKEnd)
                            let thing = await runMessage.reactions.cache.find(r => r.emoji.name == '❌')
                            try {
                                await thing.remove()
                            } catch (e) { }
                            runEmbed
                                .setDescription(`The afk check has ended. We are currently running with ${raidingChannel.members.map(u => u.id).length} raiders.\nIf you missed this run, another will be starting shortly.`)
                                .setFooter(`The afk check has been ended by ${user.nickname}`)
                                .setTimestamp()
                            await runMessage.edit(runEmbed)
                            //Log in database
                            try {
                                //Log Key Pop
                                await sqlHelper.editUser("users", controlEmbed.fields.find(f => f.name.includes("Key")).value.substring(controlEmbed.fields.find(f => f.name.includes("Key")).value.indexOf(": ")).replace(/[^0-9]/gi, ""), "keypops", 1)
                                //Log Runs
                                if (runType == "fullskipvoid") runType = "void"
                                if (runType != "void" && runType != "cult") {
                                    raidingChannel.members.each(async m => {
                                        await sqlHelper.editUser("users", m.id, `eventruns`, 1)
                                    })
                                } else {
                                    raidingChannel.members.each(async m => {
                                        await sqlHelper.editUser("users", m.id, `${runType}Runs`, 1)
                                    })
                                }
                                await sqlHelper.close()
                            } catch (e) {
                                console.log(e)
                            }
                        }
                    }
                })
            }

        }
    })

    //Dealing with reactions on AFK Control
    collectorControl.on('collect', async r => {
        var reactor = await r.users.cache.map(u => u.id)
        reactor = await message.guild.members.fetch(reactor[reactor.length - 1])
        controlEmbed = commandMessage.embeds[0]
        //Aborting the afk check
        let commandFile = require(`./permcheck.js`);
        var auth;
        auth = await commandFile.run(client, reactor, commands.settings.afk.permsint);
        if (auth) {
            collectorAFK.stop()
            collectorControl.stop()
            try {
                await commandMessage.reactions.removeAll()
            } catch (e) { }
            let thing = await runMessage.reactions.cache.find(r => r.emoji.name == '❌')
            if (thing) {
                try {
                    await thing.remove()
                } catch (e) { }
            }
            clearTimeout(endAFK)
            clearInterval(afkEdit)
            await runAnnouncement.delete()
            afk[origin] = {
                "afk": false,
                "location": "",
                "statusMessageId": "",
                "infoMessageId": "",
                "commandMessageId": "",
                "earlyLocationIds": []
            }
            fs.writeFileSync('afk.json', JSON.stringify(afk))
            runEmbed
                .setDescription(`The afk check has been aborted.`)
                .setFooter(`The afk check has been aborted by ${reactor.nickname}`)
                .setTimestamp()
            controlEmbed.setFooter(`The afk check has been aborted by ${reactor.nickname}`)
            await commandMessage.edit(controlEmbed)
            await logMessage.edit(controlEmbed)
            try {
                await commandMessage.reactions.removeAll()
            } catch (e) { }
            await runMessage.edit(runEmbed)
            await raidingChannel.setName(raidingChannel.name.replace(' <-- Join!', ''))
            await raidingChannel.updateOverwrite(
                guildConfig.roles.general.raider,
                { 'CONNECT': false }
            )
            await raidingChannel.setUserLimit(99)

        }
    })

    //React with everything
    if (runType == 'cult') {
        await runMessage.react(cult.slice(1, -1))
        await runMessage.react(key.slice(1, -1))
        await runMessage.react(warrior.slice(1, -1))
        await runMessage.react(pally.slice(1, -1))
        await runMessage.react(knight.slice(1, -1))
        await runMessage.react(mseal.slice(1, -1))
        await runMessage.react(rusher.slice(1, -1))
        await runMessage.react(shinynitro.slice(1, -1))
        await runMessage.react('❌')
    } else if (runType == 'void') {
        await runMessage.react(entity.slice(1, -1))
        await runMessage.react(key.slice(1, -1))
        await runMessage.react(vial.slice(1, -1))
        await runMessage.react(warrior.slice(1, -1))
        await runMessage.react(pally.slice(1, -1))
        await runMessage.react(knight.slice(1, -1))
        await runMessage.react(mseal.slice(1, -1))
        await runMessage.react(shinynitro.slice(1, -1))
        await runMessage.react('❌')
    } else if (runType == 'fullskipvoid') {
        await runMessage.react(speedy.slice(1, -1))
        await runMessage.react(key.slice(1, -1))
        await runMessage.react(vial.slice(1, -1))
        await runMessage.react(warrior.slice(1, -1))
        await runMessage.react(pally.slice(1, -1))
        await runMessage.react(knight.slice(1, -1))
        await runMessage.react(mseal.slice(1, -1))
        await runMessage.react(brain.slice(1, -1))
        await runMessage.react(mystic.slice(1, -1))
        await runMessage.react(shinynitro.slice(1, -1))
        await runMessage.react('❌')
    } else if (runType == "oryx3") {
        await runMessage.react(oryx.slice(1, -1))
        await runMessage.react(helmetRune.slice(1, -1))
        await runMessage.react(swordRune.slice(1, -1))
        await runMessage.react(shieldRune.slice(1, -1))
        await runMessage.react(warrior.slice(1, -1))
        await runMessage.react(pally.slice(1, -1))
        await runMessage.react(knight.slice(1, -1))
        await runMessage.react(mseal.slice(1, -1))
        await runMessage.react(shinynitro.slice(1, -1))
        await runMessage.react('❌')
    }
}




const dungeons = {
    'c': 'cult',
    'cult': 'cult',
    'v': 'void',
    'void': 'void',
    'fsv': 'fullskipvoid',
    'fullskipvoid': 'fullskipvoid',
    'oryx3': "oryx3",
    'o3': "oryx3"
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