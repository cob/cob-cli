
import static utils.CobUtils.*;
import groovy.json.JsonOutput

return JsonOutput.prettyPrint(JsonOutput.toJson( getVuePressSidebarRootElements() ))

/********************************************************************************************/

def getVuePressSidebarRootElements() {
    def sidebarRootElements = [];

    def contents = registosPaginadosAsMap(66, "format.raw:Book", actionPacks.get("rmRest"), "sortablefield", true)
    contents.each { content ->
        sidebarRootElements.push(content["path"][0])
    }
    return sidebarRootElements
}