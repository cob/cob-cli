<template>
    <div>
        <a :href="badgeData.dash_info.href" :class="valueClass">

            <i v-if="badgeData.dash_info.isLink" :class="value"></i>
            <span v-else>{{ value }}</span>
        </a>
    </div>
</template>

<script>

export default {
    props: {
        badgeData: Object
    },
    computed: {
        value() {
            if(this.badgeData.dash_info.state == "loading") return "L"
            if(this.badgeData.dash_info.state == "error") return "E"
            return this.badgeData.dash_info.value
        },
        
        valueClass() {
            let c = "px-2 py-1 rounded-md text-center font-mono font-semibold transition border ring-offset-1 hover:ring-2"

            const lookup = {
                "Info":      "text-sky-600 border-sky-600 bg-sky-200/10 ring-sky-600",
                "Success":   "text-lime-500  border-lime-500 bg-lime-200/10 ring-lime-500",
                "Warning":   "text-amber-500 border-amber-500 bg-amber-200/10 ring-amber-500",
                "Important": "text-rose-600  border-rose-600 bg-rose-200/10 ring-rose-600",

                "Gray":       "text-gray-400 border-gray-200 bg-gray-200/10 ring-gray-200",
                "Fallback":   "text-slate-700 ring-slate-700",
            }

            if(this.badgeData.dash_info.state == "loading") return c + " " + lookup["Warning"]
            if(this.badgeData.dash_info.state == "error") return c + " " + lookup["Important"]

            if(this.badgeData.dash_info.state == "cache")
                c += " after:content-['.'] after:text-gray-400 after:text-xs pr-0.5"

            return c + " " + (this.badgeData.dash_info.value == 0 ? lookup["Gray"] : lookup[this.badgeData.style] ? lookup[this.badgeData.style] : lookup["Fallback"])
        }
    }
}
</script>
