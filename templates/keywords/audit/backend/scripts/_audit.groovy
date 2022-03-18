import groovy.transform.Field
import org.codehaus.jettison.json.JSONObject

import com.google.common.cache.*
import java.util.concurrent.TimeUnit

// ========================================================================================================
@Field static cacheOfAuditFieldsForDefinition = CacheBuilder.newBuilder()
        .expireAfterWrite(5, TimeUnit.MINUTES)
        .build();

if (msg.product == "recordm-definition") cacheOfAuditFieldsForDefinition.invalidate(msg.type)
def auditFields = cacheOfAuditFieldsForDefinition.get(msg.type, { getAuditFields(msg.type) })

// ========================================================================================================

if (auditFields.size() > 0
	&& msg.product == "recordm"
	&& msg.user != "integrationm"
	&& msg.action =~ "add|update" ) {

	def updates = updateUser(auditFields,msg.instance.fields)
    def result = actionPacks.recordm.update(msg.type, "recordmInstanceId:" + msg.instance.id, updates);
	/**/log.info("[\$audit] ACTUALIZADA '${msg.type}' {{id:${msg.instance.id}, result:${result}, updates: ${updates}}}");
}

// ========================================================================================================
def updateUser(auditFields,instanceFields) {
	def userm = actionPacks.get("userm");
	def updates = [:]
	auditFields.each { auditField ->
		if( auditField.op == "creator" && msg.action == "update" && msg.value(auditField.name) != null) return
		if( auditField.args == "usermRef") {
			updates << [(auditField.name) : userm.getUser(msg.user).data._links.self]

		} else if( auditField.args == "username") {
			updates << [(auditField.name) : msg.user]
			
		} else if( auditField.args == "time") {
			if(msg.action == 'add' && Math.abs(msg.value(auditField.name, Long.class)?:0 - msg._timestamp_) < 30000) return // Ignore changes less then 30s
			if(msg.action == 'update' && !msg.diff) return // Only continues if there is at least one change
			updates << [(auditField.name) : "" + msg._timestamp_]
		}
	}
	return updates
}

// ========================================================================================================
def getAuditFields(definitionName) {
	/**/log.info("[\$audit] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>")
	/**/log.info("[\$audit] Update auditFields for $definitionName ... ");

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
		def matcher = field.description =~ /[$]audit\.(creator|updater)\.(username|usermRef|time)/
		if(matcher) {
			def op = matcher[0][1]
			def arg = matcher[0][2]
			auditFields << [fieldId: fieldId, name:field.name, op : op, args: arg]
		}
	}
	log.info("[\$audit] fields for '$definitionName': $auditFields");
	/**/log.info("[\$audit] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>")
	return auditFields
}