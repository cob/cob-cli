class DashboardComponentState {
    constructor(id) {
        this._id = id
        this.content = this._getStateFromHash()
        window.addEventListener('hashchange', this._updateStateFromHash.bind(this), false);
    }
    
    get content() {
        return this._content
    }

    set content(newContent) {
        if (JSON.stringify(this._content) === JSON.stringify(newContent)) return
        this._content = newContent
        this._setStateInHash()
    }

    stop() {
        window.removeEventListener('hashchange',this._updateStateFromHash.bind(this))
    }

    _updateStateFromHash() {
        this.content = this._getStateFromHash()
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
        if (JSON.stringify(statesInHash[this._id]) === JSON.stringify(this._content)) return

        statesInHash[this._id] = this._content

        hashParts[2] = `${name}:${JSON.stringify(statesInHash)}`
        const newDestination = hashParts.join("/")
        if(history.pushState) {
            history.pushState(null, null, newDestination);
        }
        else {
            location.hash = newDestination;
        }
    }
}

export default DashboardComponentState