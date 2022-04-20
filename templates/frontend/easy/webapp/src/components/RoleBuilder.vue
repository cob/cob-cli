<template>
   <v-layout column>
      <v-layout row wrap v-for="(role, index) in productRoles" v-bind:key="role.id" >
         <v-flex sm1 xs12 text-left>
            <v-btn small fab color="error" v-on:click="value.splice(index, 1)">-</v-btn>
         </v-flex>
         <v-flex md3 sm12 xs12 text-left>
            <v-text-field v-model="role.role.name"
                          label="nome"
                          @input="updateParentRole(index, 'name', role.role.name)"></v-text-field>
         </v-flex>
         <v-flex md8 sm12 xs12 text-left>
           <v-layout column>
             <v-flex text-left>
               <v-textarea v-model="role.role.description"
                           @input="updateParentRole(index, 'description', role.role.description)"
                           label="description" rows="1" auto-grow></v-textarea>
             </v-flex>
             <v-flex text-left>
               <v-combobox v-model="role.role.perms"
                           label="perms"
                           dense multiple chips
                           @input="updateParentRole(index, 'perms', role.role.perms)"></v-combobox>
             </v-flex>
           </v-layout>
         </v-flex>
      </v-layout>

      <v-flex sm2 xs12 style="text-align: left">
         <v-btn color="primary" v-on:click="addRole">+</v-btn>
      </v-flex>
   </v-layout>
</template>

<script>
var fakeRoleIdsForVFor = 1;

export default {
   name: 'RoleBuilder',

   props: {
      value: Array,
      debug: Boolean
   },

   computed: {
      productRoles: function(){
         return ( this.value || [] ).map(r => ({id: fakeRoleIdsForVFor++, role:r}));
      }
   },

   methods: {
      addRole: function(){
        this.value.push({ name:"", description: "", perms: []})
      },

      updateParentRole: function(index, field, newValue){
         const role = this.value[index];

         if(field === 'perms'){
            role[field] = newValue;
         } else {
            role[field] = newValue;
         }
      }
   }
}

</script>

<style></style>

<!-- vim: set sw=2 ts=2 et : -->
