<template>
    <i v-if="attentionClasses" :class="attentionClasses" style="line-height: inherit;"></i>
</template>

<script>
    export default {
        props: { 
            attentionInfo: Object,
            classes: String
        },
        computed: {
            inputClasses() { return this.classes || "fa-solid fa-circle pr-1 animate-pulse text-lg align-middle" },
            attentionClasses() {
                let attentionInfo = this.attentionInfo
                if(attentionInfo && attentionInfo.value && attentionInfo.value[0]) {
                    let severity =  attentionInfo.value[0].severity &&  attentionInfo.value[0].severity[0] || 0
                    if (severity == 0) return ""
                    
                    let baseColor = severity > 0 ? "lime" : "red" 
                    let severityAbs = Math.abs(severity)
                    let colorIntensity = severityAbs > 4 ?  500 : severityAbs * 100
                    let valenceColor = baseColor + (colorIntensity ? "-" + colorIntensity: "")
                    return this.inputClasses + " " + "text-" + valenceColor
                } else {
                    return ""
                }
            }
        }
    }
</script>