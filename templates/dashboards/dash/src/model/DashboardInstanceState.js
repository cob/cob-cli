class DashboardInstanceState {

    constructor() {
        const hashParts = window.location.hash.split("/")
        const [name, ...rest] = hashParts[2].split(":") // 1483415:{ dashboard state object }
        this._name = name
        this._config = rest.length > 1 ? JSON.parse(decodeURIComponent(rest.join(":"))) : {}
    }

    get name() {
        return this._name
    }

    getState(boardId) {
        return this._config[boardId]
    }

    setState(boardId, newState) {
        if (JSON.stringify(this._config[boardId]) === JSON.stringify(newState)) return

        this._config[boardId] = newState

        const hashParts = window.location.hash.split("/")
        // hash parts = ['#', 'cob.custom-resource', '1483415', 'dash?_=L.......']
        hashParts[2] = `${this._name}:${JSON.stringify(this._config)}`
        hashParts[3] = 'dash'

        const newDestination = hashParts.join("/")
        console.debug('[dash][Calendar] navigatingTo:', newDestination)
        window.location.hash = newDestination
    }
}

export default DashboardInstanceState
