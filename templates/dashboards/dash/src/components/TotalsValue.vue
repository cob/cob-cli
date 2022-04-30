<template>
    <div :class="{'animate-pulse':signalChange}">
        <a :href="valueData.dash_info.href" :class="valueClass" class="relative inline-flex">
            <span v-html="value"/>

            <svg v-if="updating" class="absolute animate-spin -top-1 -right-1 h-2 w-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        </a>
    </div>
</template>

<script>

export default {
    props: {
        valueData: Object
    },
    data () {
      return {
        signalChange: false
      }
    },
    watch: {
      state(newState) {
        if(newState == "ready") {
            this.signalChange = true;
            setTimeout( () => this.signalChange = false,8000)
        }
      }
    },
    computed: {
        updating() {
            return this.valueData.dash_info.state == "updating" || this.valueData.dash_info.state == "loading"
        },
        value() {
            if(this.valueData.dash_info.state == "loading") return "L"
            if(this.valueData.dash_info.state == "error") return "E"
            if(isNaN(this.valueData.dash_info.value)) {
                return this.valueData.dash_info.value
            } else {
                return new Intl.NumberFormat('en-US', {}).format(this.valueData.dash_info.value) 
            }
        },
        state() {
            return this.valueData.dash_info.state
        },
        valueClass() {
            let c = "relative transition ease-in-out px-2 py-1 rounded-md text-center font-mono font-semibold transition border ring-offset-1 hover:ring-2"

            const lookup = {
                "Info":      "text-sky-600 border-sky-600 bg-sky-200/10 ring-sky-600",
                "Success":   "text-lime-500  border-lime-500 bg-lime-200/10 ring-lime-500",
                "Warning":   "text-amber-500 border-amber-500 bg-amber-200/10 ring-amber-500",
                "Important": "text-rose-600  border-rose-600 bg-rose-200/10 ring-rose-600",

                "Gray":       "text-gray-400 border-gray-200 bg-gray-200/10 ring-gray-200",
                "Fallback":   "text-slate-700 ring-slate-700",
            }

            if(this.valueData.dash_info.state == "loading") return c + " " + lookup["Warning"]
            if(this.valueData.dash_info.state == "error") return c + " " + lookup["Important"]

            return c + " " + (this.valueData.dash_info.value == 0 ? lookup["Gray"] : lookup[this.valueData.style] ? lookup[this.valueData.style] : lookup["Fallback"])
        }
    }
}
</script>