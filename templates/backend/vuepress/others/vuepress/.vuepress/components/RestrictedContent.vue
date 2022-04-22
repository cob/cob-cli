<template>
    <clientOnly>
        <div>
            <div v-if="loading">
                Loading ...
            </div>
            <div v-else>
                <div v-if="hasAccess" v-html="renderedMarkdown"></div>

                <div v-else class="warning custom-block">
                    <p class="custom-block-title">WARNING</p> 
                    <p>Restricted Content</p>
                </div>
            </div>
        </div>
    </clientOnly>
</template>

<script>
import axios from 'axios'
import markdownIt from 'markdown-it';
import emojiPlugin from 'markdown-it-emoji';
import prism from 'markdown-it-prism';

import "prismjs/components/prism-java"
import "prismjs/components/prism-sql"
import "prismjs/components/prism-groovy"
import "prismjs/components/prism-jsx"
import "prismjs/components/prism-json"
import "prismjs/components/prism-bash"
import "prismjs/components/prism-nix"
import "prismjs/components/prism-nginx"

export default {
    name: 'ConditionalContent',
    data: () => ({
      renderedMarkdown: "",
      hasAccess: false,
      loading: true,
    }),
    mounted() {
        let lang = this.$localePath.match(/^\/([^\/]*)(\/)?$/)[1]
        let preferredLangPostfix = lang ? "-"+lang : ""

        axios.get('/recordm/recordm/definitions/search/7?q=id:' + this.$page.frontmatter.id ,{})
        .then((answer) => {
            let md = new markdownIt({ html: true });
            md.use(emojiPlugin)
            md.use(prism)
            let content
            for(let langPostfix of [preferredLangPostfix,"","-pt","-es"] ) {
              try {
                content = answer.data.hits.hits[0]._source["content" + langPostfix][0]
                break;
              } catch {}
            }
            
            if(content) {
                this.hasAccess = true;
            }

            // if there is some frontmatter data on the content remove it before rendering it
            if(content && content.indexOf("---\n") == 0) {
                let frontmatterEval = content.split("---\n")
                if(frontmatterEval.length>2) {
                    frontmatterEval.shift() // Before first ---\n (should be "")
                    frontmatterEval.shift() // frontmattercontent
                    content = frontmatterEval.join() //Just content
                }
            }
            this.renderedMarkdown = md.render(content)
        })
        .catch()
        .finally(() => this.loading = false)
    }
}
</script>