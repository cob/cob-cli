import groovy.transform.Field
import org.codehaus.jettison.json.JSONObject

// ========================================================================================================
if (msg.product == "recordm"
	&& msg.user != "integrationm"
	&& msg.action =~ "add|update"
	&& (definitionsUserCache[msg.type] == null || definitionsUserCache[msg.type].size()) ){

	//log.info("[User] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>")
	def userFields = getAllUserFields(messageMap.type);
	def updates = updateUser(userFields,msg.instance.fields)
    def result = actionPacks.recordm.update(messageMap.type, "recordmInstanceId:" + messageMap.instance.id, updates);
	//log.info("[User] ACTUALIZADA '${messageMap.type}' {{id:${messageMap.instance.id}, result:${result}, updates: ${updates}}}");
	//log.info("[User] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>")
}

// ========================================================================================================
@Field static definitionsUserCache = [:]
@Field static definitionsUserCacheInvalidationTimer = [:]

def getAllUserFields(definitionName) {
	if(!definitionsUserCache.containsKey(definitionName)) {
    	definitionsUserCache[definitionName] = getAllCurrentUserFields(definitionName)
		log.info("[User] \$user fields for '$definitionName': ${definitionsUserCache[definitionName]}");	
	}

    if(definitionsUserCacheInvalidationTimer.containsKey(definitionName)) {
        definitionsUserCacheInvalidationTimer[definitionName].cancel()
    }
    definitionsUserCacheInvalidationTimer[definitionName] = new Timer()
    definitionsUserCacheInvalidationTimer[definitionName].runAfter(600000) { // 5m of cache: touch this file to force cache update
		definitionsUserCache.clear()
		log.info("[User] cleared definition '$definitionName' cache for '\$user' fields");	
	}

	return definitionsUserCache[definitionName]
}

// ========================================================================================================
def getAllCurrentUserFields(definitionName) {
	//log.info("\$user update userFields... ");

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
	def userFields = [];
	fields.each { fieldId,field -> 
		def matcher = field.description =~ /[$]user\.(creator|updater)\((username|usermRef)\)/
		if(matcher) {
			def op = matcher[0][1]
			def arg = matcher[0][2]
			userFields << [fieldId: fieldId, name:field.name, op : op, args: arg]
		}
	}
	return userFields
}

// ========================================================================================================
def updateUser(userFields,instanceFields) {
	def userm = actionPacks.get("userm");
	def updates = [:]
	userFields.each { userField ->
		if( userField.op == "creator" && msg.action == "update") return
		if( userField.args == "usermRef") {
			updates << [(userField.name) : userm.getUser(msg.user).data._links.self]
		} else {
			updates << [(userField.name) : msg.user]
		}
	}
	return updates
}