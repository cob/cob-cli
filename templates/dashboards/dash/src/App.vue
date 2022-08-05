<template>
    <div class="h-full w-full">
        <div v-if="dashboardState === 'Loading'" class="text-center my-20 text-2xl text-slate-500">
            Loading...
        </div>
        <div v-else-if="dashboardState === 'Error'" class="text-center my-20 text-2xl text-red-500">
            {{error}}
        </div>
        <Dashboard v-else :dashboard="dashboardParsed" :userInfo="userInfo"/>
    </div>
</template>

<script>
import axios from 'axios';
import {umLoggedin} from '@cob/rest-api-wrapper';
import {instancesList} from '@cob/dashboard-info';
import {parseDashboard} from './collector.js'
import Dashboard from './components/Dashboard.vue'

export default {
        name: 'App',
        components: { Dashboard },
        data: () => ({
            userInfo: null,
            name: null,
            error: "",
            dashboardInstance: null,
            dashboardInstanceId: Number,
            dashboardParsed: null,
            dashboardState: "Loading"
        }),
        created() {
            // At the initial load we get the dashboard instance name from the url
            umLoggedin().then( userInfo => {
                let name = document.getElementsByClassName("custom-resource")[0].getAttribute('data-name').split(":")[0]
                this.dashboardInstance = instancesList("Dashboard", this.getDashboardQuery(name, userInfo), 1)
            })

            // Upon anchor navigation we get the dashboard instance name from the first param to the 'resume' callback.
            $('section.custom-resource').on('resume', (e, params) => {
                //Recheck user (the user might have changed or his groups might have changed after previous load)
                umLoggedin().then(userInfo => {
                  let name = params[0].split(":")[0]
                  if( name !== this.name || this.userInfo.username !== userInfo.username ){
                    this.dashboardInstance.changeArgs({query: this.getDashboardQuery(name, userInfo) })
                  }
                })
            });
        },
        watch: {
            // Monitor changes to the id of the Dashboard instance
             dashboardInstanceId(newInstanceId) {
                axios
                  .get("/recordm/recordm/instances/" + newInstanceId)
                  .then(resp => {
                      try {
                          this.dashboardParsed = parseDashboard(resp.data, this.userInfo)
                          this.dashboardState = "Ready"
                      }
                      catch(e) {
                          this.error = "Error: error parsing dashboard " + newInstanceId + " (" + e + ")"
                          this.dashboardState = "Error"
                          console.error(e)
                      }
                  })
                  .catch( (e) => {
                      if( e.response && e.response.status && e.response.status === 403) {
                          this.error = "New authorization required..."
                      } else {
                          this.error = "Error: error getting dashboard " + newInstanceId
                      }
                      this.dashboardState = "Error"
                      console.error(e)
                  })
            },

            // Monitor state changes to the searching of the Dashboard instance
            'dashboardInstance.state'(instanceInfoState) {
                if(instanceInfoState === "loading" || instanceInfoState === "updating") {
                  this.dashboardState = "Loading"

                } else if(instanceInfoState === "error") {
                    // Special treatment for 430 (unauthorized) error:
                    if(this.dashboardInstance.errorCode === 403) {
                        // check who's the new user:
                        umLoggedin().then( userInfo => {
                            if(userInfo.username === "anonymous") {
                                // If the user is anonymous it means we timed out the cookie validity - reload at the same url
                                document.location.reload()
                            } else {
                                // Otherwise the user changed (in another tab) OR the user groups changed OR the dashboards access groups changed
                                // send to root
                                document.location = "/"
                            }
                        })
                    } else {
                        this.dashboardState = "Error"
                        this.error = "Error: error getting dashboard (" + this.dashboardInstance.errorCode + ")"
                    }                    
                }
            },

            // Monitor value changes to the values of the Dashboard instance
            'dashboardInstance.value'(newDashboards) {
                if(newDashboards.length === 0) {
                    this.dashboardState = "Error"
                    this.error = "Error: dashboard '" + this.name + "' was not found for your user"
                } else {
                    //Instance(s) found (from ES). Use the 1st result.
                    this.dashboardInstanceId =  newDashboards[0].id
                }
            }
        },
        methods: {
            getDashboardQuery(name, userInfo) {
                this.userInfo = userInfo
                this.name = name

                // TODO this is wrong we should only set the dashboard name after we pull it from recordm.
                // there is no guarantee that dashboard exists
                document.title = "Recordm[" + name + "]"
                let groups = userInfo.groups.map(g=> "\"" + g.name + "\"").join(" OR ")

                let nameQuery = "name.raw:\"" + name + "\" "
                let accessQuery = " (groupaccess.raw:(" + groups + ") OR (-groupaccess:*) )"
                return "(" + nameQuery + accessQuery +") OR id:" + name
            }
        }
    };
</script>