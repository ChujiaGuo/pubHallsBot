class afk {
    location = "";
    runType = "";
    key = "";
    rushers = [];
    vials = [];
    mystics = [];
    brains = [];
    nitro = [];

    constructor(location, runType) {
        this.location = location
        this.runType = runType
    }
    get loc(){
        return this.location
    }
    get users(){
        return this.rushers.concat(this.vials, this.mystics, this.brains, this.nitro).push(key)
    }
    setKey(id) {
        if(isNaN(id)){
            return false
        }
        this.key = id
    }
    setLocation(loc){
        this.location = loc
    }
    addRusher(id){
        if(isNaN(id)){
            return false
        }
        this.rushers.push(id)
    }
    addVial(id) {
        if(isNaN(id)){
            return false
        }
        this.vials.push(id)
    }
    addMystic(id) {
        if(isNaN(id)){
            return false
        }
        this.mystics.push(id)
    }
    addBrain(id) {
        if(isNaN(id)){
            return false
        }
        this.brains.push(id)
    }
    addNitro(id) {
        if(isNaN(id)){
            return false
        }
        this.nitro.push(id)
    }
}

module.exports = afk