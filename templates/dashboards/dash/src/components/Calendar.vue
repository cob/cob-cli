<template>
  <div :class='["relative", classes]'>

    <Waiting :waiting='showWaiting'/>

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
import * as dashFunctions from '@cob/dashboard-info';
import Waiting from './shared/Waiting.vue'
import debounce from 'lodash.debounce';
import {toEsFieldName} from '@cob/rest-api-wrapper/src/utils/ESHelper';
import rmListDefinitions from '@cob/rest-api-wrapper/src/rmListDefinitions';
import tippy from 'tippy.js';
import Instance from "@/components/shared/Instance";
import Vue from "vue";
import {getValue} from "@/utils/EsInstanceUtils";
import DashboardComponentState from "@/model/DashboardComponentState";

const DEFAULT_EVENT_COLOR = '#0e7bbe'
const MAX_VISIBLE_DAY_EVENTS = 3

export default {
  components: {
    FullCalendar,
    Waiting,
  },

  props: {
    component: Object
  },

  data: () => ({
    showWaiting: false,

    dashInfo: null, // Object, the result of new DashInfo(...)
    definitionId: null,

    monthTitle: null,
    yearTitle: null,
    dateRange: null, // array: [initDate, endDate]

    calendarOptions: {
      plugins: [dayGridPlugin, interactionPlugin, listPlugin],
      timeZone: 'UTC',
      locales: allLocales,
      // Take in consideration updating the initial state value of `activeView` if you change this value
      initialView: 'dayGridMonth',
      headerToolbar: {
        left: 'today prev next',
        center: '',
        right: 'dayGridMonth,listMonth'
      },
      buttonText: {
        today: 'Today',
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
    calendarApi: null,

    // Need the debouncer to delay the change of the calendar option to make a day selectable because it's impossible
    // to know if there is a tooltip open.
    lazyCalendarConfigurer: debounce((calendarApi, enable) => calendarApi.setOption('selectable', enable), 500),
    hashState: Object,
  }),

  computed: {
    // Customizations component model
    options() { return this.component['CalendarCustomize'][0] },
    classes() { return this.options['CalendarClasses'] || 'p-4' },
    inputVarCalendar() { return this.options['InputVarCalendar'] || [] },
    allowCreateInstances() { return this.options['AllowCreateInstances'] === 'TRUE' || false},
    outputVar() { return this.options['OutputVarCalendar'] || '' },
    dayMaxEvents() {
      try {
        return parseInt(this.options['MaxVisibleDayEvents'], 10) || MAX_VISIBLE_DAY_EVENTS
      } catch (e) {
        return MAX_VISIBLE_DAY_EVENTS
      }
    },

    // Calendar component model
    definitionName() { return this.component['Definition'] },
    descriptionEventField() { return toEsFieldName(this.component['DescriptionEventField']) },
    startDateField() { return toEsFieldName(this.component['DateStartEventField']) },
    endDateField() { return toEsFieldName(this.component['DateEndEventField']) },
    stateField() { return toEsFieldName(this.component['StateEventField']) },
    eventsQuery() { return this.component['EventsQuery'] || '*' },

    dateRangeQuery() {
      if (!this.dateRange) return null

      let dateRangeQuery = `${this.startDateField}:[${this.dateRange[0].getTime()} TO ${this.dateRange[1].getTime()}]`
      if (this.endDateField) {
        dateRangeQuery += ` OR ${this.endDateField}:[${this.dateRange[0].getTime()} TO ${this.dateRange[1].getTime()}]`
      }

      return dateRangeQuery
    },
    query() {
      if (!this.dateRangeQuery) return null

      const baseQuery = `${this.eventsQuery} AND (${this.dateRangeQuery})`
      const inputVars = new Set(this.inputVarCalendar.map(inputVar => inputVar['InputVarCalendar']));
      const finalQuery = `${baseQuery} ${[...inputVars].map(inputVar => this.component.vars[inputVar]).join(' ')}`.trim()

      console.debug('[dash][Calendar] query:', finalQuery)
      return finalQuery
    },
    dashInfoResults() {
      if (!this.dashInfo) return []
      if (!this.dashInfo.results) return []
      if (!this.dashInfo.results.value) return []

      return this.dashInfo.results.value
    }
  },

  async mounted() {
    // Get the definition id to allow instance creation
    const definitions = await rmListDefinitions({name: this.definitionName, includeDisabled: true})
    if (!definitions.length) {
      cob.ui.notification.showError(`Unable to find definition ${this.definition}`)
      return null
    }
    this.definitionId = definitions[0].id


    // Finish calendar configuration
    const calendarApi = this.$refs.fullCalendar.getApi()
    this.calendarApi = calendarApi

    const lazyEventsLoader = debounce((dateInfo) => {
      this.updateStateFromComponent(dateInfo)
      this.updateDateRange(dateInfo)
    }, 900)

    this.initialDate = calendarApi.getDate()

    calendarApi.setOption('datesSet', (dateInfo) => {
      // Reflect immediately the change in the title
      const currentDate = calendarApi.getDate()
      this.monthTitle = currentDate.toLocaleString('default', {month: 'long'});
      this.yearTitle = currentDate.getFullYear()

      // leave for later the events loading
      lazyEventsLoader(dateInfo)
    })

    calendarApi.setOption('dayMaxEvents', this.dayMaxEvents === -1 ? false : this.dayMaxEvents)
    calendarApi.setOption('locale', this.getLocale())
    calendarApi.setOption('selectMinDistance', !this.endDateField ? 1 : 0) //only allow to select on day if no end date field is available
    calendarApi.setOption('selectable', this.allowCreateInstances)
    calendarApi.setOption('select', this.redirectToNewInstance)
    calendarApi.setOption('viewDidMount', this.updateStateFromComponent)

    calendarApi.setOption('eventClick', (eventClickInfo) => {
      // Check if there is already a tooltip instance associated to the element
      // if not let's create one,
      if (!eventClickInfo.el._tippy) {

        // When list view is active I have to look for a different tooltip anchor
        let listViewActive = this.isListViewActive(eventClickInfo.view);
        const element = listViewActive
                        ? eventClickInfo.el.getElementsByClassName('fc-list-event-title')[0].children[0]
                        : eventClickInfo.el

        // tippy will handle hide and show of existing tooltips. We just need to trigger the show
        this.buildTooltipInstance(element, eventClickInfo.event.extendedProps.esInstance, listViewActive).show()
      }
    })
    this.hashState = new DashboardComponentState(this.component.id, this.updateComponentFromState)
  },

  beforeDestroy() {
    this.hashState.stop()
    if (this.dashInfo) {
      this.dashInfo.stopUpdates()
    }
  },

  watch: {
    query: function(newQuery) {
      if (!newQuery) return

      this.showWaiting = true
      this.calendarApi.setOption('noEventsContent', {html: '<div>&nbsp;</div>'})

      if (!this.dashInfo) {
        console.debug('[dash][Calendar] New dashInfo created')
        this.dashInfo = dashFunctions.instancesList(this.definitionName, this.query, 2000, 0, {validity: 30})

      } else {
        console.debug('[dash][Calendar] Updating dash info query')
        this.dashInfo.changeArgs({query: newQuery})
      }
    },
    dashInfoResults: function(esInstances) {
      const newCalendarEvents = this.buildCalendarEvents(esInstances)

      const calendarApi = this.$refs.fullCalendar.getApi()
      calendarApi.batchRendering(() => {
        calendarApi.getEvents().forEach(event => event.remove())
        newCalendarEvents.forEach(event => calendarApi.addEvent(event))
      })

      if (this.dashInfo.currentState !== 'loading') {
        // Only hide the show waiting component if we have passed the initial state of the dash info.
        this.showWaiting = false

        if (esInstances.length === 0) {
          this.calendarApi.setOption('noEventsContent', {html: '<div>No events to display</div>'})
        }
      }
    },
  },

  methods: {
    updateComponentFromState(newContent) {
      if (this.calendarApi && newContent) {
        console.debug('[dash][Calendar] Loaded new hashState for component', this.component.id, newContent)
        this.calendarApi.gotoDate(newContent.initialDate ? newContent.initialDate : this.initialDate )
        this.calendarApi.changeView(newContent.activeView ? newContent.activeView : this.calendarOptions.initialView )
      }
    },
    updateStateFromComponent() {
      const activeView = this.calendarApi.view.type
      const currentDate = this.calendarApi.getDate()
      const newState = { }
      if(JSON.stringify(currentDate) != JSON.stringify(this.initialDate)) newState.initialDate = `${currentDate.getFullYear()}-${("0" + (currentDate.getMonth() + 1)).slice(-2)}-01`
      if(activeView != this.calendarOptions.initialView) newState.activeView = activeView
      if(newState.initialDate || newState.activeView ) this.hashState.content = newState
    },
    updateDateRange(dateInfo) {
      if (this.dateRange
          && this.dateRange[0].getTime() <= dateInfo.start.getTime()
          && this.dateRange[1].getTime() >= dateInfo.end.getTime()) {
        // We are in two conditions
        // 1. The period is a subset of the last date range
        // 2. The date range hasn't changed
        // We don't need to do any query. We already have all the events that we need
        return
      }

      this.showWaiting = true
      this.dateRange = [dateInfo.start, dateInfo.end]
      if (this.outputVar) this.$set(this.component.vars, this.outputVar, this.dateRangeQuery)
    },
    isListViewActive(view) {
      return view.type.match(/list.*/)
    },
    getLocale() {
      if (navigator.languages !== undefined) return navigator.languages[0];
      return navigator.language;
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
    redirectToNewInstance(dateInfo) {
      if (dateInfo.jsEvent.target.classList.contains("js-instance-label")) {
        // It's not a create operation but the user cliecked in the instance label in the tooltip
        return
      }

      const fields = []
      fields.push({fieldDefinition: {name: this.component['DateStartEventField']}, value: dateInfo.start.getTime()})

      if (this.component['DateEndEventField']) {
        fields.push({fieldDefinition: {name: this.component['DateEndEventField']}, value: dateInfo.end.getTime()})
      }

      cob.app.navigateTo('#/instance/create/' + this.definitionId + '/data=' + JSON.stringify({
        opts: {'auto-paste-if-empty': true},
        fields,
      }));
    },

    buildCalendarEvents(instances) {
      return instances
          .map(esInstance => {
            const title = getValue(esInstance, {name: this.descriptionEventField}) || [esInstance.id]
            const startDate = new Date(parseInt(esInstance[this.startDateField][0], 10))
            const endDate = this.endDateField ? new Date(parseInt(esInstance[this.startDateField][0], 10)) : null

            return {
              id: `calendar-event-${esInstance.id}`,
              title: title[0] + (title.length > 1 ? `(${title.length})` : ''),
              start: startDate,
              end: endDate,
              allDay: true,
              backgroundColor: this.stateField && esInstance[this.stateField] ? this.textToRGB(esInstance[this.stateField][0]) : DEFAULT_EVENT_COLOR,

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

</style>