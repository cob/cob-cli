<template>
    <v-app>
      <v-container fluid grid-list-sm>

        <v-layout row wrap>
          <v-flex m12 xs12>
            <h3 style="text-align:center;margin-top:10px;">Easy Perms</h3>
          </v-flex>

          <v-flex md3 sm6 xs12>
              <v-switch v-model="showTemplates" label="Templates" hide-details></v-switch>
          </v-flex>
          <v-flex md3 sm6 xs12>
              <v-switch v-model="showBuilder" label="Builder" hide-details></v-switch>
          </v-flex>
          <v-flex md3 sm6 xs12>
              <v-switch v-model="showPlan" label="Plan" hide-details></v-switch>
          </v-flex>
          <v-flex md3 sm6 xs12>
              <v-switch v-model="debug" label="debug" hide-details></v-switch>
          </v-flex>
        </v-layout>

        <v-layout v-if="showTemplates" row wrap>

          <!-- Seleccionar template -->
          <v-flex xs12>
            <v-select :items="permTemplates"
                  v-model="selectedTemplate"
                  item-text="name" return-object
                  label="Escolha um template" clearable dense solo></v-select>
          </v-flex>

          <!-- Template -->
          <v-layout xs12 column v-if="selectedTemplate">
            <v-flex xs12 v-if="debug">
              {{ selectedTemplate }}
            </v-flex>

            <v-layout xs12 row wrap align-center
                      v-for="tmplVar in selectedTemplate.vars"
                      v-bind:key="tmplVar.name">
              <v-flex md2 sm3 xs12>{{ tmplVar.name }} : {{ tmplVar.type }}</v-flex>
              <v-flex md10 sm9 xs12>
                <v-text-field v-if="tmplVar.type === 'simple'"
                              v-model="tmplVar.value"></v-text-field>
                <RmDefinitionChooser v-if="tmplVar.type === 'RM-DEF'"
                                     v-model="tmplVar.value"></RmDefinitionChooser>
                <RmDomainChooser v-if="tmplVar.type === 'RM-DOMAIN-ID'"
                                 v-model="tmplVar.value"></RmDomainChooser>
              </v-flex>
            </v-layout>
          </v-layout>

          <v-flex xs12>
            <v-btn color="primary"
                   :disabled="selectedTemplate == null"
                   v-on:click="applyTemplate">Apply Template</v-btn>
          </v-flex>
        </v-layout>

        <!-- Builder -->
        <v-flex xs12 v-if="showBuilder">
          <ProductPermBuilder :perms="perms" :debug="debug" v-model="rmPerms"/>
        </v-flex>

        <v-flex md1 xs12 v-if="showBuilder">
          <v-btn color="primary" v-on:click="plan">Planear</v-btn>
        </v-flex>

        <!-- Creator -->
        <PlanExecutor v-if="showPlan" :value="rmPerms" :debug="debug"></PlanExecutor>
      </v-container>

    </v-app>
</template>

<script>
import ProductPermBuilder from './components/ProductPermBuilder.vue';
import RmDefinitionChooser from './components/RmDefinitionChooser.vue';
import RmDomainChooser from './components/RmDomainChooser.vue';
import PlanExecutor from './components/PlanExecutor.vue';

import permTemplates from './perm-templates.js';
import perms from './perms.js';

const applyAllSubstitutions =  function(value, subs){
  return subs.reduce(
    (acc, curr) => {
      // verdade para entidades complexas como Defs, Domains, etc...
      if(typeof curr.value === 'object'){
        acc = acc.replace(`$$${curr.name}.ID$$`, curr.value.id)
        acc = acc.replace(`$$${curr.name}.NAME$$`, curr.value.name)
      } else {
        acc = acc.replace(`$$${curr.name}$$`, curr.value)
      }
      return acc;
    } ,
    value
  )
}

export default {
  name: 'app',
  components: {
    ProductPermBuilder,
    RmDomainChooser,
    RmDefinitionChooser,
    PlanExecutor
  },
  data() {
    return {
      debug: false,
      showTemplates: false,
      showBuilder: true,
      showPlan: false,

      permTemplates: permTemplates,
      selectedTemplate: null,

      perms: perms,

      rmPerms: {
        product: "recordm",
        perms: [
          { name: "", description: ''}
        ],
        roles: [ ]
      }
    }
  },

  methods: {
    applyTemplate: function(){
      // todo jone tornar isto num ciclo
      const vars = this.selectedTemplate.vars
      const newPerms = JSON.parse(JSON.stringify(this.selectedTemplate.productPerms[0]))

      newPerms.perms = newPerms.perms.map(p => ({
        name: applyAllSubstitutions(p.name, vars),
        description: applyAllSubstitutions(p.description, vars)
      }))

      newPerms.roles = newPerms.roles.map(r => ({
        name: applyAllSubstitutions(r.name, vars),
        description: applyAllSubstitutions(r.description, vars),
        perms: r.perms.map(p => applyAllSubstitutions(p, vars))
      }))

      this.rmPerms = newPerms

      this.showTemplates = false;
      this.showBuilder = true;
    },

    plan() {
      this.showBuilder = false;
      this.showPlan = true;
    },
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  //text-align: center;
  color: #2c3e50;
  font-size: 1.2em;
}
#app .v-input input,
#app .v-input textarea,
#app .v-input .v-select__selection {
    font-size: 0.9em;
    min-height: fit-content;
}
</style>

<!-- vim: set sw=2 ts=2 et : -->
