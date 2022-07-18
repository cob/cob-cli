<template>
  <div :class="['relative', classes]">
    <Waiting :waiting="showWaiting"/>
    <div>
      <div class="mb-4 text-center text-4xl">{{ monthTitle }} {{ yearTitle }}</div>
      <FullCalendar ref="fullCalendar" :options="calendarOptions"/>
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
import {toEsFieldName} from "@cob/rest-api-wrapper/src/utils/ESHelper";
import rmListDefinitions from "@cob/rest-api-wrapper/src/rmListDefinitions";

const DEFAULT_EVENT_COLOR = "#0e7bbe"
const MAX_VISIBLE_DAY_EVENTS = 3

export default {
  components: {
    FullCalendar,
    Waiting,
  },

  props: {component: Object},

  data: () => ({
    showWaiting: false,

    definitionId: null,

    monthTitle: null,
    yearTitle: null,

    dateRange: null, // array: [initDate, endDate]
    dashInfo: null, // Object, the result of new DashInfo(...)

    calendarOptions: {
      plugins: [dayGridPlugin, interactionPlugin, listPlugin],
      locales: allLocales,
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
      height: "auto",
      contentHeight: "auto",
      aspectRatio: 2,
      validRange: {
        start: '2017-01-01'
      }
    }
  }),

  computed: {

    // Customizations component model
    options() { return this.component['CalendarCustomize'][0] },
    classes() { return this.options['CalendarClasses'] || "p-4" },
    inputVarCalendar() { return this.options['InputVarCalendar'] || [] },
    outputVar()   { return this.options['OutputVarCalendar'] || "" },
    allowCreateInstances() { return this.options['AllowCreateInstances'] === "TRUE" || false},
    dayMaxEvents() {
      try {
        return parseInt(this.options['MaxVisibleDayEvents'], 10) || MAX_VISIBLE_DAY_EVENTS
      } catch (e) {
        return MAX_VISIBLE_DAY_EVENTS
      }
    },

    // Calendar component model
    definition() { return this.component['Definition'] },
    descriptionEventField() { return toEsFieldName(this.component['DescriptionEventField']) },
    startDateField() { return toEsFieldName(this.component['DateStartEventField']) },
    endDateField() { return toEsFieldName(this.component['DateEndEventField']) },
    stateField() { return toEsFieldName(this.component['StateEventField']) },
    eventsQuery() { return this.component['EventsQuery'] || "*" },

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
      const finalQuery = `${baseQuery} ${[...inputVars].map(inputVar => this.component.vars[inputVar]).join(" ")}`.trim()

      console.debug("[dash][Calendar] query:", finalQuery)
      return finalQuery
    },
    events() {
      if (!this.dashInfo) return []
      if (!this.dashInfo.results) return []
      if (!this.dashInfo.results.value) return []

      return this.dashInfo.results.value
          .filter(event => {
            const title = event[this.descriptionEventField] || [event.id]
            const date = event[this.startDateField]

            return !!(title && date)
          })
          .map(event => {
            const title = event[this.descriptionEventField] || [event.id]
            const startDate = new Date(parseInt(event[this.startDateField][0], 10))
            const endDate = this.endDateField ? new Date(parseInt(event[this.startDateField][0], 10)) : null

            return {
              id: event.id,
              url: `/recordm/#/instance/${event.id}`,
              title: title[0] + (title.length > 1 ? `(${title.length})` : ""),
              start: startDate,
              end: endDate,
              allDay: true,
              backgroundColor: this.stateField ? this.textToRGB(event[this.stateField][0]) : DEFAULT_EVENT_COLOR,
            }
          })
    },
  },

  watch: {
    events: function(newEvents) {
      const calendarApi = this.$refs.fullCalendar.getApi()

      calendarApi.batchRendering(() => {
        calendarApi.getEvents().forEach(event => event.remove())
        newEvents.forEach(event => calendarApi.addEvent(event))
      })

      this.showWaiting = false
    },
    query: function(newQuery) {
      if (!newQuery) return

      if (!this.dashInfo) {
        console.debug("[dash][Calendar] New dashInfo created")
        this.dashInfo = dashFunctions.instancesList(this.definition, this.query, 2000, 0, {validity: 30})

      } else {
        this.showWaiting = true

        console.debug("[dash][Calendar] Updating dash info query")
        this.dashInfo.changeArgs({query: newQuery})
      }
    }
  },

  async mounted() {

    // Get the definition id to allow instance creation
    const definitions = await rmListDefinitions({name: this.definition, includeDisabled: true})
    if (!definitions.length) {
      cob.ui.notification.showError(`Unable to find definition ${this.definition}`)
      return null
    }
    this.definitionId = definitions[0].id


    // Finish calendar configuration
    const calendarApi = this.$refs.fullCalendar.getApi()

    const lazyEventsLoader = debounce((dateInfo) => this.updateDateRange(dateInfo), 300)
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
    calendarApi.setOption('select', (dateInfo) => {this.createNewEvent(dateInfo)})
  },

  beforeDestroy() {
    if (this.dashInfo) {
      this.dashInfo.stopUpdates()
    }
  },

  methods: {
    updateDateRange(dateInfo) {
      this.showWaiting = true
      this.dateRange = [dateInfo.start, dateInfo.end]
      this.$set(this.component.vars, this.outputVar, this.dateRangeQuery)
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
      return `#${"00000".substring(0, 6 - color.length) + color}`
    },
    createNewEvent(dateInfo) {
      const fields = []
      fields.push({fieldDefinition: {name: this.component['DateStartEventField']}, value: dateInfo.start.getTime()})

      if (this.component['DateEndEventField']) {
        fields.push({fieldDefinition: {name: this.component['DateEndEventField']}, value: dateInfo.end.getTime()})
      }

      cob.app.navigateTo("/recordm/index.html#/instance/create/" + this.definitionId + "/data=" + JSON.stringify({
        opts: {'auto-paste-if-empty': true},
        fields,
      }));
    }
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

.fc .fc-daygrid-day-top {
  margin-bottom: 5px;
  justify-content: center;
  font-size: 0.8rem;
}

.fc .fc-daygrid-more-link {
  top: 10px;
  font-weight: 600;
}

</style>