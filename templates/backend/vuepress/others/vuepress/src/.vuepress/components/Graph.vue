<template>
  <div id="cob-graph">
    <vue-mermaid-string v-if="ready" :value="diagram" />
    <div v-else>
      Loading ...
    </div>
  </div>
</template>

<script>
import VueMermaidString from "vue-mermaid-string";
import tinycolor from "tinycolor2";
import axios from 'axios'

// https://www.paletton.com/#uid=73+1p0k2O++00++00++7n++be+Z
let colorDefs = [
  { color: "#FFF" },
  { color: "#FFE9F0", darkenStroke: 20, saturateStroke: 0  },
  { color: "#F3FFE9", darkenStroke: 60, saturateStroke: -5 },
  { color: "#FFF9E9" },
  { color: "#D0FFA6", darkenStroke: 60, saturateStroke: -5 },
  { color: "#FF66E9", font: "#FFF" },
  { color: "#FF3399", font: "#FFF" },
];
//Default variations:
colorDefs = colorDefs.map((colorDef) => ({
  darkenStroke: 50,
  saturateStroke: 10,
  font: "#333",
  ...colorDef,
}));

const typeSequence = ["Tutorial","Howto","Reference","Explanation","Solution","SiteItem"]

const style = (node, colorIndex) => {
  const colorDef = colorDefs[colorIndex];
  const fill = colorDef.color;
  const font = colorDef.font;
  const stroke = tinycolor(colorDef.color)
    .darken(colorDef.darkenStroke)
    .saturate(colorDef.saturateStroke)
    .toString();
  return `style ${node} color:${font}, fill:${fill}, stroke:${stroke}`;
};

export default {
  components: {
    VueMermaidString,
  },

  data () {
    return {
      nodes: [],
      ready: false
    }
  },
  created() {
    let lang = this.$localePath.match(/^\/([^\/]*)(\/)?$/)[1]
    let preferredLangPostfix = lang ? "-"+lang : ""
    axios.get('/recordm/recordm/definitions/search/66?q=-chapter -.wip.*',{params: {sort:"sortablefield", size: 310}}) 
    .then( answer => {
      for(let content of answer.data.hits.hits.reverse()) {
        for(let langPostfix of [preferredLangPostfix,"","-pt","-es"] ) {
          try {
            let path = this.$site.base + this.$localePath.substring(1) + content._source["path"][0].substring(1)
            let id = content._id
            let title 
            let type = content._source["type"] ? content._source["type"][0] : ""
            if( !content._source["type"] || content._source["siteitemtype"] && content._source["siteitemtype"][0] == "directory") {
              title = content._source["descriptor"][0]
              type="dir"
            } else {
              title = content._source["name" + langPostfix][0] // Fails if it doesn't have this lang content (and will try another) 
            } 
            let styleIndex = typeSequence.indexOf(type)

            this.nodes.push( id + "[\"" + title + "\"]" )
            this.nodes.push( style(id,styleIndex+1) ) //If styleIndex is -1 => 0, 0 => 1, etc, etc
            if(type == "dir") {
              this.nodes.push( 'click ' + id + ' href "/recordm/#/instance/' + id + '" "' + title + '"' )
            } else {
              this.nodes.push( 'click ' + id + ' href "' + path + '" "' + title + '"' )
            }
            if(content._source["parent"]) {
              this.nodes.push( content._source["parent"][0] + "-->" + id )
            }
            break;
          } catch {}
        }
      }
      this.ready = true
    })
  },
  computed: {
    diagram: function() {
      let result = []
      result.push("flowchart LR ")
      result.push("subgraph Contents")
      result.push("direction LR")
      result.push("style Contents fill:#FFF, stroke:#ccc")
      result.push(...this.nodes)
      result.push("end")
      result.push("subgraph Legends")
      result.push("direction TB")
      result.push("style Legends fill:#FFF, stroke:#ccc")
      for( let typeIndex in typeSequence ) {
        result.push(typeSequence[typeIndex]+"s")
        result.push( style(typeSequence[typeIndex]+"s",+typeIndex+1) )
      }
      result.push("end")
      return result.join("\n")
    }
  }
};
</script>

<style>
#cob-graph {
  text-align: center;
}
#cob-graph svg {
  height:100%
}
</style>
