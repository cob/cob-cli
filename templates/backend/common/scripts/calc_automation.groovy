import groovy.transform.Field
import org.codehaus.jettison.json.JSONObject

import java.math.RoundingMode;

// ========================================================================================================
if (msg.product == "recordm"
		&& msg.user != "integrationm"
		&& msg.action =~ "add|update"
		&& (definitionsCalculationsCache[msg.type] == null || definitionsCalculationsCache[msg.type].size()) ){

	//log.info(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>")
	def calculations = getAllCalculationsFields(messageMap.type);

	//log.info("\$calc fields: ${calculations}");
	
	def updates = executeCalculations(calculations,msg.instance.fields)

	log.info("\$calc Updates: ${updates}");

    def result = actionPacks.recordm.update(messageMap.type, "recordmInstanceId:" + messageMap.instance.id, updates);
	//log.info("ACTUALIZADA '${messageMap.type}' {{id:${messageMap.instance.id}, result:${result}, updates: ${updates}}}");
	//log.info(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>")
}

// ========================================================================================================
@Field static definitionsCalculationsCache = [:]
@Field static definitionsCalculationsCacheInvalidationTimer

def getAllCalculationsFields(definitionName) {

	if(!definitionsCalculationsCache.containsKey(msg.type)) {
    	definitionsCalculationsCache[definitionName] = getAllCurrentCalculationsFields(definitionName)
	}

    if(definitionsCalculationsCacheInvalidationTimer) {
        definitionsCalculationsCacheInvalidationTimer.cancel()
    }
    definitionsCalculationsCacheInvalidationTimer = new Timer()
    definitionsCalculationsCacheInvalidationTimer.runAfter(6000000) { // 1h of cache: touch this file to force cache update
		definitionsCalculationsCache.clear()
	}
	return definitionsCalculationsCache[definitionName]
}

// ========================================================================================================
def getAllCurrentCalculationsFields(definitionName) {
	//log.info("\$calc update calculations... 2");

	// Obtém detalhes da definição
	def definitionEncoded = URLEncoder.encode(definitionName, "utf-8").replace("+", "%20")
	def resp = actionPacks.rmRest.get( "recordm/definitions/name/${definitionEncoded}".toString(), [:], "");
	JSONObject definition = new JSONObject(resp);

	def fieldsSize = definition.fieldDefinitions.length();

	def fields = [:]
	(0..fieldsSize-1).each { index ->
		def fieldDefinition  = definition.fieldDefinitions.getJSONObject(index)
		def fieldDescription = fieldDefinition.get("description")
		def fieldDefId       = fieldDefinition.get("id")
		def fieldName        = fieldDefinition.get("name");
		fields[fieldDefId]   = [name:fieldName, description: fieldDescription]
	}

	// Finalmente obtém a lista de campos que é necessário calcular
	def calculations = [];
	fields.each { fieldId,field ->
		if(field.description.toString() =~ /[$]calc\./) {
			def op = getCalculationOperation(field.description)
			def args = getCalculationArgNames(field.description)
			argsFields = [:]
			args.each { arg ->
				argsFields[arg] = fields.findAll{fId,f -> f.description?.toString() =~ /.*[$]$arg.*/ }.collect { fId,f -> fId}
			}
			calculations << [fieldId: fieldId, name:field.name, op : op, args : argsFields]
		}
	}
	
	return calculations
}

// ==================================================
def getCalculationOperation(fieldDescription) {
	def matcher = fieldDescription =~/.*[$]calc.([^(]+)/
	def op = matcher[0][1]
	return op
}

// ==================================================
def getCalculationArgNames(fieldDescription) {
	def matcher = fieldDescription =~/.*[$]calc.[^(]+\(([^(]+)\)/
	def argNamesArray = matcher[0][1].tokenize(",")
	return argNamesArray;
}

// ========================================================================================================
def executeCalculations(calculations,instanceFields) {
	def updates = [:]
	def atLeastOneChangeFlag = false;
	def passCount = 0;

	def results = [:]
	while(passCount++ == 0 || atLeastOneChangeFlag) {
		atLeastOneChangeFlag = false
		calculations.each { calculation ->
			def novoResultado = evaluateExpression(calculation,instanceFields)
			if(results[calculation.fieldId] != novoResultado ) {
				log.info("[Calculations] {{passCount:${passCount}, field:${calculation.name}" +
						", calcType:${calculation.op}(${calculation.args})" +
						", fieldValue:${results[calculation.fieldId]}" +
						", calcValue:$novoResultado}}");

				results[calculation.fieldId] = novoResultado;
				updates << [(calculation.name) : novoResultado]
				atLeastOneChangeFlag = true
			}
		}
	}
	return updates
}

// ==================================================
def evaluateExpression(calculation,instanceFields) {
	// Realizar operação
	def resultado = new BigDecimal(0)
	def args = getCalculationArguments(calculation,instanceFields)

	if(calculation.op == "multiply" && args.size() > 0) {
		resultado = 1
		args.each { arg -> resultado = resultado.multiply(new BigDecimal(arg?.trim() ?: 0)) }

	} else if (calculation.op == "divide" && args.size() == 2 && (args[1]?:0 != 0)) {
		resultado = new BigDecimal(args[0]?.trim() ?:0);
		resultado = resultado.divide(new BigDecimal(args[1]?.trim()), 8, RoundingMode.HALF_UP)

	} else if(calculation.op == "sum") {
		args.each { arg -> resultado = resultado + new BigDecimal(arg?.trim() ?: 0)}

	} else if (calculation.op == "subtract" && args.size() == 2) {
		resultado = new BigDecimal(args[0]?.trim() ?: 0);
		resultado = resultado.subtract(new BigDecimal(args[1]?.trim() ?: 0))
	}
	return resultado.stripTrailingZeros().toPlainString()
}

// ==================================================
def getCalculationArguments(calculation,instanceFields) {
	def values = calculation.args.collect { argName,argFieldIds ->
		(""+argName).isNumber()
			? argName * 1
			: getAllAplicableValuesForVarName(calculation.fieldId,argName,argFieldIds,instanceFields)
	}
	return values.flatten()
}

// ==================================================
def getAllAplicableValuesForVarName(fieldId,varName,varFieldIds,instanceFields) {
	def result

	if(varName == "previous") {
		def fieldIndex = 0
		while(instanceFields[fieldIndex].fieldDefinition.id != fieldId) { fieldIndex++ };
		result = instanceFields[fieldIndex-1].value
	} else {
		//log.info("[Calculations] find '$varFieldIds' in $instanceFields");
		def relevantFields = instanceFields.findAll{ instField -> varFieldIds.indexOf(instField.fieldDefinition.id) >= 0 }
		result = relevantFields.collect { it.value }
	}
	//log.info("[Calculations] values for '$varName' = $result");
	return result
}