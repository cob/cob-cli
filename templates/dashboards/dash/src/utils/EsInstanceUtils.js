import {toEsFieldName} from "@cob/rest-api-wrapper/src/utils/ESHelper";

function getValue(esInstance, fieldDefinition) {
    let esFieldName = toEsFieldName(fieldDefinition.name);
    return (esInstance[`${esFieldName}_reference`] || esInstance[esFieldName])
}

export {getValue}