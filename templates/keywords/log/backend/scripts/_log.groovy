import groovy.transform.Field
import org.codehaus.jettison.json.JSONObject

import com.google.common.cache.*
import java.util.concurrent.TimeUnit

// ========================================================================================================
if (msg.product != "recordm-definition" && msg.product != "recordm" ) return

@Field static cacheOfLogFieldsForDefinition = CacheBuilder.newBuilder()
        .expireAfterWrite(5, TimeUnit.MINUTES)
        .build();

if (msg.product == "recordm-definition") cacheOfLogFieldsForDefinition.invalidate(msg.type)

// ========================================================================================================
def logFields = cacheOfLogFieldsForDefinition.get(msg.type, { getLogFields(msg.type) })
if( logFields.size() > 0
	&& msg.product == "recordm"
	&& msg.user != "integrationm"
	&& msg.action =~ "add|update" 
) {
	def updates = getLogUpdates(logFields)
	def result = recordm.update(messageMap.type, "recordmInstanceId:" + messageMap.instance.id, updates);
    if (updates) log.info("[\$log] UPDATE '${msg.type}' id:${msg.instance.id}, updates: ${updates}, result:${result} ");
}

// ========================================================================================================

def getLogUpdates(logFields){
    def updates = [:]
    def currentUser = actionPacks.get("userm").getUser(msg.user).data.name;

	logFields.each { logField ->
		def commentLogs = msg.value(logField.name);
		def newComment = msg.value(logField.sourceField);
		def fieldMsg = getFieldMessage(logField.stateField);

		if( newComment != null || msg.field(logField.stateField).changed() ){
			def newLogEntry = "#### " + (new Date()).format('yyyy-MM-dd HH:mm:ss').toString() + " - " + currentUser;
			newLogEntry += " [$fieldMsg] "
			newLogEntry +="\n\n";
			newLogEntry += newComment != null ? newComment : "";
			newLogEntry +="\n\n";

			if(commentLogs!=null) {
				newLogEntry +=  "======================================================================\n";
			}
			updates << [(logField.name) : "" + newLogEntry + (commentLogs ?: "")];
			updates << [(logField.sourceField) :  ""];		
		}
	}
    return updates
}

def getFieldMessage(field){
	String newValue = msg.value(field) ?: "";
    if( msg.field(field).changed() ){
        String oldValue = msg.oldInstance.value(field) ?: "";
        return "$field: $oldValue -> $newValue";
    } else {
        return "$field:  $newValue";
    }
}

// ========================================================================================================
def getLogFields(definitionName) {
	log.info("[\$log] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>")

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
	def auditFields = [];
	fields.each { fieldId,field -> 
		def matcher = field.description.toString() =~ /[$]log\(([^(]+),\s*([^(]+)\)/
		if(matcher) {
			def sourceField = matcher[0][1]
			def stateField = matcher[0][2]
			auditFields << [name: field.name, sourceField : sourceField, stateField : stateField]
		}
	}
	log.info("[\$log] Update 'logFields' for '$definitionName': $auditFields");
	log.info("[\$log] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>")
	return auditFields
}