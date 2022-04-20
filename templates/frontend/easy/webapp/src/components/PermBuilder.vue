<template>
  <v-layout column>
    <v-layout row wrap>

      <v-flex sm3 xs12>
        <v-combobox v-model="domain" :items="selectableDomains" @change="actions = []"
                    label="Domain" dense clearable></v-combobox>
      </v-flex>

      <v-flex sm4 xs12>
        <v-combobox v-model="actions" :items="selectableActions" @change="entities = []"
                    label="Action" dense multiple clearable></v-combobox>
      </v-flex>

      <v-flex sm5 xs12>
        <v-combobox v-if="!customEntityType" v-model="entities" :items="selectableEntities"
                                             label="Entity" dense multiple clearable></v-combobox>
        <RmDomainChooser v-if="customEntityType === 'RM-DOMAIN-ID'"
                         v-model="customEntity"></RmDomainChooser>
        <RmDefinitionChooser v-if="customEntityType === 'RM-DEF'"
                             v-model="customEntity"></RmDefinitionChooser>
      </v-flex>
    </v-layout>

    <v-flex xs12>
      <v-textarea md3 v-model="description"
                      label="Description" rows="1" auto-grow></v-textarea>
    </v-flex>

    <v-layout v-if="debug" row wrap>
      <v-flex sm2 xs12>
        domain: {{ domain }}
      </v-flex>

      <v-flex sm4 xs12 style="background-color: #efe">
        actions: {{ actions }}
      </v-flex>

      <v-flex sm3 xs12>
        entities: {{ customEntityType ? "custom" : "normal" }} {{ customEntityType ? customEntity : entities }}
      </v-flex>

    </v-layout>

    <!-- needed to force de compute and emit of the resulting perm -->
    <span style="display:none">{{ resultingPerm }}</span>
  </v-layout>
</template>

<script>

import RmDomainChooser from './RmDomainChooser.vue'
import RmDefinitionChooser from './RmDefinitionChooser.vue'

export default {
  name: 'PermBuilder',

  components: {
    RmDomainChooser, RmDefinitionChooser
  },

  props: {
    perms: Array,
    value: Object,
    debug: Boolean
  },

  data() {
    const components = this.value.name.split(":");

     return {
       domain: components[0] || '',
       components: components,
       actions: components.length > 1 ? components[1].split(',') : [],
       entities: components.length > 2 ? components[2].split(',') : []
     }
  },

  computed: {

    selectableDomains: function(){
      return this.perms.map(d => d.domain);
    },
    selectableActions: function(){
      const selectedDomain = this.perms.find(d => d.domain === this.domain)
      const domainActions = ( selectedDomain || {} ).actions || [];
      return domainActions.map(a => a.name);
    },
    customEntityType() {
      const selectedDomain = this.perms.find(d => d.domain === this.domain)
      if(typeof selectedDomain === 'undefined' ) return false;

      const entities = selectedDomain.actions
        .filter(a => this.actions.includes(a.name))
        .flatMap(a => (a.entities || []) )

      return entities.length > 0 && entities[0].type 
    },
    customEntity: {
      get: function(){
        return this.customEntityType && this.components.length > 2 ? { id: this.components[2] } : {id: null}
      },
      set: function(newValue) {
        this.entities = [newValue]
      }
    },
    selectableEntities: function(){
      const selectedDomain = this.perms.find(d => d.domain === this.domain)
      if(typeof selectedDomain === 'undefined' ) return [];

      const selectedActions = selectedDomain.actions
        .filter(a => this.actions.includes(a.name))
      const actionEntities = selectedActions.flatMap(a => (a.entities || []) )
        .map(e => e.name);

      return actionEntities || [ "*" ];
    },

    description: {
      get: function(){
        return this.value.description
      },
      set: function(newValue){
        this.value.description = newValue;
      }
    },

    resultingPerm: function(){
      const result = this.buildName();

      if(this.value.name !== result){
        this.$emit('input', { name: result, description: this.description });
      }

      return result;
    }
  },

  methods: {
    buildName: function(){
      var result = '';

      if(this.domain && this.domain != '')
        result += this.domain;

      if(this.actions.length > 0)
        result += ':' + this.actions.join(",");

      if(this.entities.length > 0){ 
        if(this.customEntityType)
          result += ':' + this.entities.map(e => e.id || e).join(",");
        else
          result += ':' + this.entities.join(",");
      }
      return result;
    }
  }
}
</script>

<style></style>

<!-- vim: set sw=2 ts=2 et : -->
