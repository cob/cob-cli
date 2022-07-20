<template>
  <div :class='["relative", classes]'>

    <Waiting :waiting='showWaiting'/>

    <!--
      Have to pre generate all the tooltips so that I can link with the tootlip target elements.
      Alternatives would be to move this to a function but that will cause more work on update since
      we would need to recalculate all tooltips
     -->
    <div class='tooltips hidden'>
      <div v-for='event in events' :id='getTooltipId(event.id)'>
        <div class='flex flex-col p-4 rounded border-2 border-zinc-300 bg-zinc-50 text-sm calendar-tooltip'>
          <a :href='event.url'
             class='mb-4 text-sky-500 uppercase no-underline hover:underline js-instance-label main-info'>{{
              event.instanceLabel
            }}</a>
          <div class='details flex flex-col flex-wrap justify-start'>
            <div v-for='description in event.instanceDescriptions' class='flex flex-row mr-4 field-group max-w-xs'>
              <div class='whitespace-nowrap mr-1 text-gray-400 field'>{{ description.name }}:</div>
              <div class='whitespace-nowrap text-ellipsis overflow-hidden value'>{{ description.value }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

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
import tippy, {createSingleton} from 'tippy.js';

const DEFAULT_EVENT_COLOR = '#0e7bbe'
const MAX_VISIBLE_DAY_EVENTS = 3

export default {
  components: {
    FullCalendar,
    Waiting,
  },

  props: {component: Object},

  data: () => ({
    showWaiting: false,

    allowTooltipHover: false,
    tooltipInstances: null,
    activeTooltip: null,

    dashInfo: null, // Object, the result of new DashInfo(...)
    definitionId: null,

    monthTitle: null,
    yearTitle: null,
    activeView: 'dayGridMonth',
    dateRange: null, // array: [initDate, endDate]

    calendarOptions: {
      plugins: [dayGridPlugin, interactionPlugin, listPlugin],
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
        start: '2017-01-01'
      }
    }
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

    isListViewActive() {
      return this.activeView.match(/list.*/)
    },

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
    events() {
      if (!this.dashInfo) return []
      if (!this.dashInfo.results) return []
      if (!this.dashInfo.results.value) return []

      return this.dashInfo.results.value
          .map(esInstance => {
            const title = esInstance[this.descriptionEventField] || [esInstance.id]
            const startDate = new Date(parseInt(esInstance[this.startDateField][0], 10))
            const endDate = this.endDateField ? new Date(parseInt(esInstance[this.startDateField][0], 10)) : null

            return {
              id: `calendar-event-${esInstance.id}`,
              url: `/recordm/#/instance/${esInstance.id}`,
              title: title[0] + (title.length > 1 ? `(${title.length})` : ''),
              start: startDate,
              end: endDate,
              allDay: true,
              backgroundColor: this.stateField ? this.textToRGB(esInstance[this.stateField][0]) : DEFAULT_EVENT_COLOR,

              // from: https://fullcalendar.io/docs/event-object
              // In addition to the fields above, you may also include your own non-standard fields in each Event object.
              // FullCalendar will not modify or delete these fields. For example, developers often include a description
              // field for use in callbacks like event render hooks. Any non-standard properites are moved into the
              // extendedProps hash during event parsing.
              instanceLabel: this.getEventInstanceLabel(esInstance),
              instanceDescriptions: this.getEventInstanceDescriptions(esInstance),
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

      this.$nextTick(() => {
        this.updateTooltipInstances()
        this.showWaiting = false
      })

    },
    query: function(newQuery) {
      if (!newQuery) return

      if (!this.dashInfo) {
        console.debug('[dash][Calendar] New dashInfo created')
        this.dashInfo = dashFunctions.instancesList(this.definitionName, this.query, 2000, 0, {validity: 30})

      } else {
        this.showWaiting = true

        console.debug('[dash][Calendar] Updating dash info query')
        this.dashInfo.changeArgs({query: newQuery})
      }
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
    calendarApi.setOption('select', this.createNewEvent)
    calendarApi.setOption('viewDidMount', (viewInfo) => {this.activeView = viewInfo.view.type})

    calendarApi.setOption('eventClick', (eventInfo) => {
      if (eventInfo.jsEvent.target.classList.contains("js-instance-label")) {
        // It's not a selection but the user cliecked in the instance label in the tooltip
        return
      }

      eventInfo.jsEvent.preventDefault()

      if (this.activeTooltip) {
        this.activeTooltip.hide()
      }

      this.tooltipInstances[eventInfo.event.id].show()
    })

    calendarApi.setOption('moreLinkClick', () => {
          // Couldn't find a better way to know when the popup is open, there is no event sent when that happen
          setTimeout(() => this.updateTooltipInstances(), 100)
        }
    )

    calendarApi.setOption('eventDidMount', (eventInfo) => {
      let tooltipHook = eventInfo.el

      // When list view is active I have to look for a different tooltip anchor
      if (this.isListViewActive) {
        tooltipHook = eventInfo.el.getElementsByClassName('fc-list-event-title')[0].children[0]
      }

      tooltipHook.classList.add('js-tooltip-hook')
      tooltipHook.setAttribute('data-event-id', eventInfo.event.id)
    })
  },

  beforeDestroy() {
    this.destroyTooltipInstances()

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
      return `#${'00000'.substring(0, 6 - color.length) + color}`
    },
    createNewEvent(dateInfo) {
      if (dateInfo.jsEvent.target.classList.contains("js-instance-label")) {
        // It's not a create operation but the user cliecked in the instance label in the tooltip
        return
      }

      const fields = []
      fields.push({fieldDefinition: {name: this.component['DateStartEventField']}, value: dateInfo.start.getTime()})

      if (this.component['DateEndEventField']) {
        fields.push({fieldDefinition: {name: this.component['DateEndEventField']}, value: dateInfo.end.getTime()})
      }

      cob.app.navigateTo('/recordm/index.html#/instance/create/' + this.definitionId + '/data=' + JSON.stringify({
        opts: {'auto-paste-if-empty': true},
        fields,
      }));
    },

    getEventInstanceLabel(esInstance) {
      if (!esInstance._definitionInfo.instanceLabel) return esInstance.id
      if (!esInstance._definitionInfo.instanceLabel.length) return esInstance.id

      const fieldDefinitionName = esInstance._definitionInfo.instanceLabel[0].name;
      return esInstance[toEsFieldName(fieldDefinitionName)][0]
    },
    getEventInstanceDescriptions(esInstance) {
      if (!esInstance._definitionInfo.instanceDescription) return null

      return esInstance._definitionInfo.instanceDescription
          .filter(fieldDefinition => esInstance[toEsFieldName(fieldDefinition.name)])
          .map(fieldDefinition => {
            return {
              name: fieldDefinition.name,
              value: esInstance[toEsFieldName(fieldDefinition.name)].join(', ')
            }
          });
    },

    getTooltipId(eventId) {
      return `tooltip-${eventId}`
    },
    updateTooltipInstances() {
      this.destroyTooltipInstances()

      this.tooltipInstances = [...document.querySelectorAll('.js-tooltip-hook[data-event-id]')]
          .reduce((map, el) => {
            const eventId = el.getAttribute('data-event-id')
            const tooltipId = this.getTooltipId(eventId)

            map[eventId] = tippy(el, {
              content: document.getElementById(tooltipId).innerHTML,
              allowHTML: true,
              delay: 100,
              duration: this.allowTooltipHover ? [300, 250] : 0,
              placement: this.isListViewActive ? 'right' : 'top',
              interactive: true,
              trigger: 'manual',
              offset: [0, 10],
              onShow(instance) {
                this.activeTooltip = instance
              }
            })

            return map
          }, {})
    },
    destroyTooltipInstances() {
      let instances = Object.values(this.tooltipInstances || {});
      if (instances.length) {
        instances.forEach(i => i.destroy())
      }
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

.calendar-tooltip a {
  /* calendar component when in list mode is overriding the color */
  color: #3399CC !important;
}

.calendar-tooltip .main-info:hover {
  text-decoration: underline;
}

</style>