<template>
  <v-layout column wrap>
    <v-flex sm12 xs12 v-if="debug">
      {{ value }}
      <br/>
      {{ productPerms }}
    </v-flex>

    <v-flex >
      <h3>Produto</h3>
      <v-combobox xs1 v-model="product" :items="products"
                  @change="value.perms = [] ; updateParent"
                  label="Produto" dense solo></v-combobox>
    </v-flex>

    <v-flex sm12 xs12>
      <h3>Permissões</h3>
      <v-layout row v-for="(perm, index) in productPerms" v-bind:key="perm.id" >
        <v-btn small fab color="error" v-on:click="value.perms.splice(index, 1)">-</v-btn>
        <PermBuilder :perms="possiblePerms" :debug="debug" v-model="perm.perm" @input="updateParent(index, perm.perm)" />
      </v-layout>
    </v-flex>

    <v-flex sm2 xs12 text-left>
      <v-btn color="primary" v-on:click="addPerm">+</v-btn>
    </v-flex>

    <v-flex sm12 xs12>
      <h3>Roles</h3>
      <RoleBuilder v-model="this.value.roles" :debug="debug" @input="updateParent" />
    </v-flex>

  </v-layout>
</template>

<script>
import PermBuilder from './PermBuilder.vue';
import RoleBuilder from './RoleBuilder.vue';

var fakePermIdsForVFor = 1;

export default {
  name: 'ProductPermBuilder',

  components: {
    PermBuilder,
    RoleBuilder
  },

  props: {
    perms: Object,
    value: Object,
    debug: Boolean
  },

  computed: {
    products: function(){
      return Object.keys(this.perms)
    },

    product: {
      get: function(){
        return this.value.product || '';
      },
      set: function(newValue){
        this.value.product = newValue
      }
    },

    possiblePerms: function(){
      return this.perms[this.value.product];
    },

    productPerms: function(){
      return ( this.value.perms || [] ).map(p => ({id: fakePermIdsForVFor++, perm:p}));
    },
  },

  methods: {
    addPerm: function(){
      this.value.perms.push({ name:"", description: ""})
    },

    updateParent: function(index, newValue){
      this.$set(this.value.perms, index, newValue)
    },

  }
}

</script>

<style></style>

<!-- vim: set sw=2 ts=2 et : -->
