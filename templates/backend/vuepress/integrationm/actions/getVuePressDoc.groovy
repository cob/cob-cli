import groovy.transform.Field;
import org.apache.commons.logging.*;

import static utils.CobUtils.*;
import groovy.json.JsonOutput


@Field log = LogFactory.getLog(getClass());
log.info("Building VuePress e-learning content part")
return JsonOutput.prettyPrint(JsonOutput.toJson( getVuePressDocs() ))

/********************************************************************************************/

def getVuePressDocs() {
    def docs = [];

    def contents = registosPaginadosAsMap(66,"*", actionPacks.get("rmRest"), "sortablefield", true)
    contents.each { content ->
        def langs = ["","pt","es"]
        def contentLink = content["path"][0]
        if( contentLink == "/site/home/" ) contentLink = "/";

        if(!content["type"] || content["type"][0] == "SiteItem" && content["siteitemtype"][0] == "directory" ) return // No page for directories

        langs.each { lang -> 
            def langPostfix = lang ? "-" + lang : ""
            def contentMD = content["content"+langPostfix] ? content["content"+langPostfix][0] : content["content"] ? content["content"][0] : content["content-pt"] ? content["content-pt"][0] : content["content-es"] ? content["content-es"][0] : "";

            contentMD = addToFrontmatter(contentMD, "id: " + content.id)

            def isSitePath = contentLink =~ /^\/site\/([^\/]*)s\//
            def isSolutionPath = contentLink =~ /^\/solutions\//
            if( isSolutionPath ) {
                contentMD = addToFrontmatter(contentMD, "target: Solution")
            } else if( isSitePath ) {
                // If the content link starts with /site/ then use the next path part as the type. This will enable NavBar activeLink.
                // Notice we expect Types to be in the singular so we remove the 's' from the match on the type
                contentMD = addToFrontmatter(contentMD, "target: " + isSitePath[0][1])
            } else {
                def target = ""
                if(content && content["target"]) target = content["target"][0]
                contentMD = addToFrontmatter(contentMD, "target: " + target)
            }

            if(content["visibility"][0] != "Public") {
                contentMD = getJustFrontmatter(contentMD) + "<RestrictedContent/>"
            }

            def langPath = lang ? "/" + lang : ""
            docs.push(["path":  langPath + contentLink, "content": contentMD])
        }
    }
    return docs
}

def addToFrontmatter(content,expression) {
    // Acrescentado um \n à avaliação do conteúdo para compensar o caso em que,
    // quando só há frontmatter no conteúdo, o RM remove os trailing \n 
    // (terminando o conteúdo em --- e por isso depois não fazia match no split) 
    def frontmatterEval = (content+"\n")?.split("---")  
    if(frontmatterEval?.size()>2) {
        frontmatterEval[1] += expression + "\n"
        content = frontmatterEval.join("---\n")
    } else {
        content = "---\n" + expression + "\n---\n" + content
    }
    return content
}

def getJustFrontmatter(content) {
    def splitContent = content?.split("---\n")
    if(splitContent?.size()<=2) return ""
    return splitContent[0..1].join("---\n") + "---\n"
}