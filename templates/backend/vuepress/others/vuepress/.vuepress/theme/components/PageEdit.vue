<template>
  <footer v-if="editLink || lastUpdated" class="page-edit">
    <div
      v-if="editLink && loggedIn"
      class="edit-link"
    >
      <a
        :href="editLink"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ editLinkText }}
        <OutboundLink />
      </a>
    </div>

    <div
      v-if="lastUpdated"
      class="last-updated"
    >
      <span class="prefix">{{ lastUpdatedText }}:</span>
      <span class="time">{{ lastUpdated }}</span>
    </div>
  </footer>
</template>

<script>
import isNil from 'lodash/isNil'
import { umLoggedin } from '@cob/rest-api-wrapper';

export default {
  name: 'PageEdit',

  data: () => ({
      userInfo   : {},
      loggedIn   : false
  }),
  created() {
      umLoggedin().then( userInfo => {this.userInfo = userInfo, this.loggedIn=userInfo.username != 'anonymous' }).catch( () => this.loggedIn == false) 
  },
  computed: {
    lastUpdated () {
      return this.$page.lastUpdated
    },

    lastUpdatedText () {
      if (typeof this.$themeLocaleConfig.lastUpdated === 'string') {
        return this.$themeLocaleConfig.lastUpdated
      }
      if (typeof this.$site.themeConfig.lastUpdated === 'string') {
        return this.$site.themeConfig.lastUpdated
      }
      return 'Last Updated'
    },

    editLink () {
      const showEditLink = isNil(this.$page.frontmatter.editLink)
        ? this.$site.themeConfig.editLinks
        : this.$page.frontmatter.editLink


      if (showEditLink && this.$page.frontmatter.id) {
        return "/recordm/#/instance/" + this.$page.frontmatter.id
      }
      return null
    },

    editLinkText () {
      return (
        this.$themeLocaleConfig.editLinkText
        || this.$site.themeConfig.editLinkText
        || `Source`
      )
    }
  }
}
</script>

<style lang="stylus">
@require '../styles/wrapper.styl'

.page-edit
  @extend $wrapper
  padding-top 1rem
  padding-bottom 1rem
  overflow auto

  .edit-link
    display inline-block
    a
      color lighten($textColor, 75%)
      margin-right 0.25rem
      .icon.outbound
        color lighten($textColor, 75%)
      &:hover
        .icon.outbound
          color lighten($textColor, 15%)
        color lighten($textColor, 15%)

  .last-updated
    float right
    font-size 0.9em
    .prefix
      font-weight 500
      color lighten($textColor, 25%)
    .time
      font-weight 400
      color #767676

@media (max-width: $MQMobile)
  .page-edit
    .edit-link
      margin-bottom 0.5rem
    .last-updated
      font-size 0.8em
      float none
      text-align left

</style>
