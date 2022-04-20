<template>
   <v-layout xs12 row wrap align-center>
      <v-flex xs12>
         <h3>Plano</h3>
      </v-flex>

      <v-flex v-if="debug"  xs12 style="text-align:left;">
         <code>{{ value }}</code>
      </v-flex>

      <v-flex md5 xs12>
         <v-layout column>
            <v-flex xs12 text-center>
               <h4>Permissões</h4>
            </v-flex>
            <v-layout row  v-for="perm in perms" v-bind:key="perm.name">
               <v-flex xs3 text-right :class="'state-' + perm.state">
                  {{ perm.state }}
                  <span v-if="perm.state === 'existing'">
                     [<a :href="'#/permission/' + perm.id" target="_blank">{{ perm.id }}</a>]
                  </span>
                  <span v-if="perm.state === 'error'"><pre>{{ perm.error }}</pre></span>
               </v-flex>
               <v-flex xs12 text-left>
                  <code>{{ perm.name }}</code>
               </v-flex>
            </v-layout>
         </v-layout>
      </v-flex>

      <v-flex md7 xs12>
         <v-layout column>
            <v-flex xs12 text-center>
               <h4>Roles</h4>
            </v-flex>
            <v-layout row align-start fill-height v-for="role in roles" v-bind:key="role.name">
               <v-flex xs2 text-right :class="'state-' + role.state">
                  {{ role.state }}
                  <span v-if="role.state === 'existing'">
                     [<a :href="'#/role/' + role.id" target="_blank">{{ role.id }}</a>]
                  </span>
                  <span v-if="role.state === 'error'"><pre>{{ role.error }}</pre></span>
               </v-flex>
               <v-flex  md4 xs12 text-left>
                  <code>{{ role.name }}</code>
               </v-flex>
               <v-flex  md6 xs12 text-left>
                  com perms: {{ role.perms }}
               </v-flex>
            </v-layout>
         </v-layout>
      </v-flex>

      <v-flex xs12 style="padding-top:20px">
            <v-btn v-on:click="refresh">Refresh Cache</v-btn>
            <v-btn color="primary" v-on:click="execute">Executar</v-btn>
      </v-flex>
   </v-layout>
</template>

<script>
import axios from 'axios';

export default {
   name: 'PlanExecutor',

   props: {
      value: Object,
      debug: Boolean
   },

   data() {
      return {
         waitingToCreateRoles: false
      }
   },

   computed: {
      plan() {
         return this.value
      },
      perms() {
         this.find('permission', this.plan.perms)

         return this.plan.perms
      },
      roles() {
         this.find('role', ( this.plan.roles || [] ))

         return  this.plan.roles || []
      }
   },

   watch: {
      waitingToCreateRoles() {
         if(this.waitingToCreateRoles && this.perms.every(p => p.state !== 'new')){
            this.createRoles();
         }
      },
      perms() {
         if(this.waitingToCreateRoles && this.perms.every(p => p.state !== 'new')){
            this.createRoles();
         }
      }
   },

   methods: {

      find: function(type, entities, force){
         entities.forEach((p, i) => {
            if(!force && p.state) return;

            axios.get('/userm/userm/' + type + '/product/recordm/name/' + encodeURIComponent(p.name))
               .then((resp) => {
                  this.$set(entities[i], 'state', 'existing')
                  this.$set(entities[i], 'id', resp.data.id)
               })
               .catch(() => {
                  this.$set(entities[i], 'state', 'new')
               })
         })
      },

      refresh: function(){
         this.find('permission', this.plan.perms, true)
         this.find('role', ( this.plan.roles || [] ), true)
      },

      execute: function(){
         this.waitingToCreateRoles = true;
         this.createPerms();
      },

      createPerms: function(){
         const product = this.plan.product;
         const perms = this.perms;
         const uri = 'userm/permission'

         const newPerms = perms.filter(p => p.state === 'new');

         newPerms.forEach(p => {
               const body = {
                  product: product,
                  name: p.name,
                  description: p.description
               }

               axios.post(uri, body)
                  .then(function(resp){
                     this.$set(p, 'state', 'existing')
                     this.$set(p, 'id', resp.data.id)
                  }.bind(this))

                  .catch(function(error){
                     window.console.error('JN perm', error)
                     this.$set(p, 'state', 'error')
                     this.$set(p, 'error', error.response.data)
                  }.bind(this))
         })
      },

      createRoles: function(){
         this.waitingToCreateRoles = false;

         const product = this.plan.product;
         const roles = this.roles;
         const uri = 'userm/role'

         const newRoles = roles.filter(r => r.state === 'new' || r.state === 'error' );

         if(newRoles.length === 0){
            roles.forEach(r => this.associateRoles(r.id, r.perms));
         }

         newRoles.forEach(r => {
               const body = {
                  product: product,
                  name: r.name,
                  description: r.description
               }

               axios.post(uri, body)
                  .then(function(resp){
                     this.$set(r, 'state', 'existing')
                     this.$set(r, 'id', resp.data.id)

                     this.associateRoles(r.id, r.perms);

                  }.bind(this))

                  .catch(function(error){
                     window.console.error('JN role', error)
                     this.$set(r, 'state', 'error')
                     this.$set(r, 'error', error.response.data)
                  }.bind(this))
         })
      },

      associateRoles: function(roleId, permNames){
         const permIds = permNames.map(name => this.perms.find(p => p.name === name).id)
         window.console.debug('JN', 'associate', roleId, permNames, permIds);

         axios.put('userm/role/' + roleId + '/permissions', permIds)
            .then(resp => {
               window.console.debug('JN', 'associar', resp)
            })

      }
   }
}
</script>
<style scoped>
.state-new {
   color: green
}
.state-existing {
   color: gray
}
.state-error {
   color: red
}
div, span, code {
   font-size: 1.0em;
}
</style>
