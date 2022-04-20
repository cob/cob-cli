<template>
   <v-autocomplete v-model            = "rmid"
                   :items             = "definitions"
                   v-on:input         = "updateParent"
                   :loading           = "isLoading"
                   hide-no-data
                   item-text          = "name"
                   item-value         = "id"
                   :return-object     = false
     ></v-autocomplete>
</template>

<script>
export default {
  name: "RmDefinitionChooser",

  props: {
    value: Object,
    debug: Boolean
  },

  data() {
    return {
      rmid: this.value,
      isLoading: false,
      definitions: [],
      search: null
    }
  },

  created: function(){
    // Definitions have already been loaded
    if (this.definitions.length > 0) return

    // Items have already been requested
    if (this.isLoading) return

    this.isLoading = true

    // Lazily load input items
    fetch('/recordm/recordm/definitions?includeDisabled=false')
      .then(res => res.json())
      .then(res => {
        this.definitions = res.map(d => ({id: String(d.id), name: d.name}))
      })
      .catch(err => {
        console.log(err)
      })
      .finally(() => (this.isLoading = false))
  },

  methods: {
    updateParent: function(){
      this.$emit('input', { id: this.rmid, name: this.definitions.find( d => d.id == this.rmid).name })
    }
  },
}
</script>
<!-- vim: set sw=2 ts=2 et : -->
