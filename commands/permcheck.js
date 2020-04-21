const fs = require('fs')

exports.run = async (client, member, checkint) => {
    let userperms = 0
    var config = JSON.parse(fs.readFileSync("config.json"))
    if (member.id == config.dev) {
        return true
    }
    var roles = await member.roles.cache.map(r => r.id)
    for (var i in roles) {
        let id = roles[i]
        if (id == config.roles.staff.admin) {
            userperms += 1000000000
        } else if (id == config.roles.staff.mod) {
            userperms += 100000000
        } else if (id == config.roles.staff.hrl) {
            userperms += 10000000
        } else if (id == config.roles.staff.officer) {
            userperms += 1000000
        } else if (id == config.roles.staff.security) {
            userperms += 100000
        } else if (id == config.roles.staff.vrl) {
            userperms += 10000
        } else if (id == config.roles.staff.rl) {
            userperms += 1000
        } else if (id == config.roles.staff.arl) {
            userperms += 100
        } else if (id == config.roles.staff.heo) {
            userperms += 10
        } else if (id == config.roles.staff.eo) {
            userperms += 1
        }
    }
    if (userperms >= checkint) {
        return true
    } else {
        return false
    }

}