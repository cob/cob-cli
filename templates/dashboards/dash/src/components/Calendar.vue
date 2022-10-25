<template>
  <div :class='["relative", classes]'>

    <Waiting :active='updatingFlag || debouncing' :interactable='debouncing'/>

    <div>
      <div class='mb-4 text-center text-4xl'>{{ monthTitle }} {{ yearTitle }}</div>
      <FullCalendar ref='fullCalendar' :options='calendarOptions'/>
    </div>

  </div>
</template>

<script>
  import '@fullcalendar/core/vdom'
  import FullCalendar from '@fullcalendar/vue'
  import dayGridPlugin from '@fullcalendar/daygrid'
  import interactionPlugin from '@fullcalendar/interaction'
  import listPlugin from '@fullcalendar/list'
  import allLocales from '@fullcalendar/core/locales-all';
  import {instancesList} from '@cob/dashboard-info';
  import Waiting from './shared/Waiting.vue'
  import debounce from 'lodash.debounce';
  import {toEsFieldName} from '@cob/rest-api-wrapper/src/utils/ESHelper';
  import rmListDefinitions from '@cob/rest-api-wrapper/src/rmListDefinitions';
  import tippy from 'tippy.js';
  import Instance from "@/components/shared/Instance";
  import Vue from "vue";
  import ComponentStatePersistence from "@/model/ComponentStatePersistence";

  const DEFAULT_EVENT_COLOR = '#0e7bbe'
  const MAX_VISIBLE_DAY_EVENTS = 3

  export default {
    components: {
      FullCalendar,
      Waiting,
    },

    props: {
      component: Object,
      userInfo: Object
    },

    data: () => ({
      rmEventSources: [], // Array with a DashInfo(...) for each event source spec
      createDefinitionId: null,

      monthTitle: null,
      yearTitle: null,
      dateRange: null, // array: [initDate, endDate]

      calendarApi: null,
      debouncing: false,
      calendarOptions: {
        plugins: [dayGridPlugin, interactionPlugin, listPlugin],
        timeZone: 'local',
        locales: allLocales,
        // Take in consideration updating the initial state value of `activeView` if you change this value
        initialView: 'dayGridWeek',
        headerToolbar: {
          left: 'today prev next',
          center: '',
          right: 'dayGridWeek,dayGridMonth,listMonth'
        },
        buttonText: {
          today: 'Today',
          week: 'Week',
          month: 'Month',
          list: 'List',
        },
        height: 'auto',
        contentHeight: 'auto',
        aspectRatio: 2,
        validRange: {
          start: '1970-01-01'
        },
        noEventsContent: {html: '<div>&nbsp;</div>'}
      },

      // Need the debouncer to delay the change of the calendar option to make a day selectable because it's impossible
      // to know if there is a tooltip open.
      lazyCalendarConfigurer: debounce((calendarApi, enable) => calendarApi.setOption('selectable', enable), 500),

      statePersistence: Object,
    }),

    created() {
        this.calendarOptions.initialView = this.eventView[0]
        this.calendarOptions.headerToolbar.right = this.eventView.join(",")
        
        this.statePersistence = new ComponentStatePersistence(this.component.id, this.updateCalendarBasedOnPersistedStateChange)

        // Setup a dashInfo placeholder for each event source, initially with a zero result query ( "-*") so it has a fast response
        for(let i in this.eventSources) {
          this.rmEventSources.push( instancesList( this.eventSources[i]['Definition'], "-*", 800, 0, "", {validity: 60}) )
        }

        // If configured get the definition id to allow instance creation
        if(this.createDefinition) {
          rmListDefinitions({name: this.createDefinition, includeDisabled: true})
          .then( definitions => {
            if (definitions.length) {
              this.createDefinitionId = definitions[0].id
            } else {
              cob.ui.notification.showError(`Unable to find definition ${this.definition}`)
            }
          })
        }
    },

    mounted() {
      // Now that we have DOM finish calendar configuration
      const calendarApi = this.$refs.fullCalendar.getApi()
      this.calendarApi = calendarApi
      this.initialDate = calendarApi.getDate()

      calendarApi.setOption('dayMaxEvents', this.dayMaxEvents === -1 ? false : this.dayMaxEvents)
      calendarApi.setOption('locale', navigator.language ? navigator.languages[0] : undefined )
      calendarApi.setOption('selectMinDistance', !this.endDateField ? 1 : 0) //only allow to select on day if no end date field is available
      calendarApi.setOption('selectable', this.allowCreateInstances)
      calendarApi.setOption('select', this.redirectToNewInstance)
      calendarApi.setOption('viewDidMount', this.updatePersistedStateBasedOnCalendarChange)

      const lazyEventsLoader = debounce((dateInfo) => {
        this.debouncing = false
        this.updatePersistedStateBasedOnCalendarChange()
        this.dateRange = [dateInfo.start, dateInfo.end]
      }, 800)

      calendarApi.setOption('datesSet', (dateInfo) => {
        // Reflect immediately the change in the title and set 'debouncing' to 'true' to signal change in progress
        const currentDate = calendarApi.getDate()
        this.monthTitle = currentDate.toLocaleString('default', {month: 'long'});
        this.yearTitle = currentDate.getFullYear()
        this.debouncing = true   

        // 'debounce' loading the events (ie, wait for some user inactivity) 
        lazyEventsLoader(dateInfo)
      })

      calendarApi.setOption('eventClick', (eventClickInfo) => {
        // Check if there is already a tooltip instance associated to the element
        // if not let's create one,
        if (!eventClickInfo.el._tippy) {
          // When list view is active I have to look for a different tooltip anchor
          let listViewActive = eventClickInfo.view.type.match(/list.*/)
          const element = listViewActive
                          ? eventClickInfo.el.getElementsByClassName('fc-list-event-title')[0].children[0]
                          : eventClickInfo.el
          // tippy will handle hide and show of existing tooltips. We just need to trigger the show
          this.buildTooltipInstance(element, eventClickInfo.event.extendedProps.esInstance, listViewActive).show()
        }
      })
    },

    beforeDestroy() {
      this.statePersistence.stop()
      for (var i=0; i < this.rmEventSources.length; i++) {
        this.rmEventSources[i].stopUpdates()
      }
    },

    computed: {
      // Customizations component model
      options()              { return this.component['CalendarCustomize'][0] },
      classes()              { return this.options['CalendarClasses'] || 'p-4' },
      inputVarCalendar()     { return this.options['InputVarCalendar'] || [] },
      allowCreateInstances() { return this.options['AllowCreateInstances'] === 'TRUE' || false},
      createDefinition()     { return this.options['CreateDefinition'] },
      eventView()            { return this.options['EventViews'] && this.options['EventViews'].split(',') || ['dayGridWeek','dayGridMonth','listMonth'] },
      outputVar()            { return this.options['OutputVarCalendar'] || '' },
      dayMaxEvents()         { return parseInt(this.options['MaxVisibleDayEvents'], 10) || MAX_VISIBLE_DAY_EVENTS },
      
      // Calendar component model
      eventSources()         { return this.component['Events'] },

      // Behavior component model
      updatingFlag()         { return this.eventSources.map(source => source.state == "loading" || source.state == "updating" ).reduce( (acc,v) => acc || v, false) }, //True if any source is loading|updating

      queries() {
        let queries = []
        if (this.dateRange) { // Only calculate queries after having a dateRange set by the calendar
          for(let i in this.eventSources) {
            // Calculate date range query part
            let startField = toEsFieldName(this.eventSources[i]['DateStartEventField'])
            let endField   = toEsFieldName(this.eventSources[i]['DateEndEventField'])
            let dateRangeQuery = `(${startField}:[${this.dateRange[0].getTime()} TO ${this.dateRange[1].getTime()}])`
            if (endField) {
              dateRangeQuery += ` OR (${endField}:[${this.dateRange[0].getTime()} TO ${this.dateRange[1].getTime()}])`
              dateRangeQuery += ` OR (${startField}:<${this.dateRange[0].getTime()} AND ${endField}:>=${this.dateRange[1].getTime()})`
            }

            // Calculate final query
            const eventQuery = this.eventSources[i]['EventsQuery'] && this.eventSources[i]['EventsQuery'].replace(/__USERNAME__/g, this.userInfo.username) || '*'
            const baseQuery = `${eventQuery} AND (${dateRangeQuery})`
            const inputVars = new Set(this.inputVarCalendar.map(inputVar => inputVar['InputVarCalendar']));
            const finalQuery = `${baseQuery} ${[...inputVars].map(inputVar => this.component.vars[inputVar]).join(' ')}`.trim()
  
            queries.push(finalQuery)

            // If set, the 'outputVar' should be a query reflecting the current date range displayed on the calendar. Since we can use only one date_field for the query we opt to use the first(0) "Event Source" specs
            if (i==0 && this.outputVar) this.$set(this.component.vars, this.outputVar, dateRangeQuery) 
          }
        }
        return queries
      },
      
      allResults() {
        let results = []
        for (var i=0; i<this.rmEventSources.length;i++) {
          const rmEventSource = this.rmEventSources[i]
          if (rmEventSource.results && rmEventSource.results.value) {
            for(let result of rmEventSource.results.value) {
              result["DESCRIPTION FIELD"] = toEsFieldName(this.eventSources[i]['DescriptionEventField'])
              result["STATE FIELD"]       = toEsFieldName(this.eventSources[i]['StateEventField'])
              result["START DATE FIELD"]  = toEsFieldName(this.eventSources[i]['DateStartEventField'])
              result["END DATE FIELD"]    = toEsFieldName(this.eventSources[i]['DateEndEventField'])
              results.push(result)
            }
          }
        }
        return results
      }
    },

    watch: {
      queries: function(newQueries) {
        this.calendarApi.setOption('noEventsContent', {html: '<div>&nbsp;</div>'})
        for (var i=0; i<newQueries.length; i++) {
          this.rmEventSources[i].changeArgs({query: newQueries[i]})
        }
      },

      allResults: function(esInstances) {
        const newCalendarEvents = this.buildCalendarEvents(esInstances)
        const calendarApi = this.calendarApi

        calendarApi.batchRendering(() => {
          calendarApi.getEvents().forEach(event => event.remove())
          newCalendarEvents.forEach(event => calendarApi.addEvent(event))
        })

        if (esInstances.length === 0) {
          this.calendarApi.setOption('noEventsContent', {html: '<div>No events to display</div>'})
        }
      },
    },

    methods: {
      updateCalendarBasedOnPersistedStateChange(newContent = {}) {
        if(!this.calendarApi) {
          setTimeout(() => this.updateCalendarBasedOnPersistedStateChange(newContent),100)
        } else {
          this.calendarApi.gotoDate(newContent.initialDate ? newContent.initialDate : this.initialDate )
          this.calendarApi.changeView(newContent.activeView ? newContent.activeView : this.calendarOptions.initialView )
        }
      },
      
      updatePersistedStateBasedOnCalendarChange() {
        const activeView = this.calendarApi.view.type
        const currentDate = this.calendarApi.getDate()
        const newState = { }
        if(JSON.stringify(currentDate) != JSON.stringify(this.initialDate)) newState.initialDate = `${currentDate.getFullYear()}-${("0" + (currentDate.getMonth() + 1)).slice(-2)}-01`
        if(activeView != this.calendarOptions.initialView) newState.activeView = activeView
        if(newState.initialDate || newState.activeView ) this.statePersistence.content = newState
      },

      buildCalendarEvents(instances) {
        return instances
            .map(esInstance => {
              const startDateField        = esInstance["START DATE FIELD"]
              const endDateField          = esInstance["END DATE FIELD"]
              const descriptionEventField = esInstance["DESCRIPTION FIELD"]
              const stateField            = esInstance["STATE FIELD"]

              const title = esInstance[descriptionEventField] || [esInstance.id]
              const startDate = new Date(parseInt(esInstance[startDateField][0], 10))
              const endDate = endDateField ? new Date(parseInt(esInstance[endDateField][0], 10)) : null

              let color
              if(stateField && stateField.startsWith("#")) {
                color = stateField
              } else if(!stateField || !esInstance[stateField]) {
                color = DEFAULT_EVENT_COLOR
              } else {
                color = this.textToRGB(esInstance[stateField][0])
              }

              return {
                id: `calendar-event-${esInstance.id}`,
                title: title[0] + (title.length > 1 ? `(${title.length})` : ''),
                start: startDate,
                end: endDate,
                allDay: false,
                backgroundColor: color,

                // from: https://fullcalendar.io/docs/event-object
                // In addition to the fields above, you may also include your own non-standard fields in each Event object.
                // FullCalendar will not modify or delete these fields. For example, developers often include a description
                // field for use in callbacks like event render hooks. Any non-standard properites are moved into the
                // extendedProps hash during event parsing.
                esInstance,
              }
            })
      },

      buildTooltipInstance(el, esInstance, listViewActive) {
        const calendarApi = this.$refs.fullCalendar.getApi()

        return tippy(el, {
          content: new Vue(Object.assign({propsData: {esInstance}}, Instance)).$mount().$el,
          allowHTML: true,
          delay: 100,
          duration: 0,
          placement: listViewActive ? 'right' : 'top',
          interactive: true,
          trigger: 'click',
          offset: [0, 10],
          onShown: () => {
            this.lazyCalendarConfigurer(calendarApi, false)
          },
          onHidden: () => {
            this.lazyCalendarConfigurer(calendarApi, this.allowCreateInstances)
          },
          onDestroy: () => {
            this.lazyCalendarConfigurer(calendarApi, this.allowCreateInstances)
          },
        })
      },

      redirectToNewInstance(dateInfo) {
        if (dateInfo.jsEvent.target.classList.contains("js-instance-label")) {
          // It's not a create operation, the user clicked in the instance label in the tooltip
          return
        }

        const fields = []
        // Since we need to choose only 1 set of fields use the first source spec (eventSources[0]) 
        fields.push({fieldDefinition: {name: this.eventSources[0]['DateStartEventField']}, value: dateInfo.start.getTime()})

        if (this.eventSources[0]['DateEndEventField']) {
          fields.push({fieldDefinition: {name: this.eventSources[0]['DateEndEventField']}, value: dateInfo.end.getTime()})
        }

        cob.app.navigateTo('#/instance/create/' + this.createDefinitionId + '/data=' + JSON.stringify({
          opts: {'auto-paste-if-empty': true},
          fields,
        }));
      },

      textToRGB: function(text) {
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
          hash = text.charCodeAt(i) + ((hash << 2) - hash)
        }
        hash = hash & 0x00FFFFFF

        // Escurece em caso de côr demasiado clara
        let red = (hash & 0x00FF0000) >> 16
        let green = (hash & 0x0000FF00) >> 8
        let blue = (hash & 0x000000FF)

        while (red + green + blue > 382) {
          red = red >= 10 ? red - 10 : red
          green = green >= 10 ? green - 10 : green
          blue = blue >= 10 ? blue - 10 : blue
        }

        let color = ((red << 16) + (green << 8) + blue).toString(16).toUpperCase();
        return `#${'00000'.substring(0, 6 - color.length) + color}`
      },
    }
  }
</script>

<style lang='css'>
  .fc .fc-toolbar.fc-header-toolbar {
    align-items: flex-end;
    font-size: 0.8rem;
  }

  .fc .fc-toolbar.fc-header-toolbar .fc-toolbar-chunk:first-child button:not(:first-child) {
    background-color: #fff;
    border-color: #fff;
    border-radius: 50%;
    color: #000;
    font-weight: 700;
  }

  .fc .fc-daygrid .fc-event,
  .fc .fc-list-table a,
  .fc .fc-popover .fc-event-title {
    cursor: pointer;
  }

  .fc .fc-daygrid-day-top {
    margin-bottom: 5px;
    justify-content: center;
    font-size: 0.8rem;
  }

  .fc .fc-daygrid-more-link {
    top: 10px;
    font-weight: 600;
  }

  .calendar-tooltip a {
    /* calendar component when in list mode is overriding the color */
    color: #3399CC !important;
  }

  .calendar-tooltip .main-info:hover {
    text-decoration: underline;
  }

  /* FIX para quando fazemos back de uma instância e temos o width errado */
  .fc-col-header, .fc-scrollgrid-sync-table, .fc-daygrid-body {
      width: 100% !important
  }

</style>