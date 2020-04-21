const fs = require('fs')

exports.run = async (client, message, args, Discord, sudo = false) => {
    //Check Perms
    if (message.channel.type != 'text') {
        return message.channel.send("You cannot use this command here.")
    }
    var origin = 0;
    if (!sudo) {
        let commandFile = require(`./permcheck.js`);
        let auth = await commandFile.run(client, message.member, 10000);
        if (!auth) {
            return message.channel.send("You do not have permission to use this command.")
        }


        var config = JSON.parse(fs.readFileSync("config.json"))

        //Check channel
        if (message.channel.id == config.channels.command.veteran) {
            origin = 100
        } else if (message.channel.id == config.channels.command.staff) {
            origin = 10
        } else if (message.channel.id == config.channels.command.event) {
            origin = 1
        } else {
            return message.channel.send("You cannot use this command here.")
        }
    }

    //Argument Parsing
    const channelNumber = args.shift()
    if (origin == 100) {

    }else if(origin == 10){

    }else if(origin = 1){
        
    }else{
        return message.channel.send("You should not be here.")
    }
    const runType = args.shift()
    if (!dungeons.hasOwnProperty(runType)) {
        returnEmbed.setDescription(`${runType} is not a valid run type. Please check your spelling.`)
        return message.channel.send(returnEmbed)
    }

}
const dungeons = {
    'avc': 'abc'
}