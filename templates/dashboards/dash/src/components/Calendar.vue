<template>
  <div class="relative">
    <div class="absolute"></div>
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
import * as dashFunctions from '@cob/dashboard-info';

const DEFAULT_EVENT_COLOR = "#0e7bbe"
const MAX_VISIBLE_DAY_EVENTS = 3

export default {
  components: {
    FullCalendar
  },

  props: {component: Object},

  data: () => ({
    monthTitle: null,
    yearTitle: null,

    dateRange: null, // array: [initDate, endDate]
    dashInfo: null, // Object, the result of new DashInfo(...)

    calendarOptions: {
      plugins: [dayGridPlugin, interactionPlugin, listPlugin],
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
    dashResults() {
      if (!this.dashInfo) return []
      if (!this.dashInfo.results) return []
      return this.dashInfo.results.value || []
    },
    options() {
      return this.component['CalendarCustomize'][0]
    },
    query() {
      if (!this.dateRange) return ""

      let dateRangeQuery = `${this.component['DateStartEventField']}:[${this.dateRange[0].getTime()} TO ${this.dateRange[1].getTime()}]`
      if(this.component['DateEndEventField']){
        dateRangeQuery += ` OR ${this.component['DateEndEventField']}:[${this.dateRange[0].getTime()} TO ${this.dateRange[1].getTime()}]`
      }

      const baseQuery = `${this.component['EventsQuery'] || "*"} AND (${dateRangeQuery})`
      const inputVars = new Set(this.options['InputVarCalendar'].map(inputVar => inputVar['InputVarCalendar']));
      const finalQuery = `${baseQuery}  ${[...inputVars].map(inputVar => this.component.vars[inputVar]).join(" ")}`.trim()

      console.debug("[dash][Calendar] query:", finalQuery)
      return finalQuery

    },
    events() {
      return this.dashResults
          .filter(event => {
            const title = event[this.component['DescriptionEventField']] || [event.id]
            const date = event[this.component['DateStartEventField']]

            return !!(title && date)
          })
          .map(event => {
            const title = event[this.component['DescriptionEventField']] || [event.id]
            const date = event[this.component['DateStartEventField']]

            return {
              id: event.id,
              url: `/recordm/#/instance/${event.id}`,
              title: title[0] + (title.length > 1 ? `(${title.length})` : ""),
              start: new Date(parseInt(date[0])),
              allDay: true,
              backgroundColor: this.component['StateEventField'] && event[this.component['StateEventField']]
                               ? this.textToRGB(event[this.component['StateEventField']][0])
                               : DEFAULT_EVENT_COLOR,
            }
          })
    }
  },

  watch: {
    events: function(newEvents) {
      const calendarApi = this.$refs.fullCalendar.getApi()
      calendarApi.batchRendering(() => {
        calendarApi.getEvents().forEach(event => event.remove())
        newEvents.forEach(event => calendarApi.addEvent(event))
      })
    },
    query: function(newQuery) {
      if (!newQuery) return

      if (!this.dashInfo) {
        console.debug("[dash][Calendar] New dashInfo created")
        this.dashInfo = dashFunctions.instancesList(this.component['Definition'], this.query, 2000, 0, {validity: 30})

      } else {
        console.debug("[dash][Calendar] Updating dash info query")
        this.dashInfo.changeArgs({query: newQuery})
      }
    },
    'component.vars': {
      handler() {
        console.log("new input vars")
      },
      deep: true
    }
  },

  mounted() {
    const calendarApi = this.$refs.fullCalendar.getApi()
    calendarApi.setOption('datesSet', (dateInfo) => {
      this.updateDateRange(dateInfo)
    })
    calendarApi.setOption('locale', this.getLocale())

    const dayMaxEvents = this.options['MaxVisibleDayEvents'] || MAX_VISIBLE_DAY_EVENTS
    calendarApi.setOption('dayMaxEvents', dayMaxEvents === -1 ? false : parseInt(dayMaxEvents, 10))
  },

  beforeDestroy() {
    if (this.dashInfo) {
      this.dashInfo.stopUpdates()
    }
  },

  methods: {
    updateDateRange(dateInfo) {
      const calendarApi = this.$refs.fullCalendar.getApi()

      calendarApi.batchRendering(() => {
        calendarApi.getEvents().forEach(event => event.remove())
      })

      const currentDate = calendarApi.getDate()
      this.monthTitle = currentDate.toLocaleString('default', { month: 'long' });
      this.yearTitle = currentDate.getFullYear()

      this.dateRange = [dateInfo.start, dateInfo.end]
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