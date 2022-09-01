const DEBUG = true
class ComponentStatePersistence {
    constructor(id,updateCb) {
        this._id = id
        this.content = this._getStateFromHash()
        updateCb(this.content)
        this._onHashChange = function() {
            if(DEBUG) console.log("[STATE] Hash changed",this._id,this._content)
            this.content = this._getStateFromHash()
            if(updateCb) updateCb(this.content)
        }.bind(this)
        window.addEventListener('hashchange', this._onHashChange, true);
    }
    
    get content() {
        return this._content
    }

    set content(newContent) {
        if(DEBUG) console.log("[STATE] update value:", JSON.stringify(this._content) !== JSON.stringify(newContent), this._id,JSON.stringify(this._content),JSON.stringify(newContent))
        if (JSON.stringify(this._content) !== JSON.stringify(newContent)) {
            this._content = newContent
            this._setStateInHash()
        }
    }

    stop() {
        if(DEBUG) console.log("[STATE] stoped",this._id,this.content,this._getStateFromHash())
        window.removeEventListener('hashchange', this._onHashChange, true)
    }
    
    _getStateFromHash() {
        const hashParts = window.location.hash.split("/")
        const [name, ...rest] = hashParts[2].split(":")
        let statesInHash = rest.length > 1 ? JSON.parse(decodeURIComponent(rest.join(":"))) : {}
        return statesInHash[this._id]
    }

    _setStateInHash() {
        const hashParts = window.location.hash.split("/")
        const [name, ...rest] = hashParts[2].split(":")
        let statesInHash = rest.length > 1 ? JSON.parse(decodeURIComponent(rest.join(":"))) : {}

        // Update if content changed and we are still in a dash custom-UI
        if(JSON.stringify(statesInHash[this._id]) !== JSON.stringify(this._content) && hashParts[3] && hashParts[3].startsWith("dash") ) {
            // Update id property or remove it, if content is empty
            if( this._content ) {
                statesInHash[this._id] = this._content
            } else {
                delete statesInHash[this._id]
            }
    
            hashParts[2] = Object.keys(statesInHash).length > 0 ? `${name}:${JSON.stringify(statesInHash)}` : name
    
            const newDestination = hashParts.join("/")
            if(history.pushState) {
                history.pushState(null, null, newDestination);
            }
            else {
                location.hash = newDestination;
            }
        }
    }
}

export default ComponentStatePersistence