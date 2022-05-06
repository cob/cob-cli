import * as dashFunctions from '@cob/dashboard-info';
dashFunctions["link"] = (url, icon) => {    return { value: icon, href: url, state: undefined, isLink: true } }

const clone = (obj) => JSON.parse(JSON.stringify(obj))

function collect(bucket, source) {
    const sourceName = source.fieldDefinition.name
    const children = source.fields
    const bucketKeys = Object.keys(bucket);
    if (bucketKeys.indexOf(sourceName) >= 0) {
        //Means that found one key in current source
        if (Array.isArray(bucket[sourceName])) {
            // Means type of value to collect is array
            if( bucket[sourceName].length == 0  || bucket[sourceName][0]["Mark"] == "JUST COPY" ) {
                //Means the bucket template only specify to get the raw elements that match (empty array in bucket template or having first element signaled that it was originally an empty array)
                source["Mark"] = "JUST COPY"       // Signal it was an empty array
                source[sourceName] = source.value  // Add extra field with original name of the source
                bucket[sourceName].push(source)    // Add to bucket collector
            } else {
                //Means the bucket specifies a template for the array elements
                let initialBucketCopy
                if( typeof bucket[sourceName][0].Initial_Template == "undefined") {
                    //Means it's the initial bucket (because it doesn't have the Initial_Template field copy)
                    initialBucketCopy = clone(bucket[sourceName][0])                  // Clone the bucket template
                    initialBucketCopy.Initial_Template = clone(initialBucketCopy)     // Save a copy of the bucket template as template for additional items 
                    bucket[sourceName].shift()                                        // remove original empty bucket template from collection
                } else {
                    // Means it's additional source matches
                    initialBucketCopy = clone(bucket[sourceName][0].Initial_Template) // we use a copy of the previously copied template
                } 
                children.reduce(collect,initialBucketCopy)    // collect values from the children
                initialBucketCopy[sourceName] = source.value  // Add extra field with original name of the source
                bucket[sourceName].push(initialBucketCopy)    // Add to bucket collector
            }
        } else {
            // Means it's not an array and we can collect the final value
            bucket[sourceName] = source.value; 
        }
    } else if (children.length > 0) {
        // Means it didn't find a match. Continue looking in the children
        for (source of children) {
            source.fields.reduce(collect, bucket);
        }
    }
    return bucket;
}

function parseDashboard(raw_dashboard){
    let dash = {
        "Page Title": "",
        "Grid Columns": "",
        "Max Width": "",
        "Board Title": [{
            "Col Span": "",
            "Row Span": "",
            "Component": []
        }],
    };

    raw_dashboard.fields.reduce(collect, dash);

    const ComponentsTemplates = {
        "Title": {
            "Title": ""
        },
        "Totals" : {
            "Header": [{
                "Text": [{}],
                "Style Header": ""
            }],
            "Line": [{
                "Style Line": "",
                "Value": [{
                    "Style Value": "",
                    "Arg": [{}]
                }]
            }]
        },
        "Menu": {
            "Text": [{
                "Link": "",
                "Style Text": ""
            }]
        }
    }
    
    for( let board of dash["Board Title"]) {
        let componentsList = clone([])
        for( let component of board["Component"]) {
            let componentTemplate = clone(ComponentsTemplates[component["Component"]])
            component.fields.reduce(collect,componentTemplate)
            componentTemplate["Component"] = component.Component
            componentsList.push(componentTemplate)
        }
        board["Component"] = componentsList
    }

    // remove all Initial_Templates added
    dash = JSON.parse(JSON.stringify(dash, (k,v) => (k === 'Initial_Template')? undefined : v))

    // replace values in Totals by dashboard-info
    dash["Board Title"].forEach(b => b.Component.forEach(c => {
        if (c.Component == "Totals") {
            c.Line.forEach(l => {
                l.Value = l.Value.map(v => {
                    if(v.Arg[2] && v.Arg[2].startsWith("{")) {
                        v.Arg[2] = JSON.parse(v.Arg[2])
                    }
                    return ({
                        dash_info: dashFunctions[v.Value].apply(this, v['Arg'].map( a => a['Arg'])), // Return DashInfo, which is used by the component
                        style: v["Style Value"]
                    })
                })
            })
        }
    }))
    return dash

}

export { parseDashboard, clone, collect }