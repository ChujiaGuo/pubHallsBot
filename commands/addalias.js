const fs = require('fs')

exports.run = async (client, message, args, Discord, sudo = false) => {
    var commands = JSON.parse(fs.readFileSync("commands.json"))

    if (args.length < 2) {
        return message.channel.send(`You are missing arguments. Expected 2, received ${args.length}.`)
    }
    let newAlias = args.shift().toLowerCase()
    let command = args.shift().toLowerCase()

    if (/[^a-z]/gi.test(newAlias)) {
        return message.channel.send("Aliases cannot contain non-alphabetical characters. Please try again.")
    }
    if (commands.aliases[newAlias]) {
        return message.channel.send(`${newAlias} is already an alias for ${commands.aliases[newAlias]}. Please try again.`)
    }
    if (!commands.settings[command]) {
        return message.channel.send(`${command} is not a valid command. Please try again.`)
    }
    let confirmationFilter = (r, u) => !u.bot && ["✅", "❌"].includes(r.emoji.name) && u.id == message.member.id
    let confirmationMessage = await message.channel.send(`Are you sure you want to set \`${newAlias}\` as an alias for \`${command}\`?`)
    await confirmationMessage.react("✅")
    await confirmationMessage.react("❌")
    await confirmationMessage.awaitReactions(confirmationFilter, { time: 15000, max: 1 })
        .then(async (r, u) => {
            if (r.size > 0) {
                r = r.map(e => e)[0]
                if (r.emoji.name == "✅") {
                    await confirmationMessage.edit(`Confirmation given. Alias ${newAlias} will be added to ${command}`)
                    commands.aliases[newAlias] = command
                    fs.writeFileSync("commands.json", JSON.stringify(commands))
                } else {
                    await confirmationMessage.edit("Confirmation withheld. The alias will not be added.")
                }
            } else {
                await confirmationMessage.edit("No confirmation given. Alias will not be added.")
            }
        })

}