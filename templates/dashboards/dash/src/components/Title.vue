<template>
    <div class="text-slate-700 uppercase tracking-wider border-b border-b-cobline/50 pb-1 text-xs text-center">
        <span v-html="componentData.title_text"/>
    </div>
</template>

<script>
export default {
    props: {
        componentData: Object
    }
}
</script>
