<template>
  <v-app>
    <v-main>
      <HelloWorld 
        :msg='"Welcome " + userInfo.username'
        :extraInfo='domainCount.value  ? "(your domain 1 has " + domainCount.value + " instances)" : "(no backend info)"'
      />
    </v-main>
  </v-app>
</template>

<script>
import { umLoggedin } from '@cob/rest-api-wrapper';
import { domainCount } from '@cob/dashboard-info';

export default {
  name: 'App',
  data: () => ({
      userInfo   : {},
      domainCount: domainCount(1),
  }),
  created() {
      umLoggedin().then( userInfo => this.userInfo = userInfo )
  }
};
</script>