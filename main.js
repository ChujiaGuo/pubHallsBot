const fs = require("fs");
const dist = require("js-levenshtein")
const Discord = require("discord.js");
const client = new Discord.Client();
var config = JSON.parse(fs.readFileSync("config.json"))
var commands = JSON.parse(fs.readFileSync("commands.json"))

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
    afk = {
        "afk": false,
        "location": "",
        "statusMessageId": "",
        "infoMessageId": "",
        "commandMessageId": "",
        "earlyLocationIds": []
    }
    fs.writeFileSync('afk.json', JSON.stringify(afk))
    console.log("Bot Up.")
    let owner = await client.users.fetch(config.dev)
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
client.on("rateLimit", r => {
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
        console.log(e)
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

client.login(config.auth)