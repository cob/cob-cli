<template>
    <div>
        <div v-if="state=='Loading'" class="text-center my-20 text-2xl text-slate-500">
            Loading...
        </div>
        <div v-else-if="state=='Error'" class="text-center my-20 text-2xl text-error">
            {{error}}
        </div>
        <Dashboard v-else :dashboard="dashboard" />
    </div>
</template>

<script>
import axios from 'axios';
import { umLoggedin } from '@cob/rest-api-wrapper';
import { instancesList } from '@cob/dashboard-info';
import Dashboard from './Dashboard.vue'
import {parseDashboard} from './collector.js'

export default {
    name: 'App',
    components: {
        Dashboard
    },
    data: () => ({
        userInfo: {},
        state: "Loading",
        error:"",
        currentDashboardInstance: null,
        dashboard: null,
        page_title: null
    }),
    created() {
        umLoggedin().then( userInfo => this.userInfo = userInfo )
        //At the initial load we get the dashboard instance from the url
        this.page_title = document.getElementById("dash").getAttribute('data-name')
        this.currentDashboardInstance = instancesList("Dashboard", "page_title.raw:\"" + this.page_title + "\"", 1)

        $('section.custom-resource').on('resume', (e, params) => {
            //register this callback to every anchor navigation. In these cases we get the dashboard instance from the first param to the callback
            this.page_title = params[0]
            this.currentDashboardInstance.changeArgs({query:"page_title.raw:\"" + this.page_title + "\""})
        });
    },
    watch: {
        'currentDashboardInstance.state'(state) {
            if(state == "loading" || state == "updating") {
                this.state = "Loading"
            } else if(state == "error") {
                this.error = "Error: error getting dashboard"
                this.state = "Error"
            } else if( this.currentDashboardInstance.value.length > 0) {
                this.state = "Loading"
                let instanceId = this.currentDashboardInstance.value[0].id
                axios.get("/recordm/recordm/instances/" + instanceId)
                    .then(resp => {
                        try {
                            this.dashboard = parseDashboard(resp.data)
                            this.state = "Ready"
                        }
                        catch(e) {
                            this.error = "Error: error processing dashboard " + instanceId
                            this.state = "Error"
                        }
                    })
                    .catch( (e) => {
                        this.error = "Error: error getting dashboard " + instanceId
                        this.state = "Error"
                    })
            } else {
                this.error = "Error: dashboard '" + this.page_title + "' not found"
                this.state = "Error"
            }
        }
    }
};
</script>