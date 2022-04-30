<template>
    <table class="w-full table-auto">
        <thead v-if="headers.length > 0">
            <tr class="uppercase text-xs text-slate-700 tracking-wider underline underline-offset-4">
                <td :class="'py-2 ' + headers_style">{{ headers[0] }}</td>
                <td v-for="header in headers.slice(1)" :key="header"
                    :class="'py-2 text-right ' + headers_style">{{ header }}</td>
            </tr>
        </thead>
        <tbody>
            <tr v-for="(line, i) in lines" :key="'line'+i"
                class="text-slate-700">
                <td :class="'py-2 ' + line.style">{{ line.name }}</td>
                <td v-for="(value, j) in line.values" :key="'value'+j"
                    class="py-2 text-right">
                    <TotalsValue :value-data="value" />
                </td>
            </tr>
        </tbody>
    </table>
</template>

<script>
import TotalsValue from './TotalsValue.vue'
export default {
    components: { TotalsValue },
    props: { componentData: Object },
    computed: {
        headers() { 
            return this.componentData['Header'][0]['Text'].filter(x => !!x).map(h => h['Text']) 
        },
        headers_style() { 
            return this.componentData['Header'][0]['Style Header'] 
        },
        lines() { 
            return this.componentData['Line'].map( l => ({
                name : l['Line'],
                style : l['Style Line'],
                values: l['Value']
            }))
        },
        valuesGridClass() {
            const dynamicClasses = {
                1: "grid-cols-1",
                2: "grid-cols-2",
                3: "grid-cols-3",
                4: "grid-cols-4",
                5: "grid-cols-5",
                6: "grid-cols-6",
                7: "grid-cols-7",
                8: "grid-cols-8",
                9: "grid-cols-9",
                10: "grid-cols-10",
                11: "grid-cols-11",
                12: "grid-cols-12",
                none: "grid-cols-none"
            }
            // Grid with cols == amount of values
            return "grid " + dynamicClasses[this.lines[0].values.length]
        }
    }
}
</script>
