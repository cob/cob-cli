const axios = require('axios')
const CONF = require('../config.json')

async function replaceQueries(yamlReferences,preferedLangPostfix) {
  let References = [];

  for( yamlCard of yamlReferences ) {
    //TODO: add try/catch and allow diferent positions/omition on spec of intro+items
    let cardTitle = Object.keys(yamlCard)[0]; // Assumption: $frontmatter.References is an arrays of cards where the KEY is the TITLE of the card
    let cardContent = Object.values(yamlCard)[0];
    
    let cardKeys = cardContent.map( i => Object.keys(i)[0])
    let introIndex = cardKeys.indexOf('intro')
    let cardIntro = introIndex >= 0 ? cardContent[introIndex].intro : []; 
    let itemsIndex = cardKeys.indexOf('items')
    let cardItems = itemsIndex >= 0 ? cardContent[itemsIndex].items : []; 
    let numberingIndex = cardKeys.indexOf('numbering')
    let cardNumbering = numberingIndex >= 0 ? cardContent[numberingIndex].numbering : false; 
    
    let cardQueries = [];
    let card = {
      title: cardTitle,
      numbering: cardNumbering,
      intro: cardIntro.reduce((obj, introItem) => Object.assign(obj, { [Object.keys(introItem)[0]]: Object.values(introItem)[0] }), {}), // convert array of only one itm with object into object with the key:value for each object
      items: cardItems.map(async (yamlItem) => {
        // each item is a object with key = title and value = path
        let title = Object.keys(yamlItem)[0];
        let path = Object.values(yamlItem)[0]
        if(title !== "query") {
          return { title: title, path: path }
        } else {
          // if key == 'query' then we get the specified content  (specified in 'path')
          //Get all public children for this 'id' (since restricted content will not be visible to anonymous user)
          let definitions = await axios.get('https://' + CONF.server + '/recordm/recordm/definitions')
          let answer = await axios.get('https://' + CONF.server + '/recordm/recordm/definitions/search/' + CONF.contentDefinition + '?q=' + path ,{params: {sort:"sortablefield"}})
          
          let items = []
          for(let content of answer.data.hits.hits.reverse()) {
              let item = {}
              for(let langPostfix of [preferedLangPostfix,"","-pt","-es"] ) {
                if(item.title) continue; //Stop trying as soon as it has a 'title' 
                try {
                  item.id = content._id;
                  item.title = content._source["name" + langPostfix][0]
                  item.path = content._source["path"][0]
                  item.type = content._source["type"][0]
                  item.target = content._source["target"][0]
                  item.format = content._source["format"][0]
                } catch {}
              }
              items.push(item)
          }
          cardQueries.push({
            // query: !items.length ? path : path + " AND -id:(" + items.map(i => i.id).join(" OR ") + ")"
            query: path
          })
          return items
        }
      })
    }
    card.queries = cardQueries
    card.items = (await Promise.all(card.items)).flat()
    // card.items = card.items.flat() // to remove arrays with query responses
    References.push(card)
  };

  return References
}

module.exports = (options = {}) => ({
  async extendPageData ($page) {
    const {
      path,
      frontmatter,
      _strippedContent
    } = $page

    if (_strippedContent && _strippedContent.indexOf("<References") != -1){
      let langPostfix = path.indexOf("/pt/") == 0 ? "-pt" : path.indexOf("/es/") == 0 ? "-es" : ""
      let indexCardRegex = /(<References[^>]*>)+/g
      for(indexCard of _strippedContent.match(indexCardRegex)) {
        let listArgRegex = /list="([^"]+)"/g
        let match = listArgRegex.exec(indexCard)
        let listArg = (match && match[1]) ? match[1] : "References"  // default listArg is var 'References' of frontmatter
        try {
          $page[listArg] = await replaceQueries(frontmatter[listArg], langPostfix)
        } 
        catch(e) {
          console.error(">>" + indexCard + ">>>" + e)
          debugger;
        }
      }
    }
    return $page
  }
})