const DEFINITION = "__DEFINITION__";

cob.custom.customize.push(function (core, utils, ui) {
    core.customizeAllColumns(DEFINITION, (node, esDoc, colDef) => {
        // Test $style[currency], by it self or with other styles 
        if(/\$style\[([^,]+,)*currency(,[^,]+)*\]/.exec(colDef.fieldDefDescription) != null) {
            let value = esDoc[colDef.field] ? esDoc[colDef.field][0] : null
            if(value) {
                node.classList.add((value[0] === "-") ? "currency_negative" : "currency_positive")
            }
        }
    })
})