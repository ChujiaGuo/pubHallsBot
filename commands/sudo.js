const fs = require('fs')

exports.run = async (client, message, args, Discord) => {
    try {
        const config = JSON.parse(fs.readFileSync('config.json'))
        const commands = JSON.parse(fs.readFileSync('commands.json'))
        if (message.author.id != config.dev) {
            let owner = await client.users.fetch(config.dev)
            return owner.send(`<@${message.author.id}> just attempted to use sudo.`)
        }
        let cmd = args.shift().toLowerCase()
        if (cmd != "run") {
            cmd = commands.aliases[cmd] || cmd
            let commandFile = require(`./${cmd}.js`);
            return commandFile.run(client, message, args, Discord, true);
        } else {
            const clean = text => {
                if (typeof (text) === "string")
                    return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
                else
                    return text;
            }
            let code = clean(args.join(" "))
            await message.channel.send(`Running: \`${code}\``)
            try{
                return eval(code)
            }catch(e){
                return message.channel.send(e)
            }
        }
    } catch (e) {

    }

}