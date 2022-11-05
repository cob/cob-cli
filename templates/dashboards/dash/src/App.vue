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

const DASHBOARD_DEF = "Dashboard_v1"

export default {
        name: 'App',
        components: { Dashboard },
        data: () => ({
            error: "",
            userInfo: null,
            dashboardName: null,
            dashboardInstance: null,
            dashboardParsed: null,
            dashboardState: "Loading"
        }),
        created() {
            // At the initial load we get the dashboard instance name from the url
            umLoggedin().then( userInfo => {
                this.userInfo = userInfo
                this.dashboardName = document.getElementsByClassName("custom-resource")[0].getAttribute('data-name').split(":")[0]
                this.dashboardInstance = instancesList(DASHBOARD_DEF, this.dashboardQuery, 1 /*just get the first*/)
            })

            // Upon anchor navigation we get the dashboard instance name from the first param to the 'resume' callback.
            $('section.custom-resource').on('resume', (e, params) => {
                //Recheck user (the user might have changed or his groups might have changed after previous load)
                umLoggedin().then(userInfo => {
                    let name = params[0].split(":")[0]
                    if( name !== this.dashboardName || this.userInfo.username !== userInfo.username ){
                        this.userInfo = userInfo
                        this.dashboardName = name
                        this.dashboardInstance.changeArgs({query: this.dashboardQuery })
                    }
                })
            });
        },
        computed: {
            dashboardQuery() {
                let groups = this.userInfo.groups.map(g=> "\"" + g.name + "\"").join(" OR ")
                let nameQuery = "name.raw:\"" + this.dashboardName + "\" "
                let accessQuery = " (groupaccess.raw:(" + groups + ") OR (-groupaccess:*) )"
                return "(" + nameQuery + accessQuery +") OR id:" + this.dashboardName
            }
        },
        watch: {
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
            'dashboardInstance.value'(newDashboard) {
                if(newDashboard.length === 0) {
                    this.dashboardState = "Error"
                    this.error = "Error: dashboard '" + this.dashboardName + "' was not found for your user"
                } else {
                    //Instance found (from ES) (we only asked for the 1st match)
                    let newInstanceId =  newDashboard[0].id
                    axios.get("/recordm/recordm/instances/" + newInstanceId)
                    .then(resp => {
                        try {
                            this.dashboardParsed = parseDashboard(resp.data, this.userInfo)
                            this.dashboardState = "Ready"
                            //Set the page title
                            document.title = "Recordm[" + this.dashboardName + "]"
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
                }
            }
        }
    };
</script>