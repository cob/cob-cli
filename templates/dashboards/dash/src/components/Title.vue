<template>
    <div :class="'text-slate-700 uppercase tracking-wider border-b border-b-cobline/50 pb-1 text-xs text-center ' + style">
        <span v-html="title"/>
    </div>
</template>

<script>
export default {
    props: {
        componentData: Object
    },
    computed: {
        title() { 
            return this.componentData['Title'] 
        },
        style() { 
            return this.componentData['Style Text'] 
        },
    }
}
</script>
