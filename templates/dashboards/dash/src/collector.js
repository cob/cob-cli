import * as dashFunctions from '@cob/dashboard-info';

const clone = (obj) => JSON.parse(JSON.stringify(obj))

function collect(bucket, source) {
    const sourceName = source.fieldDefinition.name
    const children = source.fields
    const bucketKeys = Object.keys(bucket);
    if (bucketKeys.indexOf(sourceName) >= 0) {
        //Means that found one key in current source
        if (Array.isArray(bucket[sourceName])) {
            // Means type of value to collect is array
            if (bucket[sourceName].length === 0 || bucket[sourceName][0]["Mark"] === "JUST COPY") {
                //Means the bucket template only specify to get the raw elements that match (empty array in bucket template or having first element signaled that it was originally an empty array)
                source["Mark"] = "JUST COPY"       // Signal it was an empty array
                source[sourceName] = source.value  // Add extra field with original name of the source
                bucket[sourceName].push(source)    // Add to bucket collector
            } else {
                //Means the bucket specifies a template for the array elements
                let initialBucketCopy
                if (typeof bucket[sourceName][0].Initial_Template == "undefined") {
                    //Means it's the initial bucket (because it doesn't have the Initial_Template field copy)
                    initialBucketCopy = clone(bucket[sourceName][0])                  // Clone the bucket template
                    initialBucketCopy.Initial_Template = clone(initialBucketCopy)     // Save a copy of the bucket template as template for additional items 
                    bucket[sourceName].shift()                                        // remove original empty bucket template from collection
                } else {
                    // Means it's additional source matches
                    initialBucketCopy = clone(bucket[sourceName][0].Initial_Template) // we use a copy of the previously copied template
                }
                initialBucketCopy.instanceId = bucket.instanceId  //needed to build $file url 
                children.reduce(collect, initialBucketCopy)    // collect values from the children
                initialBucketCopy[sourceName] = source.value  // Add extra field with original name of the source
                bucket[sourceName].push(initialBucketCopy)    // Add to bucket collector
            }
        } else {
            // Means it's not an array and we can collect the final value
            if (source.value && source.fieldDefinition.description && source.fieldDefinition.description.indexOf("$file") >= 0) {
                bucket[sourceName] = "/recordm/recordm/instances/" + bucket.instanceId + "/files/" + source.fieldDefinition.id + "/" + source.value
            } else {
                bucket[sourceName] = source.value;
            }
        }
    } else if (children.length > 0) {
        // Means it didn't find a match. Continue looking in the children
        for (source of children) {
            source.fields.reduce(collect, bucket);
        }
    }
    return bucket;
}

function parseDashboard(raw_dashboard, userInfo) {
    let dash = {
        "Name": "",
        "DashboardCustomize": [{
            "Grid": "",
            "Width": "",
            "DashboardClasses": "",
            "Image": "",
            "GroupAccess": [{}]
        }],
        "Board": [{
            "BoardCustomize": [{
                "BoardClasses": "",
                "Image": ""
            }],
            "Component": []
        }],
    };

    dash.instanceId = "" + raw_dashboard.id //needed to build $file url
    raw_dashboard.fields.reduce(collect, dash);

    const ComponentsTemplates = {
        "Label": {
            "LabelCustomize": [{
                "LabelClasses": "",
                "Image": ""
            }],
            "Label": "",
        },
        "Menu": {
            "MenuCustomize": [{
                "MenuClasses": ""
            }],
            "Text": [{
                "Link": "",
                "TextCustomize": [{
                    "TextClasses": "",
                    "Icon": "",
                    "TextAttention": "",
                    "GroupVisibility": [{}]
                }],
            }],
        },
        "Totals": {
            "TotalsCustomize": [{
                "TotalsClasses": "",
                "InputVarTotals": [{}],
            }],
            "Line": [{
                "LineCustomize": [{
                    "LineClasses": "",
                    "TitleClasses": "",
                }],
                "Value": [{
                    "ValueCustomize": [{
                        "ValueClasses": "",
                        "View": "",
                        "ValueAttention": "",
                        "AttentionClasses": "",
                        "Unit": "",
                    }],
                    "Style Value": "",
                    "Arg": [{}]
                }]
            }],
        },
        "Kibana": {
            "KibanaCustomize": [{
                "KibanaClasses": "",
                "OutputVarKibana": "",
                "InputVarKibana": [{}],
                "InputQueryKibana": ""
            }],
            "ShareLink": "",
        },
        "Filter": {
            "FilterCustomize": [{
                "FilterClasses": "",
                "Placeholder": ""
            }],
            "OutputVarFilter": "",
        },
        "Calendar": {
            "CalendarCustomize": [{
                "CalendarClasses": "",
                "InputVarCalendar": [{}],
                "OutputVarCalendar": "",
                "MaxVisibleDayEvents": "",
                "AllowCreateInstances":""
            }],
            "Definition": "",
            "DateStartEventField": "",
            "DateEndEventField": "",
            "DescriptionEventField": "",
            "StateEventField": "",
            "EventsQuery": "",
        }
    }

    for( let board of dash["Board"]) {
        let componentsList = clone([])
        for( let component of board["Component"]) {
            if(component["Component"] == null) continue
            let componentTemplate = clone(ComponentsTemplates[component["Component"]])
            componentTemplate.instanceId = "" + raw_dashboard.id //needed to $build file url
            component.fields.reduce(collect, componentTemplate)
            componentTemplate["Component"] = component.Component
            componentsList.push(componentTemplate)
        }
        board["Component"] = componentsList
    }


    // remove all 'Initial_Templates' and 'instanceId' added for processing
    dash = JSON.parse(JSON.stringify(dash, (k, v) => (k === 'Initial_Template' || k === 'instanceId') ? undefined : v))
    dash.vars = {} //Available to every components in component.vars

    // Add extra info to structure
    dash["Board"].forEach(b => b.Component.forEach(c => {
        // Add user info for permission evaluations
        c.userInfo = userInfo
        c.vars = dash.vars

        if (c.Component === "Menu") {
            c.Text.forEach(t => {
                // If Attention is configured for this menu line then add attention status as user check
                if (t["TextCustomize"][0]["TextAttention"]) {
                    t["TextCustomize"][0].AttentionInfo = dashFunctions.instancesList("Dashboard-Attention", "name.raw:" + t["TextCustomize"][0]["TextAttention"], 1, 0, {validity: 30})
                }
            })
        } else if (c.Component === "Totals") {
            c.Line.forEach(l => {
                l.Value = l.Value.map(v => {
                    if (v.Arg[2] && (v.Arg[2] + "").startsWith("{")) {
                        v.Arg[2] = JSON.parse(v.Arg[2])
                    }
                    // If Attention is configured for this value line then add attention status as user check
                    if (v["ValueCustomize"][0]["ValueAttention"]) {
                        v["ValueCustomize"][0].AttentionInfo = dashFunctions.instancesList("Dashboard-Attention", "name.raw:" + v["ValueCustomize"][0]["ValueAttention"], 1, 0, {validity: 10})
                    }

                    if (v.Value === 'Label') {
                        v.dash_info = {value: v.Arg[0].Arg, state: "ready"}
                    } else if (v.Value === 'link') {
                        v.dash_info = {value: icon, href: url, state: undefined, isLink: true}
                    } else {
                        // add dash-info values in Totals
                        v.dash_info = dashFunctions[v.Value].apply(this, v['Arg'].map( a =>
                            a['Arg'].replaceAll("__USERNAME__",c.userInfo.username)
                        )) // Return DashInfo, which is used by the component
                    }
                    return v
                })
            })
        } else if (c.Component === "Kibana") {
            if (c["KibanaCustomize"][0]["InputQueryKibana"] !== null) {
                c["KibanaCustomize"][0]["InputQueryKibana"] = c["KibanaCustomize"][0]["InputQueryKibana"].replaceAll("__USERNAME__", c.userInfo.username)
            }
        }
    }))
    return dash
}

export {parseDashboard, clone, collect}
