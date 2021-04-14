<template>
  <v-app>
    <v-main>
      <HelloWorld :msg='"Welcome " + username '/>
    </v-main>
  </v-app>
</template>

<script>
import { umLoggedin } from '@cob/rest-api-wrapper';

export default {
  name: 'App',
  data: () => ({
      userInfo   : {},
  }),
  created() {
      umLoggedin().then( userInfo => this.userInfo = userInfo )
  },
  computed: {
    username: function () { return this.userInfo.username ? this.userInfo.username : "..." }
  }
};
</script>
