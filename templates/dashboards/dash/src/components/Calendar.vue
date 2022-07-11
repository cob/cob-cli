<template>
  <FullCalendar ref="fullCalendar" :options="calendarOptions"/>
</template>

<script>
import '@fullcalendar/core/vdom'
import FullCalendar from '@fullcalendar/vue'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import * as dashFunctions from '@cob/dashboard-info';

export default {
  components: {
    FullCalendar
  },
  props: {component: Object},
  data() {
    return {
      calendarInfo: {},
      calendarOptions: {
        plugins: [dayGridPlugin, interactionPlugin, listPlugin],
        initialView: 'dayGridMonth',
        headerToolbar: {
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,listMonth'
        },
        buttonText: {
          today: 'Today',
          month: 'Month',
          week: 'Week',
          day: 'Day',
          list: 'List',
        },
        aspectRatio: 2,
      }
    }
  },
  computed: {
    stateLoaded() {
      return this.calendarInfo.results && !this.calendarInfo.results.state
    },
    options() {
      return this.component['CalendarCustomize'][0]
    }
  },
  watch: {
    stateLoaded: function(newValue) {
      if (!newValue) return
      const calendarApi = this.$refs.fullCalendar.getApi()
      calendarApi.getEvents().forEach(event => event.remove())

      const events = this.calendarInfo.results.value || []
      for (let i = 0; i < events.length; i++) {
        const event = events[i];
        const title = event[this.component['DescriptionEventField']] || ["unknow"]
        const date = event[this.component['DateEventField']]

        if (!title || !date) continue
        calendarApi.addEvent({
          id: event.id,
          url: `/recordm/#/instance/${event.id}`,
          title: title[0] + (title.length > 1 ? `(${title.length})` : ""),
          start: new Date(parseInt(date[0])),
          allDay: true,
          backgroundColor: this.component['StateEventField'] && event[this.component['StateEventField']] ? this.textToRGB(event[this.component['StateEventField']][0]) : "#0e7bbe",
        })
      }
    },
    'component.vars': {
      handler() {
        this.queryEvents()
      },
      deep: true
    }
  },
  mounted() {
    this.loadEvents()
  },
  methods: {
    getQuery() {
      const baseQuery = this.component['EventsQuery'] || ""
      const options = this.component['CalendarCustomize'][0]
      const inputVars = new Set(options['InputVarCalendar'].map(inputVar => inputVar['InputVarCalendar']));
      const finalQuery = `${baseQuery} ${[...inputVars].map(inputVar => this.component.vars[inputVar]).join(" ")}`.trim()
      return finalQuery ? finalQuery : "*"
    },
    loadEvents: function() {
      let query = this.getQuery()
      this.calendarInfo = dashFunctions.instancesList(this.component['Definition'], query, 255, 0, {validity: 30})
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