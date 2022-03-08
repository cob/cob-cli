import groovy.transform.Field
import org.codehaus.jettison.json.JSONObject

import java.math.RoundingMode;

@Field DEFINICOES  = [
		"Calc Test"
];

// ========================================================================================================
if (messageMap.product == "recordm"
		&& DEFINICOES.contains(messageMap.type)
		&& messageMap.action =~ "add|update"
		&& messageMap.user != "integrationm") {

	/**/log.info(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>")
	def calculations = getAllCalculationsFields(messageMap.instance.fields);

	/**/log.info("\$calc fields: ${calculations}");

	def updates = executeCalculations(calculations,messageMap.instance.fields)

	/**/log.info("Updates: ${updates}");

    def result = actionPacks.recordm.update(messageMap.type, "recordmInstanceId:" + messageMap.instance.id, updates);
	/**/log.info("ACTUALIZADA '${messageMap.type}' {{id:${messageMap.instance.id}, result:${result}, updates: ${updates}}}");
	/**/log.info(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>")
}

// ========================================================================================================
@Field static definitionsCalculationsCache = [:]
@Field static definitionsCalculationsCacheInvalidationTimer

def getAllCalculationsFieldsXPTO(instanceFields) {

	if(definitionsCalculationsCache[msg.type] == undefined) {
    	definitionsCalculationsCache[msg.type] = [
	}

    if(definitionsCalculationsCacheInvalidationTimer) {
        definitionsCalculationsCacheInvalidationTimer.cancel()
    }
    definitionsCalculationsCacheInvalidationTimer = new Timer()
    definitionsCalculationsCacheInvalidationTimer.runAfter(6000000) { // 1h of cache: touch this file to force cache update
		definitionsCalculationsCache.clear()
	}

// ========================================================================================================
def getAllCalculationsFields(instanceFields) {
	// Obtém detalhes da definição
	def definitionEncoded = URLEncoder.encode(messageMap.type, "utf-8").replace("+", "%20")
	def resp = actionPacks.rmRest.get( "recordm/definitions/name/${definitionEncoded}".toString(), [:], "");
	JSONObject definition = new JSONObject(resp);

	// Preenche nos dados da instância desta mensagem o campo descrição
	// (será necessário para a lista de campos a calcular e para obter os campos que sejam variáveis)
	def fieldsSize = definition.fieldDefinitions.length();
	def newInstanceFields = [];

	(0..fieldsSize-1).each { index ->
		def fieldDefinition  = definition.fieldDefinitions.getJSONObject(index)
		def fieldDescription = fieldDefinition.get("description")
		def fieldDefId       = fieldDefinition.get("id")
		def fieldName        = fieldDefinition.get("name");

		def dummyInstanceField = [
				parent         : null,
				fieldDefinition: [name: fieldName, id: fieldDefId, description: fieldDescription],
				value          : null
		];

		int idxExistingF = instanceFields.findIndexOf { it.fieldDefinition.id == fieldDefId }

		if(idxExistingF > -1) {
			instanceFields[idxExistingF].fieldDefinition.description = fieldDescription;
			newInstanceFields << instanceFields[idxExistingF]

		} else {
			newInstanceFields << dummyInstanceField;
		}
	}

	instanceFields.clear();
	instanceFields.addAll(newInstanceFields);

	// Finalmente obtém a lista de campos que é necessário calcular
	def calculations = [];
	instanceFields.each { field ->
		def fieldDescription = field.fieldDefinition.description;
		if(fieldDescription.toString() =~ /[$]calc\./) {
			def op = getCalculationOperation(fieldDescription)
			def args = getCalculationArgNames(fieldDescription)
			calculations << [field : field, op : op, args : args]
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

	while(passCount++ == 0 || atLeastOneChangeFlag) {
		atLeastOneChangeFlag = false
		calculations.each { calculation ->
			def novoResultado = evaluateExpression(calculation,instanceFields)
			if(calculation.field.value != novoResultado ) {
				log.info("[Calculations] {{passCount:${passCount}, field:${calculation.field.fieldDefinition.name}" +
						", calcType:${calculation.op}(${calculation.args})" +
						", fieldValue:${calculation.field.value}" +
						", calcValue:$novoResultado}}");

				calculation.field.value = novoResultado;
				updates << [(calculation.field.fieldDefinition.name) : novoResultado]
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
	def argNames = calculation.args
	def values = argNames.collect { argName ->
		(""+argName).isNumber()
			? argName * 1
			: getAllAplicableValuesForVarName(calculation.field,argName,instanceFields)
	}
	return values.flatten()
}

// ==================================================
def getAllAplicableValuesForVarName(field,varName,instanceFields) {
	def result

	if(varName == "parent") {
		def fieldIndex = 0
		while(instanceFields[fieldIndex].id != field.parent) { fieldIndex++ };
		result = instanceFields[fieldIndex].value
	} else if(varName == "previous") {
		def fieldIndex = 0
		while(instanceFields[fieldIndex].fieldDefinition.id != field.fieldDefinition.id) { fieldIndex++ };
		result = instanceFields[fieldIndex-1].value
	} else {
		def relevantFields = instanceFields.findAll{ instField -> instField.fieldDefinition.description.toString() =~ /.*[$]$varName.*/ }
		result = relevantFields.collect { it.value }
	}
	/**/log.info("[Calculations] values for '$varName' = $result");
	return result
}
