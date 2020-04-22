const fs = require('fs')

exports.run = async (client, message, args, Discord, sudo = false) => {
    var config = JSON.parse(fs.readFileSync("config.json"))
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

    //Permission check
    if (!sudo) {
        let commandFile = require(`./permcheck.js`);
        var auth;
        if (origin == 100) {
            auth = await commandFile.run(client, message.member, 10000);
        } else if (origin == 10) {
            auth = await commandFile.run(client, message.member, 100);
        } else if (origin == 1) {
            auth = await commandFile.run(client, message.member, 1);
        }

        if (!auth) {
            return message.channel.send("You do not have permission to use this command.")
        }
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
        if (config.channels.veteran.raiding[channelNumber] == undefined) {
            return message.channel.send(`\`${channelNumber}\` is an invalid channel number.`)
        }
        if (config.channels.veteran.raiding[channelNumber].length == 0) {
            return message.channel.send(`Raiding Channel \`${channelNumber}\` has not been configured. Please have an admin add it using setup.`)
        } else {
            channelNumber = config.channels.veteran.raiding[channelNumber]
            statusChannel = config.channels.veteran.control.status
        }
    } else if (origin == 10) {
        if (config.channels.normal.raiding[channelNumber] == undefined) {
            return message.channel.send(`\`${channelNumber}\` is an invalid channel number.`)
        }
        if (config.channels.normal.raiding[channelNumber].length == 0) {
            return message.channel.send(`Raiding Channel \`${channelNumber}\` has not been configured. Please have an admin add it using setup.`)
        } else {
            channelNumber = config.channels.normal.raiding[channelNumber]
            statusChannel = config.channels.normal.control.status
        }
    } else if (origin = 1) {
        if (config.channels.event.raiding[channelNumber] == undefined) {
            return message.channel.send(`\`${channelNumber}\` is an invalid channel number.`)
        }
        if (config.channels.event.raiding[channelNumber].length == 0) {
            return message.channel.send(`Raiding Channel \`${channelNumber}\` has not been configured. Please have an admin add it using setup.`)
        }
        else {
            channelNumber = config.channels.event.raiding[channelNumber]
            statusChannel = config.channels.event.control.status
        }
    } else {
        return message.channel.send("You should not be here.")
    }
    //Fetch channel
    var raidingChannel = await message.guild.channels.cache.find(c => c.id == channelNumber)
    var statusChannel = await message.guild.channels.cache.find(c => c.id == statusChannel)

    //Run Type
    var runType = args.shift().toLowerCase()
    if (!dungeons.hasOwnProperty(runType)) {
        return message.channel.send(`\`${runType}\` is not a valid run type. Please check your spelling.`)
    }
    runType = dungeons[runType]

    //Location
    var runLocation = args.join(' ').trim()
    if (runLocation.length == 0) {
        return message.channel.send("Please input a location.")
    }

    //Check for other afks
    if (config.afk == true) {
        return message.channel.send("There is already another AFK check up. If you think this is a mistake, use \`resetafk\` and try again.")
    } else {
        config.afk = true
        fs.writeFileSync('config.json', JSON.stringify(config))
    }


    //Begin Commands/Log embed
    var logChannel = message.guild.channels.cache.find(c => c.id == config.channels.log.raid)
    var controlEmbed;
    var logMessage;
    var commandMessage;
    //End Commands/Log embed
    //Setup and send the embed in status
    if (!raidingChannel.name.includes(" <-- Join!")) {
        await raidingChannel.setName(raidingChannel.name + " <-- Join!")
    }
    await raidingChannel.updateOverwrite(config.roles.general.raider, {
        'CONNECT': true
    })
    await raidingChannel.setUserLimit(null)
    var runEmbed = new Discord.MessageEmbed()
        .setFooter(`Time Remaining: ${Math.floor(config.afkTime / 60000)} Minutes ${(config.afkTime % 60000) / 1000} Seconds`)
    var runAnnouncement;
    var runMessage;
    switch (runType) {
        case "cult":
            runAnnouncement = await statusChannel.send(`@here \`Cult\` (${cult}) started by <@${message.author.id}> in \`${raidingChannel.name}\``)
            runEmbed
                .setColor("#ff1212")
                .setAuthor(`Cult started by ${message.member.nickname} in ${raidingChannel.name}`, message.author.avatarURL())
                .setDescription(`To join, **connect to the raiding channel** and then react with ${cult}\nIf you have a key, react with ${key}\nIf you are bringing one of the following classes, please with react that class respectively ${warrior}${pally}${knight}\nIf you are bringing one of the following items (and plan on using it), please react with that item respectively ${mseal}${puri}\nIf you plan on rushing and have the <@&${config.roles.general.rusher}> role, you may react with ${rusher}\nIf you have the <@&${config.roles.general.nitro}> role, you may react with ${shinynitro} for early location\n(10 max)\nTo end this AFK Check, the raid leader can react with ❌`)
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
                .setDescription(`To join, **connect to the raiding channel** and then react with ${entity}\nIf you have a key or a vial, react with ${key} or ${vial} respectively\nIf you are bringing one of the following classes, please react with that class respectively ${warrior}${pally}${knight}\nIf you are bringing one of the following items (and plan on using it), please react with that item respectively ${mseal}${puri}\nIf you plan on rushing and have the <@&${config.roles.general.rusher}> role, you may react with ${rusher}\nIf you have the <@&${config.roles.general.nitro}> role, you may react with the ${shinynitro} for early location\n(10 max)\nTo end this AFK Check, the raid leader can react with the ❌`)
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
            runAnnouncement = await statusChannel.send(`@here \`Fullskip Void\` (${entity}) started by <@${message.author.id}> in \`${raidingChannel.name}\``)
            runEmbed
                .setColor("#000080")
                .setAuthor(`Void started by ${message.member.nickname} in ${raidingChannel.name}`, message.author.avatarURL())
                .setDescription(`To join, **connect to the raiding channel** and then react with ${entity}\nIf you have a key or a vial, react with ${key} or ${vial} respectively\nIf you are bringing one of the following classes, please react that with class respectively ${warrior}${pally}${knight}\nIf you are bringing one of the following items (and plan on using it), please react with that item respectively ${mseal}${puri}\nIf have a mystic or a brain trickster and plan on bringing it, react with the one you are bringing ${mystic}${brain}\nIf you have the <@&${config.roles.general.nitro}> role, you may react with the ${shinynitro} for early location (10 max)\nTo end this AFK Check, the raid leader can react with the ❌`)
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
    }
    //Timing Events
    var timeleft = config.afkTime
    //Edit AFK every 5 seconds
    var afkEdit = setInterval(async () => {
        timeleft -= 5000
        runEmbed.setFooter(`Time Remaining: ${Math.floor(timeleft / 60000)} Minutes ${(timeleft % 60000) / 1000} Seconds`)
        await runMessage.edit(runEmbed)
    }, 5000)
    //End AFK after this time
    var endAFK = setTimeout(async () => {
        clearInterval(afkEdit)
        config.afk = false
        fs.writeFileSync('config.json', JSON.stringify(config))
        await runAnnouncement.delete()
        await raidingChannel.setName(raidingChannel.name.replace(' <-- Join!', ''))
        await raidingChannel.updateOverwrite(
            config.roles.general.raider,
            { 'CONNECT': false }
        )
        controlEmbed.setFooter(`The afk check has ended automatically.`)
        await commandMessage.edit(controlEmbed)
        await logMessage.edit(controlEmbed)
        await commandMessage.reactions.removeAll()
        await raidingChannel.setUserLimit(99)
        /* let commandFile = require(`./POSTAFK.js`);
        await commandFile.run(client, raidingChannel, runMessage, origin, runType, runEmbed, Discord) */
        let thing = await runMessage.reactions.cache.find(r => r.emoji.name == '❌')
        await thing.remove()
        runEmbed
            .setFooter(`The AFK Check has ended automatically.`)
            .setDescription("The AFK Check has ended. There will be another run starting soon.")
            .setTimestamp()
        await runMessage.edit(runEmbed)
    }, config.afkTime)

    //Begin collecting reactions
    var filterAFK = (r, u) => !u.bot && (r.emoji.id == "702140477432004618" || r.emoji.id == "702140045871808632" || r.emoji.id == "702154477569835048" || r.emoji.id == '702131716726456501' || r.emoji.id == '702140245159837717' || r.emoji.id == '702141265545920562' || r.emoji.id == '702141266057625721' || r.emoji.name == "❌")
    collectorAFK = runMessage.createReactionCollector(filterAFK, { time: config.afkTime })
    var filterControl = (r, u) => !u.bot && (r.emoji.name == "❌")
    collectorControl = commandMessage.createReactionCollector(filterControl, { time: config.afkTime })
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

    collectorAFK.on('collect', async r => {
        let name = r.emoji.name
        var reactor = await r.users.cache.map(u => u.id)
        reactor = await message.guild.members.fetch(reactor[reactor.length - 1])
        reactorRoles = reactor.roles.cache.map(r => r.id)
        if (name == "nitro" || name == "shinynitro") {
            //Send Nitro Boosters location
            if (reactorRoles.includes(config.roles.general.nitro) && nitroCounter < 10 && !nitroArray.includes(`<@!${reactor.id}>`)) {
                nitroCounter += 1
                nitroArray.push(`<@!${reactor.id}>`)
                await reactor.send(`The location of the run in \`${raidingChannel.name}\` has been set to:\n\`${runLocation}\``)
                controlEmbed
                    .spliceFields((runType == 'fullskipvoid') ? 5 : 3, 1, { name: "Nitro Boosters:", value: nitroArray.join(', '), inline: false })
                await commandMessage.edit(controlEmbed)
                await logMessage.edit(controlEmbed)
            } else if (reactorRoles.includes(config.roles.general.nitro) && nitroCounter >= 10) {
                await reactor.send("There have already been 10 people who received nitro.")
            } else if (reactorRoles.includes(config.roles.general.nitro) && nitroArray.includes(`<@!${reactor.id}>`)) {
                await reactor.send("You have already received location.")
            }

        } else if (name == "vial" && (runType == "void" || runType == "fullskipvoid")) {
            //Confirming vials if necessary
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
                    } else if (vialRusherCounter >= 3) {
                        await reactor.send(`You have reacted with ✅. However, since we already have enough vials, you will not be getting location early. You *are* however, allowed to bring the vial just in case.`)
                    } else if (vialRusherArray.includes(`${vial}: <@!${reactor.id}>`)) {
                        await reactor.send("You have already reacted, and confirmed a vial.")
                    }
                } else {
                    await reactor.send(`You have reacted with ❌. As such, your vial will not be confirmed.`)
                }

            })


        } else if (name == "planewalker" && runType == "cult") {
            //Confirming rushers if necessary
            if (reactorRoles.includes(config.roles.general.rusher)) {
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

        } else if (name == "lhkey") {
            //Confirming key
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
                    } else if (keyCounter >= 1) {
                        await reactor.send(`You have reacted with ✅. However, since we already have enough keys, you will not be getting location early. You *are* however, allowed to bring your key just in case.`)
                    } else if (vialRusherArray.includes(`${rusher}: <@!${reactor.id}>`)) {
                        await reactor.send("You have already reacted, and confirmed your key.")
                    }
                } else {
                    await reactor.send(`You have reacted with ❌. As such, you will not be confirmed bringing a key.`)
                }

            })

        } else if (name == "fsvbrain" && runType == "fullskipvoid") {
            //Confirming brains if necessary
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
                    } else if (brainCounter >= 3) {
                        await reactor.send(`You have reacted with ✅. However, since we already have enough brains, you will not be getting location early. You *are* however, allowed to bring your brain trickster just in case.`)
                    } else if (brainArray.includes(`${brain}: <@!${reactor.id}>`)) {
                        await reactor.send("You have already reacted, and been confirmed as a brain trickster")
                    }
                } else {
                    await reactor.send(`You have reacted with ❌. As such, you will not be confirmed bringing a brain.`)
                }

            })

        } else if (name == "mystic" && runType == "fullskipvoid") {
            //Confirming mystics if necessary
            let confirmationMessage = await reactor.send(`You have reacted with ${mystic}.\nIf you have **85+ MHeal and are 6/8+** and you actually plan on bringing your mystic, react with ✅.\nIf you did not, or this was a mistake, react with ❌.\nRemember, fake reacting results in suspensions!`)
            await confirmationMessage.react("✅")
            await confirmationMessage.react("❌")
            let confirmationFilter = (r, u) => !u.bot && (r.emoji.name == "✅" || r.emoji.name == "❌")
            let confirmationCollector = confirmationMessage.createReactionCollector(confirmationFilter, { max: 1, time: 15000 })
            confirmationCollector.on('collect', async r => {
                let name = r.emoji.name
                if (name == '✅') {
                    if (brainCounter < 3 && !brainArray.includes(`${brain}: <@!${reactor.id}>`)) {
                        mysticCounter += 1
                        mysticArray.push(`${mystic}: <@!${reactor.id}>`)
                        await reactor.send(`The location of the run in \`${raidingChannel.name}\` has been set to:\n\`${runLocation}\`\nThe RL ${message.member.nickname} will be there to confirm your mystic.`)
                        controlEmbed
                            .spliceFields(4, 1, { name: "Mystics:", value: mysticArray.join('\n'), inline: false })
                        await commandMessage.edit(controlEmbed)
                        await logMessage.edit(controlEmbed)
                    } else if (mysticCounter >= 3) {
                        await reactor.send(`You have reacted with ✅. However, since we already have enough mystics, you will not be getting location early. You *are* however, allowed to bring your mystic just in case.`)
                    } else if (mysticArray.includes(`${mystic}: <@!${reactor.id}>`)) {
                        await reactor.send("You have already reacted, and been confirmed as mystic")
                    }
                } else {
                    await reactor.send(`You have reacted with ❌. As such, you will not be confirmed bringing a mystic.`)
                }
            })

        } else if (name == "❌") {
            //Ending the afk check
            let commandFile = require(`./permcheck.js`);
            var auth;
            if (origin == 100) {
                auth = await commandFile.run(client, reactor, 10000);
            } else if (origin == 10) {
                auth = await commandFile.run(client, reactor, 100);
            } else if (origin == 1) {
                auth = await commandFile.run(client, reactor, 1);
            }
            if (auth) {
                collectorAFK.stop()
                clearTimeout(endAFK)
                clearInterval(afkEdit)
                await runAnnouncement.delete()
                config.afk = false
                fs.writeFileSync('config.json', JSON.stringify(config))
                controlEmbed.setFooter(`The afk check has been ended by ${reactor.nickname}`)
                await commandMessage.edit(controlEmbed)
                await logMessage.edit(controlEmbed)
                await commandMessage.reactions.removeAll()
                await raidingChannel.setName(raidingChannel.name.replace(' <-- Join!', ''))
                await raidingChannel.updateOverwrite(
                    config.roles.general.raider,
                    { 'CONNECT': false }
                )
                await raidingChannel.setUserLimit(99)
                /* let commandFile = require(`./POSTAFK.js`);
                await commandFile.run(client, raidingChannel, runMessage, origin, runType, runEmbed, Discord) */
                let thing = await runMessage.reactions.cache.find(r => r.emoji.name == '❌')
                await thing.remove()
                runEmbed
                    .setDescription(`The afk check has ended. We are currently running with ${raidingChannel.members.map(u => u.id).length} raiders.\nIf you missed this run, another will be starting shortly.`)
                    .setFooter(`The afk check has been ended by ${reactor.nickname}`)
                    .setTimestamp()
                await runMessage.edit(runEmbed)
            }

        }
    })

    //Dealing with reactions on AFK Control
    collectorControl.on('collect', async r => {
        var reactor = await r.users.cache.map(u => u.id)
        reactor = await message.guild.members.fetch(reactor[reactor.length - 1])
        //Aborting the afk check
        let commandFile = require(`./permcheck.js`);
        var auth;
        if (origin == 100) {
            auth = await commandFile.run(client, reactor, 10000);
        } else if (origin == 10) {
            auth = await commandFile.run(client, reactor, 100);
        } else if (origin == 1) {
            auth = await commandFile.run(client, reactor, 1);
        }
        if (auth) {
            collectorAFK.stop()
            await commandMessage.reactions.removeAll()
            let thing = await runMessage.reactions.cache.find(r => r.emoji.name == '❌')
            if (thing) {
                await thing.remove()
            }
            clearTimeout(endAFK)
            clearInterval(afkEdit)
            await runAnnouncement.delete()
            config.afk = false
            fs.writeFileSync('config.json', JSON.stringify(config))
            runEmbed
                .setDescription(`The afk check has been aborted.`)
                .setFooter(`The afk check has been aborted by ${reactor.nickname}`)
                .setTimestamp()
            controlEmbed.setFooter(`The afk check has been aborted by ${reactor.nickname}`)
            await commandMessage.edit(controlEmbed)
            await logMessage.edit(controlEmbed)
            await commandMessage.reactions.removeAll()
            await runMessage.edit(runEmbed)
            await raidingChannel.setName(raidingChannel.name.replace(' <-- Join!', ''))
            await raidingChannel.updateOverwrite(
                config.roles.general.raider,
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
        await runMessage.react(puri.slice(1, -1))
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
        await runMessage.react(puri.slice(1, -1))
        await runMessage.react(mseal.slice(1, -1))
        await runMessage.react(shinynitro.slice(1, -1))
        await runMessage.react('❌')
    } else if (runType == 'fullskipvoid') {
        await runMessage.react(entity.slice(1, -1))
        await runMessage.react(key.slice(1, -1))
        await runMessage.react(vial.slice(1, -1))
        await runMessage.react(warrior.slice(1, -1))
        await runMessage.react(pally.slice(1, -1))
        await runMessage.react(knight.slice(1, -1))
        await runMessage.react(puri.slice(1, -1))
        await runMessage.react(mseal.slice(1, -1))
        await runMessage.react(brain.slice(1, -1))
        await runMessage.react(mystic.slice(1, -1))
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
    'fullskipvoid': 'fullskipvoid'
}
//Important Emojis
var speedy = ""
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