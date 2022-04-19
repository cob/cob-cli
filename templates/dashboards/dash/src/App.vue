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
import { instancesList, domainCount, definitionCount, fieldSum } from '@cob/dashboard-info';
import Dashboard from './Dashboard.vue'

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
    }),
    created() {
        umLoggedin().then( userInfo => this.userInfo = userInfo )
        //At the initial load we get the dashboard instance from the url
        let page_title = document.getElementById("dash").getAttribute('data-name')
        this.currentDashboardInstance = instancesList("Dashboard", "page_title.raw:" + page_title, 1, { changeCB: this.loadDashboard })

        $('section.custom-resource').on('resume', (e, params) => {
            //register this callback to every anchor navigation. In these cases we get the dashboard instance from the first param of the callback
            this.currentDashboardInstance.changeArgs({query:"page_title.raw:"+params[0]})
        });
    },
    methods: {
        loadDashboard(newResult) {         
            debugger;
            if(newResult.value.length > 0) {
                this.state = "Loading"
                let instance = newResult.value[0].id
                axios.get("/recordm/recordm/instances/" + instance)
                    .then(resp => {
                        let raw_dashboard = resp.data
                        const dashboard_thunk = this.parseDashboard(raw_dashboard)
                        this.dashboard = this.createDashboardFromThunk(dashboard_thunk)
                        this.state = "Ready"
                    })
                    .catch( (e) => this.error = "Error: error getting dashboard", this.state = "Error" )
            } else {
                this.error = "Error: invalid dashboard"
                this.state = "Error"
            }
        },
        createDashboardFromThunk(dashboard) {
            dashboard.boards.forEach(b => b.components.forEach(c => {
                if (c.component_type == "Totals")
                    c.lines.forEach(l => {
                        l.values = l.values.map(v => {
                            if(v.args[2] && v.args[2].startsWith("{")) {
                                v.args[2] = JSON.parse(v.args[2])
                            }
                            return ({
                                dash_info: this[v.type].apply(this, v.args), // Return DashInfo, which is used by the component
                                style: v.style
                            })
                        })
                    })
            }))
            return dashboard
        },
        parseDashboard(raw_dashboard_origin) {
            // Parse raw dashboard

            let raw_dashboard = JSON.parse(JSON.stringify(raw_dashboard_origin)) // TODO: Is this deep copy slow?
            let dashboard = {
                page_title: undefined,
                grid_cols: undefined,
                max_width: undefined,
                boards: [],
                permission: undefined
            }

            let _ignore = raw_dashboard.fields.shift() // Dashboard Info Label

            const raw_page = raw_dashboard.fields.shift()
            console.assert(raw_page.fieldDefinition.name == "Page Title")
            dashboard.page_title = raw_page.value 

            const raw_grid_cols = raw_dashboard.fields.shift()
            console.assert(raw_grid_cols.fieldDefinition.name == "Grid Columns")
            dashboard.grid_cols = raw_grid_cols.value

            const raw_max_width = raw_dashboard.fields.shift()
            console.assert(raw_max_width.fieldDefinition.name == "Max Width")
            dashboard.max_width = raw_max_width.value

            const raw_permission = raw_dashboard.fields.shift() // remove last value from raw_page fields (permission) leaving raw_page fields as a list of boards
            console.assert(raw_permission.fieldDefinition.name == "Permission")
            dashboard.permission = raw_permission.value

            _ignore = raw_dashboard.fields.shift() // Boards Label

            const raw_boards = raw_dashboard.fields // raw page fields without the last field which was /permission/

            for (let raw_board of raw_boards) {
                console.assert(raw_board.fieldDefinition.name == "Board Title")
                let board = {
                    board_title: raw_board.value,
                    row_span: undefined,
                    col_span: undefined,
                    components: [ ]
                }

                const raw_col_span = raw_board.fields.shift()
                console.assert(raw_col_span.fieldDefinition.name == "Col Span")
                board.col_span = raw_col_span.value

                const raw_row_span = raw_board.fields.shift()
                console.assert(raw_row_span.fieldDefinition.name == "Row Span")
                board.row_span = raw_row_span.value

                const raw_components = raw_board.fields

                for (let raw_component of raw_components) {
                    console.assert(raw_component.fieldDefinition.name == "Component")

                    const componentsTypes = {
                        'Totals': {
                            headers: [],
                            headers_style: null,
                            lines: []
                        },
                        'Menu': {
                            items: []
                        },
                        'Title': {
                            title_text: null
                        }
                    }

                    let component = {
                        component_type: raw_component.value,
                        ...JSON.parse(JSON.stringify(componentsTypes[raw_component.value] ? componentsTypes[raw_component.value] : {}))
                    }

                    const raw_parts = raw_component.fields
                    if (component.component_type == 'Totals') { /// {{{

                        let raw_headers = raw_parts.shift().fields // "Pop" first element (Headers)
                        const raw_header_style = raw_headers.pop() // and its last field (Headers Style)
                        console.assert(raw_header_style.fieldDefinition.name == "Style Header")
                        component.headers_style = raw_header_style.value 
                        component.headers = raw_headers.map(x => x["value"])

                        const raw_lines = raw_parts.filter(x => x.fieldDefinition.name == "Line")

                        for (let raw_line of raw_lines) {

                            let line = {
                                text: raw_line.value,
                                text_style: undefined,
                                values: [
                                    /*
                                {
                                type: undefined,
                                args: []
                                style: undefined
                                }
                                     */
                                ]
                            }

                            const raw_text_style = raw_line.fields.pop() // Style Line (Last field)
                            console.assert(raw_text_style.fieldDefinition.name == "Style Line")
                            line.text_style = raw_text_style.value

                            line.values = raw_line.fields.map(v => { // Remaining list of Values
                                console.assert(v.fieldDefinition.name == "Value")
                                const value_type = v.value

                                const raw_style = v.fields.shift()
                                console.assert(raw_style.fieldDefinition.name == "Style Value")

                                const args = v.fields.map(v => v.value)

                                return {
                                    type: value_type,
                                    style: raw_style.value,
                                    args: args
                                }
                            })

                            component.lines.push(line)

                        }

                    } /// }}}
                    else if (component.component_type == 'Menu') { /// {{{

                        const raw_items = raw_parts.filter(x => x.fieldDefinition.name == "Text") // We removed the 2 first fields and only have the lines left

                        for (let raw_item of raw_items) {

                            let item = {
                                text: raw_item.value,
                                text_style: undefined,
                                link: undefined
                            }

                            const raw_link = raw_item.fields.shift() // Link
                            console.assert(raw_link.fieldDefinition.name == "Link")
                            item.link = raw_link.value

                            const raw_text_style = raw_item.fields.shift() // Style Text
                            console.assert(raw_text_style.fieldDefinition.name == "Style Text")
                            item.text_style = raw_text_style.value

                            component.items.push(item)
                        }

                    } /// }}}
                    else if (component.component_type == 'Title') { /// {{{
                        const raw_items = raw_parts.filter(x => x.fieldDefinition.name == "Title") // We removed the 2 first fields and only have the lines left
                        console.assert(raw_items.length == 1)
                        component.title_text = raw_items[0].value
                    } /// }}}
                    else if (component.component_type == null) {
                        // Empty component
                    }
                    else console.error("Undefined component type!", component.component_type)

                    board.components.push(component)
                }

                dashboard.boards.push(board)
            }

            console.log("finished parsing!", dashboard)
            return dashboard
        },

        // Register functions for dynamic use in createDashboardFromThunk
        definitionCount: definitionCount,
        domainCount: domainCount,
        fieldSum: fieldSum,
        link(url, icon) {
            return { value: icon, href: url, state: undefined, isLink: true }
        }
    }
};
</script>