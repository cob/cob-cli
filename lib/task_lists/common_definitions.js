const axios = require("axios");

async function getFilteredDefinitions(servername, defConfigs) {
    const uri = `https://${servername}.cultofbits.com/recordm/recordm/definitions`
    const response = await axios.get( uri );

    if(response.status != 200){
        throw new Error(`HTTP Error Response: ${response.status} ${response.statusText}`);
    }

    let result = defConfigs.flatMap(c => {
        return response.data.filter(def => match(c.filter, def))
    });

    return result
}

function match(query, definition) {
    // simple matching for now
    return definition.name.includes(query) || definition.description?.includes(query)
}

module.exports = {
    getFilteredDefinitions: getFilteredDefinitions
}
