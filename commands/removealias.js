const fs = require('fs')

exports.run = async (client, message, args, Discord, sudo = false) => {
    var commands = JSON.parse(fs.readFileSync("commands.json"))
    const config = JSON.parse(fs.readFileSync(`./configs/${message.guild.id}.json`));

    if (args.length < 2) {
        return message.channel.send(`You are missing arguments. Expected 2, received ${args.length}.`)
    }
    let remAlias = args.shift().toLowerCase()
    let command = args.shift().toLowerCase()

    if (!commands.settings[command]) {
        return message.channel.send(`${command} is not a valid command. Please try again.`)
    }
    if (!commands.aliases[remAlias]) {
        return message.channel.send(`${remAlias} is not an alias for ${command}. Please try again.`)
    }
    let confirmationFilter = (r, u) => !u.bot && ["✅", "❌"].includes(r.emoji.name) && u.id == message.member.id
    let confirmationMessage = await message.channel.send(`Are you sure you want to remove \`${remAlias}\` as an alias for \`${command}\`?`)
    await confirmationMessage.react("✅")
    await confirmationMessage.react("❌")
    await confirmationMessage.awaitReactions(confirmationFilter, { time: 15000, max: 1 })
        .then(async (r, u) => {
            if (r.size > 0) {
                r = r.map(e => e)[0]
                if (r.emoji.name == "✅") {
                    await confirmationMessage.edit(`Confirmation given. Alias ${remAlias} will be removed from ${command}`)
                    delete commands.aliases[remAlias]
                    fs.writeFileSync("commands.json", JSON.stringify(commands))
                } else {
                    await confirmationMessage.edit("Confirmation withheld. The alias will not be removed.")
                }
            } else {
                await confirmationMessage.edit("No confirmation given. Alias will not be removed.")
            }
        })

}