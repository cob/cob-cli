<template>
  <v-autocomplete v-model            = "rmid"
                  :items             = "domains"
                  v-on:input         = "updateParent"
                  :loading           = "isLoading"
                  item-text          = "name"
                  item-value         = "id"
                  :return-object     = false
                  hide-no-data
    ></v-autocomplete>
</template>

<script>
export default {
  name: "RmDomainsChooser",

  props: {
    value: String,
    debug: Boolean
  },

  data() {
    return {
      rmid: this.value,
      isLoading: false,
      domains: [],
      search: null
    }
  },

  created: function(){
    // Domains have already been loaded
    if (this.domains.length > 0) return

    // Items have already been requested
    if (this.isLoading) return

    this.isLoading = true

    // Lazily load input items
    fetch('/recordm/recordm/domains')
      .then(res => res.json())
      .then(res => {
        this.domains = res.map(d => ({id: String(d.id), name: d.name}))
      })
      .catch(err => {
        console.log(err)
      })
      .finally(() => (this.isLoading = false))
  },

  methods: {
    updateParent: function(){
      this.$emit('input', this.rmid)
    }
  }

}
</script>
<!-- vim: set sw=2 ts=2 et : -->
