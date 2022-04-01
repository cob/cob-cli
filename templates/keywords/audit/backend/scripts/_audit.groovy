import groovy.transform.Field
import org.codehaus.jettison.json.JSONObject

import com.google.common.cache.*
import java.util.concurrent.TimeUnit

// ========================================================================================================
if (msg.product != "recordm-definition" && msg.product != "recordm" ) return

@Field static cacheOfAuditFieldsForDefinition = CacheBuilder.newBuilder()
        .expireAfterWrite(5, TimeUnit.MINUTES)
        .build();

if (msg.product == "recordm-definition") cacheOfAuditFieldsForDefinition.invalidate(msg.type)

// ========================================================================================================
def auditFields = cacheOfAuditFieldsForDefinition.get(msg.type, { getAuditFields(msg.type) })
if (auditFields.size() > 0
	&& msg.product == "recordm"
	&& msg.user != "integrationm"
	&& msg.action =~ "add|update" ) {

	def updates = getAuditFieldsUpdates(auditFields,msg.instance.fields)
    def result = actionPacks.recordm.update(msg.type, "recordmInstanceId:" + msg.instance.id, updates);
	if(updates) log.info("[\$audit] UPDATE '${msg.type}' id:${msg.instance.id}, updates: ${updates}, result:${result.getStatus()} | ${result.getStatusInfo()} ");
}

// ========================================================================================================
def getAuditFieldsUpdates(auditFields,instanceFields) {
	def updates = [:]
	auditFields.each { auditField ->
		if( auditField.op == "creator" && msg.action == "update" && msg.value(auditField.name) != null) return // 'creator' fields are only changed in 'update' if the previous value was empty (meaning it was a field that was not visible)
		if( msg.action == 'update' && !msg.diff) return // Only continues if there is at least one change
		if( auditField.args == "uri") {
			updates << [(auditField.name) : actionPacks.get("userm").getUser(msg.user).data._links.self]

		} else if( auditField.args == "username") {
			updates << [(auditField.name) : msg.user]
			
		} else if( auditField.args == "time") {
			if(msg.action == 'add' && Math.abs(msg.value(auditField.name, Long.class)?:0 - msg._timestamp_) < 30000) return // Ignore changes less then 30s
			updates << [(auditField.name) : "" + msg._timestamp_]
		}
	}
	return updates
}

// ========================================================================================================
def getAuditFields(definitionName) {
	log.info("[\$audit] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>")

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
		def matcher = field.description.toString() =~ /[$]audit\.(creator|updater)\.(username|uri|time)/
		if(matcher) {
			def op = matcher[0][1]
			def arg = matcher[0][2]
			auditFields << [fieldId: fieldId, name:field.name, op : op, args: arg]
		}
	}
	log.info("[\$audit] Update 'auditFields' for '$definitionName': $auditFields");
	log.info("[\$audit] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>")
	return auditFields
}