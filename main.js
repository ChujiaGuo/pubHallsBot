const fs = require("fs");
const dist = require("js-levenshtein")
const Discord = require("discord.js");
const { Socket } = require("dgram");
const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });
var config = JSON.parse(fs.readFileSync("config.json"))
var mainConfig = { dev: config.dev }
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
    fs.writeFileSync('processes.json', JSON.stringify(processes))
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
    // setInterval(async () => {
    //     let leaverequests = JSON.parse(fs.readFileSync('acceptedleaverequests.json'))
    //     for (var i in leaverequests) {
    //         let currentTime = Date.now()
    //         if (currentTime >= leaverequests[i].endingAt) {
    //             let guild = await client.guilds.resolve(leaverequests[i].guildId)
    //             let member = await guild.members.fetch(i)
    //             let channel = await guild.channels.cache.find(c => c.id == config.channels.log.leaverequest)
    //             let embed = new Discord.MessageEmbed()
    //                 .setColor("#41f230")
    //                 .setAuthor(`${member.nickname}(Username: ${member.user.username})'s leave has expired`)
    //                 .setDescription(`Their roles:\n${leaverequests[i].roles.join(", ")}`)
    //             await channel.send(`<@!${leaverequests[i].approvedBy}>, <@!${member.id}>'s leave has expired. If they want to stay on leave, please have them request leave again.`, embed)
    //             delete leaverequests[i]
    //         }
    //     }
    //     fs.writeFileSync('acceptedleaverequests.json', JSON.stringify(leaverequests))
    // }, 60000)
})
// client.on("guildMemberAdd", async member => {
//     //People Leaving and Rejoin Guild to Bypass Suspensions
//     let guildId = member.guild.id
//     let id = member.id
//     const suspensions = JSON.parse(fs.readFileSync('suspensions.json'))
//     var temp, vet, perma
//     if (suspensions.normal.id) {
//         await member.roles.add(config.roles.general.tempsuspended)
//         temp == true;
//     }
//     if (suspensions.veteran.id && temp != true) {
//         await member.roles.add(config.roles.general.vetsuspended)
//     }
//     if (suspensions.perma.id) {
//         await member.roles.add(config.roles.general.permasuspended)
//     }

// })
client.on("messageReactionAdd", async (r, u) => {
    if (u.bot) return;
    if (r.partial) await r.fetch().catch(e => console.log(e))
    let messageReactionAdd = require('./events/messageReactionAdd.js')
    await messageReactionAdd.run(client, r.message, Discord, r, u).catch(e => e.toString().includes('Error') ? errorHelper.report(r.message, client, e) : e)
})
client.on("message", async message => {
    commands = JSON.parse(fs.readFileSync("commands.json"))
    processes = JSON.parse(fs.readFileSync('processes.json'))
    if (message.author.bot) return;

    //DM Channel
    if (message.channel.type == "dm" && !activeDMs.includes(message.author.id)) {
        if (processes.pendingRestart) return message.channel.send("Bot is pending a restart. Please try again later.")
        //Commands in DMs

        let allowedCommands = ['joinruns']
        let [cmd, ...args] = [...message.content.split(' ')]
        cmd = cmd.replace(/[^a-z]/gi, "")
        cmd = commands.aliases[cmd] || cmd
        if (allowedCommands.includes(cmd)) {
            //Command
            let cmdFile = `./commands/${cmd}.js`
            delete require.cache[require.resolve(cmdFile)];
            let commandFile = require(cmdFile);
            commandFile.run(client, message, args, Discord)
        } else {
            //Modmail
            let allow = await sqlHelper.checkModMailBlacklist(message.author.id).catch(e => errorHelper.report(message, client, e))
            if (allow) {
                let modmailCommand = require('./commands/modmail.js')
                activeDMs.push(message.author.id)
                await modmailCommand.run(client, message, Discord).catch(e => e)
                return activeDMs.splice(activeDMs.indexOf(message.author.id), 1)
            } else {
                return
            }
        }
    }

    //Filters
    //Bot
    config = JSON.parse(fs.readFileSync("config.json"))[message.guild.id]
    if (message.content.includes(`<@!${client.user.id}> prefix`)) return message.channel.send(config.prefix)



    //Check for role pings and auto-mute
    if (message.mentions.roles.size > 0 && config.automute.enabled.toLowerCase() == "true") {
        let member = message.member
        let permcheck = require('./commands/permcheck.js')
        let auth = await permcheck.run(client, member, config.automute.minrole)
        if (!auth) {
            await member.roles.add(config.roles.general.muted)
            await sqlHelper.mute(client, member, "Pinging Roles", Date.now() + parseInt(config.automute.duration))

            let logEmbed = new Discord.MessageEmbed()
                .setColor("#30ffea")
                .setAuthor("User Muted")
                .setDescription(`Duration: ${await toTimeString(config.automute.duration)}\nReason: Pinging Roles`)
                .addField(`User's Server Name: ${member.nickname}`, `${member} (Username: ${member.user.username})`)

            await member.send(logEmbed)
            logEmbed.description = logEmbed.description + `\nOriginal Message [Here](${message.url})\nOriginal Message Content:\n${message.content}`
            let logChannel = message.guild.channels.cache.find(c => c.id == config.channels.log.mod)
            await logChannel.send(logEmbed)

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
        if (cmd != "sudo" && (commands.settings[cmd] == undefined || commands.settings[cmd].enabled[message.guild.id].toLowerCase() != "true")) {
            return message.channel.send(`This command is not enabled. Please get a mod to enable it.`)
        }
        if (cmd != "sudo" && (!isNaN(commands.settings[cmd].permsint) && commands.settings[cmd].permsint[message.guild.id].length == 0)) {
            return message.channel.send("The perms int for this command is not a number. Please get a mod to fix it.")
        }
        if (cmd != "sudo" && commands.settings[cmd].permsint != "0") {
            let permissionsFile = require(`./commands/permcheck.js`);
            var auth;
            auth = await permissionsFile.run(client, message.member, commands.settings[cmd].permsint[message.guild.id]);
            if (!auth) {
                let noPerms = new Discord.MessageEmbed()
                    .setColor("#ff1212")
                    .setAuthor("Permission Denied")
                    .setDescription(`You do not have permission to use this command.\n<@&${commands.settings[cmd].permsint[message.guild.id]}> or higher is required to use it.`)
                return message.channel.send(noPerms)
            }
        }
        try {
            await message.guild.members.fetch()
            if (cmd == "report") {
                activeDMs.push(message.author.id)
            }
            if (processes.pendingRestart) return message.channel.send("Bot is pending a restart. Please try again later.")

            //Log into active processes
            var processes = JSON.parse(fs.readFileSync('processes.json'))
            var hidden = args.includes("-hidden") || args.includes("-h") ? true : false
            processes.activeProcesses.push([message.author.id, cmd, message.url, hidden])
            fs.writeFileSync('processes.json', JSON.stringify(processes))
            await processManager.updateStatusMessage(client)

            //Run Command
            await commandFile.run(client, message, args, Discord).catch(e => e && errorHelper.report(message, client, e));

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
            var owner = await client.users.fetch(mainConfig.dev)
            errorEmbed.setDescription(`There was a problem processing \`$${cmd}\` for the following reason: \n\nAn internal error occured. The developer has been notified of this and will fix it as soon as possible. The bot will DM you once finished.`)
            await message.channel.send(errorEmbed)
            errorEmbed.setDescription(`Error Processing: \`${cmd}\`\nError Message:\`\`\`${e.toString()}\`\`\`\From User: <@${message.author.id}>\nIn guild: \`${message.guild.name}\``)
            await owner.send(errorEmbed)
        }
    }
})

client.on("guildMemberUpdate", async (oldMember, newMember) => {
    var fullConfig = JSON.parse(fs.readFileSync("config.json"))

    //Get difference between two members
    let flags = { guildid: newMember.guild.id, memberid: newMember.id }

    if ((newMember.nickname && oldMember.nickname) && newMember.nickname.replace(/[^a-z|]/gi, "").toLowerCase() != oldMember.nickname.replace(/[^a-z|]/gi, "").toLowerCase()) { flags["changed_name"] = { new: newMember.nickname, old: oldMember.nickname } } //Names

    let roles = await roleDiff(oldMember, newMember) //Roles
    if (roles.changed) { flags['changed_roles'] = roles }

    if (Object.keys(flags).length <= 2) return;
    console.log(flags)

    //Get other server and member
    let servers = ["343704644712923138", "708026927721480254"]
    let otherServer = client.guilds.cache.find(g => g.id == servers.filter(i => i != newMember.guild.id)[0])
    if (!otherServer) return console.log(`Other guild not found. Original Guild: ${newMember.guild.name} ${newMember.guild.id}`);
    let otherMember = await otherServer.members.fetch(newMember.user).catch(e => e)
    if (!otherMember) return console.log(`Other Member not found. Original Member: ${newMember.id}`)

    var thisServerConfig = fullConfig[newMember.guild.id]
    var otherServerConfig = fullConfig[otherServer.id]

    //Get role and member caches
    await otherServer.roles.fetch()
    await otherServer.members.fetch()

    //Get Log channel in other server
    let logChannel = otherServer.channels.cache.find(c => c.id == otherServerConfig.channels.log.mod)

    //Get Affiliate Staff in other server
    let affiliateRole = otherServer.roles.cache.find(r => r.id = otherServerConfig.roles.general.affiliate)

    //Get Staff Roles in current server
    let staffRoles = Object.values(thisServerConfig.roles.staff)

    //Copy over changed names
    if (flags.changed_name) {
        let newName = flags.changed_name.new
        let oldName = otherMember.nickname

        //Prefix Checking
        if (oldName && oldName.match(/[^a-z|\s]/gi)) {
            newName = oldName.match(/[^a-z|\s]/gi)[0] + newName.match(/[a-z|\s]/gi).join("")
        } else {
            newName = newName.match(/[a-z|\s]/gi).join("")
        }

        //Name Formatting
        if (newName == otherMember.user.username) {
            newName = newName.toLowerCase()
            if (newName == otherMember.user.username) {
                newName = newName.charAt(0).toUpperCase() + newName.substring(1)
            }
        }

        if (oldName == newName) return console.log("Automatic name change aborted: Names already match")
        if (otherMember.roles.cache.size <= 1) return console.log("Automatic name change aborted: Other member not verified")
        var logEmbed = new Discord.MessageEmbed()
            .setColor("#41f230")
            .setTitle("Name Changed")
            .setDescription(`Name Changed for:\n\`${otherMember.nickname}\` <@!${otherMember.id}>\nOld Name: ${oldName}\nNew Name: ${newName}`)
            .addField(`User's Server Name: \`${otherMember.nickname}\``, `<@!${otherMember.id}> (Username: ${otherMember.user.username})`, true)
            .addField(`Mod's Server Name: \`${newMember.guild.name} Auto\``, `N/A`, true)
            .setTimestamp()
        try {
            await otherMember.setNickname(newName)
            await logChannel.send(logEmbed)
            console.log(`Automatic Name Change Successful for ${otherMember.id} in ${newMember.guild.name}: ${oldName} -> ${newName}`)
        } catch (e) {
            console.error(e)
        }

    }

    if (flags.changed_roles) {
        //Give Affiliate Staff
        let isStaff = await intersect(staffRoles, newMember.roles.cache.map(r => r.id))
        let removedStaff = await intersect(staffRoles, flags.changed_roles.removed)
        let addedRoles = flags.changed_roles.added.map(id => newMember.guild.roles.cache.find(r => r.id == id) || id)
        let removedRoles = flags.changed_roles.removed.map(id => newMember.guild.roles.cache.find(r => r.id == id) || id)
        if (!addedRoles) addedRoles = []
        if (!removedRoles) removedRoles = []

        if (isStaff.length >= 1) {
            let logEmbed = new Discord.MessageEmbed()
                .setColor("#41f230")
                .setTitle("Affiliate Staff Given")
                .setDescription(`${affiliateRole} given to: ${otherMember}`)
                .addField(`User's Server Name: \`${otherMember.nickname}\``, `<@!${otherMember.id}> (Username: ${otherMember.user.username})`, true)
                .addField(`Mod's Server Name: \`${newMember.guild.name} Auto\``, `N/A`, true)
                .addField(`Other Member Roles:`, `${newMember.roles.cache.map(r => r.name).join(', ')}` || "None")
                .addField(`Roles Added:`, addedRoles.map(r => r.name).join(', ') || "N/A", true)
                .addField(`Roles Removed:`, removedRoles.map(r => r.name).join(', ') || "N/A", true)
                .setTimestamp()
            try {
                if(affiliateRole.name != "Affiliate Staff" || affiliateRole.id != otherServerConfig.roles.general.affiliate) return console.log(`Affiliate staff aborted (Giving): Incorrect role selected. Selected Role: (Name: ${affiliateRole.name}, Id: ${affiliateRole.id})`)
                if(otherMember.roles.cache.has(affiliateRole.id)) return console.log (`Affiliate staff aborted: Other member already has role.`)
                await otherMember.roles.add(affiliateRole)
                await logChannel.send(logEmbed)
                console.log(`Affiliate Staff Successfully Given for ${otherMember.id} in ${otherMember.guild.name}`)
            } catch (e) {
                console.error(e)
            }
        }

        //Remove Affiliate Staff
        if (removedStaff.length >= 1 && isStaff.length < 1) {
            let logEmbed = new Discord.MessageEmbed()
                .setColor("#41f230")
                .setTitle("Affiliate Staff Removed")
                .setDescription(`Affiliate Staff removed from: ${otherMember}`)
                .addField(`User's Server Name: \`${otherMember.nickname}\``, `<@!${otherMember.id}> (Username: ${otherMember.user.username})`, true)
                .addField(`Mod's Server Name: \`${newMember.guild.name} Auto\``, `N/A`, true)
                .addField(`Other Member Roles:`, `${newMember.roles.cache.map(r => r.name).join(', ')}` || "None")
                .addField(`Roles Added:`, addedRoles.map(r => r.name).join(', ') || "N/A", true)
                .addField(`Roles Removed:`, removedRoles.map(r => r.name).join(', ') || "N/A", true)
                .setTimestamp()
            try {
                if(affiliateRole.name != "Affiliate Staff" || affiliateRole.id != otherServerConfig.roles.general.affiliate) return console.log(`Affiliate staff aborted (Removal): Incorrect role selected. Selected Role: (Name: ${affiliateRole.name}, Id: ${affiliateRole.id})`)
                await otherMember.roles.remove(affiliateRole)
                await logChannel.send(logEmbed)
                console.log(`Affiliate Staff Successfully Removed for ${otherMember.id} in ${otherMember.guild.name}`)
            } catch (e) {
                console.error(e)
            }
        }
    }

    async function roleDiff(oldMember, newMember) {
        let oldRoles = oldMember.roles.cache.map(r => r.id)
        let newRoles = newMember.roles.cache.map(r => r.id)
        var removed = []
        var added = []
        for (var i in newRoles) {
            if (!oldRoles.includes(newRoles[i])) {
                added.push(newRoles[i])
            }
        }
        for (var i in oldRoles) {
            if (!newRoles.includes(oldRoles[i])) {
                removed.push(oldRoles[i])
            }
        }
        return {
            "changed": (added.length > 0 || removed.length > 0) ? true : false,
            "added": added,
            "removed": removed
        }
    }
    async function intersect(arr1, arr2) {
        let set2 = new Set(arr2)
        return [...new Set(arr1)].filter(x => set2.has(x))
    }
})

process.stdin.resume()
process.on("uncaughtException", async (err) => {
    var owner = await client.users.fetch(mainConfig.dev)
    await owner.send(`An uncaught error occured: \`\`\`${err.stack.substring(0, 1800)}\`\`\``)
    console.log(err)

    let processes = JSON.parse(fs.readFileSync('processes.json'))
    processes.pendingRestart = true;
    processes.botStatus = "#ff1212"
    processes.additionalInfo = "Unexpected Restart"
    fs.writeFileSync("processes.json", JSON.stringify(processes))
    await processManager.updateStatusMessage(client)
    restart()
})
process.on("unhandledRejection", async (err) => {
    console.log(err)
})
async function restart() {
    let processes = JSON.parse(fs.readFileSync('processes.json'))
    if (processes.activeProcesses.length > 0) {
        let timeout = setTimeout(restart, 5000)
    } else {
        process.exit(1)
    }
}
client.login(config.auth)
async function toTimeString(time) {
    return `${Math.floor(time / 604800000)} Weeks ${Math.floor(time % 604800000) / 86400000} Days`
}