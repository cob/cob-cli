import groovy.transform.Field
import org.codehaus.jettison.json.JSONObject

import java.math.RoundingMode;

// ========================================================================================================
if (msg.product == "recordm"
	&& msg.user != "integrationm"
	&& msg.action =~ "add|update"
	&& (definitionsCalculationsCache[msg.type] == null || definitionsCalculationsCache[msg.type].size()) ){

	//log.info("[Calculations] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>")
	def calculations = getAllCalculationsFields(messageMap.type);
	def updates = executeCalculations(calculations,msg.instance.fields)
    def result = actionPacks.recordm.update(messageMap.type, "recordmInstanceId:" + messageMap.instance.id, updates);
	//log.info("[Calculations] ACTUALIZADA '${messageMap.type}' {{id:${messageMap.instance.id}, result:${result}, updates: ${updates}}}");
	//log.info("[Calculations] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>")
}

// ========================================================================================================
@Field static definitionsCalculationsCache = [:]
@Field static definitionsCalculationsCacheInvalidationTimer

def getAllCalculationsFields(definitionName) {
	if(!definitionsCalculationsCache.containsKey(msg.type)) {
    	definitionsCalculationsCache[definitionName] = getAllCurrentCalculationsFields(definitionName)
		log.info("[Calculations] \$calc fields for '${definitionName}': ${definitionsCalculationsCache[definitionName]}");	
	}

    if(definitionsCalculationsCacheInvalidationTimer) {
        definitionsCalculationsCacheInvalidationTimer.cancel()
    }
    definitionsCalculationsCacheInvalidationTimer = new Timer()
    definitionsCalculationsCacheInvalidationTimer.runAfter(600000) { // 5m of cache: touch this file to force cache update
		definitionsCalculationsCache.clear()
		log.info("[Calculations] cleared cache");	
	}

	return definitionsCalculationsCache[definitionName]
}

// ========================================================================================================
def getAllCurrentCalculationsFields(definitionName) {
	//log.info("\$calc update calculations... ");

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
	def previousId
	fields.each { fieldId,field ->
		if(field.description.toString() =~ /[$]calc\./) {
			def op = getCalculationOperation(field.description)
			def args = getCalculationArgNames(field.description)
			argsFields = [:]
			args.each { arg ->
				if(arg == "previous") {
					argsFields[arg] = [previousId]
				} else {
					argsFields[arg] = fields.findAll{fId,f -> f.description?.toString() =~ /.*[$]$arg.*/ }.collect { fId,f -> fId}
				}
			}
			calculations << [fieldId: fieldId, name:field.name, op : op, args : argsFields]
		}
		previousId = fieldId
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
	def temporaryResults = [:]
	while(passCount++ == 0 || atLeastOneChangeFlag && passCount < 10) { //10 is just for security against loops
		atLeastOneChangeFlag = false
		calculations.each { calculation ->
			def novoResultado = evaluateExpression(calculation,instanceFields,temporaryResults)
			if(temporaryResults[calculation.fieldId] != novoResultado ) {
				// log.info("[Calculations] {{passCount:${passCount}, field:${calculation.name} (${calculation.fieldId})" + 
				// 		", calcType:${calculation.op}(${calculation.args})" +
				// 		", previousResult:${temporaryResults[calculation.fieldId]}" +
				// 		", calcValue:$novoResultado}}");

				temporaryResults[calculation.fieldId] = novoResultado;
				updates << [(calculation.name) : novoResultado]
				atLeastOneChangeFlag = true
			}
		}
	}
	return updates
}

// ==================================================
def evaluateExpression(calculation,instanceFields,temporaryResults) {
	// Realizar operação
	def resultado = new BigDecimal(0)
	def args = getCalculationArguments(calculation,instanceFields,temporaryResults)

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
def getCalculationArguments(calculation,instanceFields,temporaryResults) {
	def values = calculation.args.collect { argName,argFieldIds ->
		(""+argName).isNumber()
			? argName * 1
			: getAllAplicableValuesForVarName(calculation.fieldId,argName,argFieldIds,instanceFields,temporaryResults)
	}
	return values.flatten()
}

// ==================================================
def getAllAplicableValuesForVarName(fieldId,varName,varFieldIds,instanceFields,temporaryResults) {
	// log.info("[Calculations] find '$varName'($varFieldIds) in $instanceFields (temporaryResults=$temporaryResults) ");
	def relevantFields = instanceFields.findAll{ instField -> varFieldIds.indexOf(instField.fieldDefinition.id) >= 0 }
	
	def result = varFieldIds.collect { varFieldId ->
		if(temporaryResults[varFieldId] != null) { 
			return temporaryResults[varFieldId]
		} else {
			return  temporaryResults[varFieldId] = instanceFields.findAll{ instField -> varFieldId == instField.fieldDefinition.id }?.collect { it.value }
		}
	}
	// log.info("[Calculations] values for '$varName'($varFieldIds) = $result (temporaryResults=$temporaryResults) " );
	return result.flatten()
}