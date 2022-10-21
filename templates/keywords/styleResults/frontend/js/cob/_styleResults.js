cob.custom.customize.push(function (core, utils, ui) {
    const toES = (name) => name.toLowerCase().replace(/ /g, '_')

    core.customizeColumn("*","*",function(node, esDoc, fieldInfo){
        // Check $styleResultColumn
        const matchColumnRegex = /\$styleResultColumn\((.*)\)/
        let styleColField = matchColumnRegex.exec(fieldInfo.fieldDefDescription)
        if(styleColField) {
            const fieldValue = esDoc[toES(fieldInfo.name)] && esDoc[toES(fieldInfo.name)][0];
            const relevantMapping = styleColField[1].split(",")
    
            for(let mapping of relevantMapping) {
                let [styleValue, styleClass] = mapping.split(":")
                if(styleValue.trim() == fieldValue) node.classList.add(styleClass.trim())
            }
        }
    }),
    
    core.customizeAllColumns("*",function(node, esDoc, fieldInfo){
        // Finds $styleResultRows -> ATTENTION: only first occurrence, subsequent $styleResultRows will be ignore
        // TODO: remove dependency of $styleResultsRow HAVING TO HAVE ALSO $instanceDescription
        const matchRowsRegex = /\$styleResultRows\((.*)\)/
        let firstStyleResultsField = esDoc._definitionInfo.instanceDescription.find( field => matchRowsRegex.exec(field.description))
        if(firstStyleResultsField) {
            const fieldValue = esDoc[toES(firstStyleResultsField.name)] && esDoc[toES(firstStyleResultsField.name)][0];
            const relevantMapping = matchRowsRegex.exec(firstStyleResultsField.description)[1].split(",")
    
            for(let mapping of relevantMapping) {
                let [styleValue, styleClass] = mapping.split(":")
                if(styleValue.trim() == fieldValue) node.classList.add(styleClass.trim())
            }
        }
    })
})