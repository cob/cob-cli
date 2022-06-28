<template>
    <a v-if="state" :href="link" :class="expandedClasses">

        <Attention :attentionInfo="attention" :classes="attentionClasses" />

        <span v-html="value"/><span class="" >{{unit}}</span>

        <svg v-if="updating" class="absolute animate-spin -top-1 -right-1 h-2 w-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    </a>
</template>

<script>
    import Attention from './Attention.vue'
    const specialClasses = {
        "Info":      "border border-sky-600 bg-sky-200/10 ring-sky-600 ",
        "Success":   "border border-lime-500 bg-lime-200/10 ring-lime-500 ",
        "Warning":   "border border-amber-500 bg-amber-200/10 ring-amber-500 ",
        "Important": "border border-rose-600 bg-rose-200/10 ring-rose-600 ",
        "Gray":      "text-gray-400 border-gray-200 bg-gray-200/10 ring-gray-200 ",
        "Default":   "inline-block "                                                    // para poder conter internamente o Attention sem ser noutra linha
                    +"whitespace-nowrap "                                               // Para não partir o texto + attention
                    +"font-mono font-semibold "                                         // Estilo default para o texto
                    +"px-2 py-1 "                                                       // Espaçamento horizontal e vertical
                    +"rounded-md "                                                      // Border arrendondada
                    +"transition ease-in-out ring-sky-600 ring-offset-1 hover:ring-2 ", // Estilo para hover (só funciona em localhost, não sei porquê)
        "S_loading": "border border-amber-500 bg-amber-200/10 ring-amber-500 ",         // Igual a Warning
        "S_error":   "border border-rose-600 bg-rose-200/10 ring-rose-600 ",            // Igual a Important
    }

    export default {
        components: { Attention },
        props: { valueData: Object },
        computed: {
            options()          { return this.valueData['ValueCustomize'][0] },
            view()             { return this.options['View'] },
            attention()        { return this.options['AttentionInfo'] },
            attentionClasses() { return this.options['AttentionClasses'] },
            unit()             { return this.options['Unit'] },
            state()            { return this.valueData.dash_info && this.valueData.dash_info.state || "" },
            updating()         { return this.state == "updating" || this.state == "loading" },
            classes()          { return (this.options['ValueClasses'] || "Default Info") + " S_"+this.valueData.dash_info.state },
            link()             { return this.valueData.dash_info.href + (this.view ? "?&av=" + this.view : "") },
            expandedClasses()  { return this.classes.split(/\s/).map(c => specialClasses[c] || c ).join(" ") },
            value() {
                if(this.valueData.dash_info.state == "loading") return "L"
                if(this.valueData.dash_info.state == "error") return "E"
                if(isNaN(this.valueData.dash_info.value)) {
                    return this.valueData.dash_info.value
                } else {
                    return new Intl.NumberFormat('en-US', {maximumFractionDigits: 0}).format(this.valueData.dash_info.value) 
                }
            }
        }
    }
</script>