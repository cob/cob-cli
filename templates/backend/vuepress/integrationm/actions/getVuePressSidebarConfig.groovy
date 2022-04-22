import groovy.transform.Field;
import org.apache.commons.logging.*;

import static utils.CobUtils.*;
import groovy.json.JsonOutput


@Field log = LogFactory.getLog(getClass());
log.info("Building VuePress e-learning sidebar...")

def path = argsMap.path ;
def lang = (!argsMap.lang || argsMap.lang == "en") ? "" : argsMap.lang  ;
def sidebarConfig = getVuePressSidebarConfig(path, lang, true)
return JsonOutput.prettyPrint(JsonOutput.toJson( sidebarConfig ))


/********************************************************************************************/

def getVuePressSidebarConfig(path, lang, isRoot) {
    def sidebar = [];
    def pathField = isRoot ? "path.raw" : "parent_path.raw"; // no caso dos conteúdos de topo é necessário processar o próprio primeiro e depois os seus filhos
    def contents = registosPaginadosAsMap(66, pathField+":\""+path+"\"", actionPacks.get("rmRest"), "sortablefield", true)
        
    contents.each { content ->
        def node = [:]
        def nameSufixForLang = (lang && content["name-"+lang]) ? ("-"+lang) : content["name"] ? "" : content["name-pt"] ? "-pt" : "-es" ; // sufix shoud be the one specified in lang, unless it's content does not exist and, in that case, it will defaul to EN, then PT, then ES
        def pathForLang = (lang ? "/" + lang : "") + content["path"][0]
        def titleForLang = content["name"+nameSufixForLang][0]

        def children = getVuePressSidebarConfig(content["path"][0], lang, false)
        if(children.size == 0) {
            node = [ pathForLang, titleForLang ]
        } else {
            node["title"] = titleForLang
            node["path"] = pathForLang
            node["children"] = [ pathForLang, *children ] // o truque de ter um grupo com conteúdo está em adicionar o próprio como filho mas depois esconder no html e mostrar o link do grupo com estilo de conteúdo normal
            node["sidebarDepth"] = isRoot ? 1 : 0
        }
        sidebar.push(node)
    }
    return sidebar
}
