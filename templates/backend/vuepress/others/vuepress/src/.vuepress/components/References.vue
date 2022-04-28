<template>
  <div class="outside-container">
    <div class="inside-container">
      <template v-for="(card, i) of cards">
        <div v-if="card.items.length" class="card-wraper"  :key="card.title">
          <h3>
            <span v-if="$attrs.mainNumber">
              {{ i + 1 }}. 
            </span>
            {{ card.title }}
          </h3>
          <div v-if="Object.keys(card.intro).length" class="meta">
            <div v-for="(value, name) in card.intro" :key="name">
              <strong>{{ name }}:</strong> 
              <wbr>
              <span> {{ value }} </span>
            </div>
          </div>
          <div class="flexible"></div>
          <div v-for="(item, i) in card.items" :key="item.title" class="item" :class="{multiple:i!=0}">
            <!-- TODO: adicionar marcas de lido, marca de conteúdo em construção, marca de certificado, tempo de leitura -->
            <!-- TODO: links para edição -->
            <span v-if="item.isRestricted" class="icon">🔓</span>
            <span v-if="card.numbering" class="numbering">
              {{ i + 1 }}. 
            </span>
            <span v-else class="no-numbering"/>
            <a :href="item.path">
              {{ item.title }}
            </a>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: "References",

  data: () => ({
    cards: []
  }),

  created() {
    let listProp = this.$attrs.list ? this.$attrs.list : "References";
    this.cards = this.$page[listProp];
  },

  beforeMount() {
    let lang = this.$localePath.match(/^\/([^\/]*)(\/)?$/)[1]
    let preferredLangPostfix = lang ? "-"+lang : ""

    this.cards.forEach( card => {
      if(card.queries.length) {
        let initialItems = card.items
        this.$set(card, 'items', [])
        this.cardsLoaded = true
        card.queries.forEach( queryItem => {
          axios.get('/recordm/recordm/definitions/search/7?q=' + queryItem.query ,{params: {sort:"sortablefield"}})
          .then( answer => {
            for(let content of answer.data.hits.hits.reverse()) {
              for(let langPostfix of [preferredLangPostfix,"","-pt","-es"] ) {
                try {
                  let title = content._source["name" + langPostfix][0] // Fails if it doesn't have this lang content (and will try another)
                  let id = content._id
                  let path = this.$site.base + this.$localePath.substring(1) + content._source["path"][0].substring(1)
                  let type = content._source["type"][0]
                  let target = content._source["target"] ? content._source["target"][0] : ""
                  let format = content._source["format"] ? content._source["format"][0] : ""
                  let isRestricted = initialItems.filter(i => i.id == id).length == 0;
                  card.items.push( { id: id, title: title, path: path, type: type, target: target, format: format, isRestricted: isRestricted} )
                  break;
                } catch {}
              }
            }
          })
        })
        card.queries = [] // clean queries to prevent getting them multiple times (with page back and forth)
      }
    })
  }
};
</script>

<style lang="stylus">
.inside-container
  display: flex;
  flex-wrap: wrap;
  align-content: stretch;
  align-items: stretch;
  justify-content: start;
  gap: 20px;
  @media (max-width: 768px)
    flex-direction column
  .card-wraper 
    flex-grow: 1;
    flex-basis: 10%;
    min-width: 300px;
    border: solid 1px lighten($accentColor,45);
    border-radius: 7px;
    padding: 20px;
    @media (max-width: 768px)
      background-color: lighten($accentColor,55);
      max-width 100%
    h3 
      margin-block-start: 0;
      margin-bottom: 0px;
      font-size: 1.35em;
    .meta 
      padding: 4px;
      margin-top:5px
      margin-bottom:5px
      background-color: #fffaf0;
      border: solid 0.9px #ddd;
      border-radius: 7px;
      div 
        font-size: 14px;
    .item
      display: flex
      align-items: flex-end
      .numbering
        font-size: 15px
        align-self: center
        min-width:19px
        text-align: right
        padding-right: 2px
        font-weight: 600;
      .no-numbering
        min-width: 4px
      a
        flex-grow: 1
      span.icon
        order: 1
        font-size: 13px
        min-width: 13px
        align-self: center

.buttonCards
  .inside-container
    text-align: center
    font-size: 1.2em
    justify-content: space-around;
    gap: 32px;
    margin-left: auto
    margin-right: auto
    flex-direction inherit
    .card-wraper
      display: flex;
      flex-flow: column-reverse;
      border:none
      max-width: 255px;
      min-width: 255px;
      background-color: none
      @media (max-width: 1018px)
        max-width: 355px;
      h3  
        display:none
      .flexible 
        flex-grow: 1;
      .meta 
        div
          strong
            font-weight: normal
            color: #888
          span
            font-size: 17px
            font-weight: 600
            color: #666
            &:before
              content: "\a";
              white-space: pre;
      a
      a:hover
        background-color: $accentColor;
        color: #fff;
        font-weight: bold;
        margin: 10px auto;
        border-radius: 8px;
        padding: 5px;
      a:hover
        background-color: lighten($accentColor,5);
        transition-duration: .2s;

.justContent
  .inside-container
    .card-wraper
      border:none
      background-color: none
      h3  
        display:none
      .flexible 
        flex-grow: 1;
      .meta 
        display:none
      .item
          margin-top: 10px
      .icon
          display:none

.inlineContent
  display: inline
  margin-right: 3px;
  .inside-container
    display: inline
    .card-wraper
      border:none
      background-color: none
      display: inline
      padding: 0
      h3  
        display:none
      .flexible 
        display: none
      .meta 
        display:none
      .item
        display: inline
        margin-right: -3px;
      .item.multiple
        span::after
          content: ", "
      .icon
          display:none
</style>