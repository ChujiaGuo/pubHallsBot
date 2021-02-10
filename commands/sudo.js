const fs = require('fs')
const { exec } = require('child_process')

exports.run = async (client, message, args, Discord) => {
    try {
        const config = JSON.parse(fs.readFileSync('config.json'))
        const commands = JSON.parse(fs.readFileSync('commands.json'))
        if (message.author.id != config.dev) {
            let owner = await client.users.fetch(config.dev)
            return owner.send(`<@${message.author.id}> just attempted to use sudo.`)
        }
        let cmd = args.shift().toLowerCase()
        if(cmd.concat(args).join(' ').toLowerCase() == 'make a sandwhich') return message.channel.send("🥪")
        if (cmd != "run" && cmd != "exec") {
            cmd = commands.aliases[cmd] || cmd
            let commandFile = require(`./${cmd}.js`);
            return commandFile.run(client, message, args, Discord, true);
        } else if (cmd == "run") {
            const clean = text => {
                if (typeof (text) === "string")
                    return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
                else
                    return text;
            }
            let code = clean(args.join(" "))
            await message.channel.send(`Running: \`${code}\``)
            try {
                return eval(code)
            } catch (e) {
                return message.channel.send(e)
            }
        } else {
            exec(args.join(' '), (err, stdout, stderr) => {
                if (err) {
                    message.author.send(`Error: ${err.message}`)
                    return;
                }
                if (stderr) {
                    message.author.send(`stderr: ${stderr}`)
                    return;
                }
                message.author.send(`stdout: ${stdout}`)
            })
        }
    } catch (e) {

    }

}