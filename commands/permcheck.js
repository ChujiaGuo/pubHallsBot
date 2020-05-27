const fs = require('fs')

exports.run = async (client, member, checkint) => {
    let userperms = 0
    var config = JSON.parse(fs.readFileSync("config.json"))
    /* if (member.id == config.dev) {
        return true
    } */
    try{
        if(member.guild.roles.cache.has(checkint)){
            if(member.roles.hoist.comparePositionTo(checkint) >= 0){
                return true
            }else{
                return false
            }
        }else{
            return false
        }
    }catch(e){
        let owner = await client.users.fetch(config.dev)
        var errorEmbed = new Discord.MessageEmbed()
            .setColor("#ff1212")
            .setTitle("Error")
            .setDescription(`Error Processing: \`permcheck\`\nError Message:\`\`\`${e.toString()}\`\`\`\From User: <@${member.id}>\nIn guild: \`${member.guild.name}\``)
        await owner.send(errorEmbed)
        return false
    }
    
    

}