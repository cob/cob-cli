<template>
  <main class="home">
    <div>
      <div :class="['headline',{ normalWidth: normalWidth }]">
        <img class="headlineImg" src="/docs/Logo-Cult-of-Bits-400x400-1.png">
        <div class="headlineLeft">
          <span :style="{fontSize: $frontmatter.verbFontSize}">
            {{$frontmatter.verb}}
          </span> 
          <br>
          <span>
            Cult of Bits
          </span> 
        </div>
        <div :class="['line', { normalWidth: normalWidth }]"/>
        <div :class="['headlineRight',{ normalWidth: normalWidth }]">
          {{$frontmatter.lines[0]}} 
          <br>
          <b>{{$frontmatter.lines[1]}}</b> 
          <br>
          <i style="font-size:0.85em">
            {{$frontmatter.lines[2]}}
          </i>
          <br> 
          {{$frontmatter.lines[3]}}
        </div>
      </div> 
    </div>

    <Content class="theme-default-content custom" />

    <div
      class="footer"
      v-if="$frontmatter.footer"
      v-html="$frontmatter.footer"
    />
  </main>
</template>

<script>
export default {
  name: 'Home',

  data() {
      return {
          windowWidth: 1000
      }
  },
  mounted() {
    this.windowWidth = window.innerWidth
    window.onresize = () => this.windowWidth = window.innerWidth
  },
  computed: {
    normalWidth() {
      return this.windowWidth > this.$frontmatter.breakMediaMinWidth
    }
  }
}
</script>

<style lang="stylus">
.home 
  max-width: 50em;
  margin: 3em auto -2em auto;
  padding: 35px;
  .headline
    display: flex;  
    flex-wrap: wrap; 
    align-items: center;  
    gap: 20px;
    margin-bottom 2.5rem
    justify-content: center; 
    .headlineImg
      width: 100px;
    .headlineLeft
      font-size: 4em;
      text-align: center
      @media (max-width: 438px)
        font-size: 3em;
      margin-top: 10px;
      font-weight: 700;
      color: $accentColor;
      min-width:300px; 
      line-height: 0.9em;
    .headlineRight
      text-align: center;
      font-size: 1.3em
      margin-top:20px; 
      color: #50585D;
    .line
      border-left: solid 1px white;
      @media (max-width: 438px)
        display: none
    &.normalWidth
      justify-content: space-between; 
      .line
        height: 130px;
        margin-top: 24px;
        border-left: solid 1px gray;
      .headlineLeft
        font-size: 4em;
      .headlineRight
        text-align:left;
  .theme-default-content.custom.content__default 
    p
      text-align: justify;
      color: #777;

.footer
  font-size: 0.8em
  color lighten($textColor, 25%)
  padding: 1rem 0;
  text-align: center;
  border-top 1px solid $borderColor
  margin-top: 3em;

// Embrace nav menu 'Solutions' in |
@media (min-width: $MQMobile)
  .nav-item >a.nav-link[href*="/solutions/"] 
    border-left: 2px solid
    border-right: 2px solid
    padding-left: 15px 
    padding-right: 15px 
    &.cob-router-link-active
    &:hover
      border-bottom: unset
      &:before
        content: "";
        position: absolute;
        height: 12px;
        bottom: 4px;
        width: 70%;
        border-bottom: 2px solid #f90049;    
</style>