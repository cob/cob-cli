import groovy.transform.Field
import org.codehaus.jettison.json.JSONObject

import java.math.RoundingMode;

import com.google.common.cache.*
import java.util.concurrent.TimeUnit

// ========================================================================================================
if (msg.product != "recordm-definition" && msg.product != "recordm" ) return

@Field static cacheOfCalcFieldsForDefinition = CacheBuilder.newBuilder()
        .expireAfterWrite(5, TimeUnit.MINUTES)
        .build();

if (msg.product == "recordm-definition") cacheOfCalcFieldsForDefinition.invalidate(msg.type)

// ========================================================================================================
def calculationFields = cacheOfCalcFieldsForDefinition.get(msg.type, { getAllCalculationFields(msg.type) })
if (calculationFields.size() > 0
	&& msg.product == "recordm"
	&& msg.user != "integrationm"
	&& msg.action =~ "add|update" ){

	def updates = executeCalculations(calculationFields, msg.instance.fields)
    def result = actionPacks.recordm.update(messageMap.type, "recordmInstanceId:" + messageMap.instance.id, updates);
	if(updates) log.info("[\$calc] UPDATE '${msg.type}' id:${msg.instance.id}, updates: ${updates}, result:${result.getStatus()} | ${result.getStatusInfo()} ");
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
def executeCalculations(calculationFields,instanceFields) {
	def updates = [:]
	def atLeastOneChangeFlag = false;
	def passCount = 0;
	def temporaryResults = [:]
	while(passCount++ == 0 || atLeastOneChangeFlag && passCount < 10) { //10 is just for security against loops
		atLeastOneChangeFlag = false
		calculationFields.each { calculation ->
			def novoResultado = evaluateExpression(calculation,instanceFields,temporaryResults)
			if(temporaryResults[calculation.fieldId] != novoResultado ) {
				// log.info("[\$calc] {{passCount:${passCount}, field:${calculation.name} (${calculation.fieldId})" + 
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
	// log.info("[\$calc] find '$varName'($varFieldIds) in $instanceFields (temporaryResults=$temporaryResults) ");
	def relevantFields = instanceFields.findAll{ instField -> varFieldIds.indexOf(instField.fieldDefinition.id) >= 0 }
	
	def result = varFieldIds.collect { varFieldId ->
		if(temporaryResults[varFieldId] != null) { 
			return temporaryResults[varFieldId]
		} else {
			return  temporaryResults[varFieldId] = instanceFields.findAll{ instField -> varFieldId == instField.fieldDefinition.id }?.collect { it.value }
		}
	}
	// log.info("[\$calc] values for '$varName'($varFieldIds) = $result (temporaryResults=$temporaryResults) " );
	return result.flatten()
}

// ========================================================================================================
def getAllCalculationFields(definitionName) {
	log.info("[\$calc] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>")

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
	def calculationFields = [];
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
			calculationFields << [fieldId: fieldId, name:field.name, op : op, args : argsFields]
		}
		previousId = fieldId
	}
	log.info("[\$calc] Update 'calculationFields' for '$definitionName': $calculationFields");	
	log.info("[\$calc] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>")
	return calculationFields
}