<template>
    <div class="flex h-fit pb-0 justify-center items-center">
        <textarea :class="classes" 
            v-model="inputContent" 
            ref="textarea"
            @keyup.enter="applyFilter"
            @focus="resize"
            @keyup="resize"
            :placeholder="placeholder"
        ></textarea>
        <button @click="applyFilter" type="submit" class="max-h-11 p-2.5 ml-2 text-sm font-medium text-white bg-blue-700 rounded-lg border border-blue-700 hover:bg-blue-800">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </button>
    </div>
</template>

<script>
    export default {
        props: { component: Object },
        data: () => ({
            inputContent: "",
            activeFilter: ""
        }),
        created() {
            this.$nextTick(() => {
                this.applyFilter()
                this.resize()
            })
        },
        updated() {
            // Necessário para quando fazemos back para uma página com o inputContent preenchido mas que não está actualizada nas variáveis
            if(this.activeFilter != this.component.vars[this.outputVar]) {
                this.applyFilter()
            }
        },
        computed: {
            options()     { return this.component['FilterCustomize'][0] },
            outputVar()   { return this.component['OutputVarFilter'] || "" },
            placeholder() { return this.options['Placeholder']       || "Pesquisar ..." },
            classes()     { return this.options['FilterClasses']     || "w-full max-w-xs resize-none min-h-min h-min border border-slate-300 rounded-md py-2 px-2 outline-slate-300 leading-5" },
        },
        methods: {
            applyFilter: function() {
                this.inputContent = this.inputContent.trim()
                this.activeFilter = "(" + (this.inputContent ? this.inputContent.replace(/\n/,' ') : "*") +")"
                this.$set(this.component.vars,this.outputVar,this.activeFilter)
            },
            resize() {
                const { textarea } = this.$refs;
                if(this.inputContent && ( textarea.textLength >= textarea.cols || this.inputContent.split("\n").length > 1) ) {
                    textarea.style.height = "auto";
                    textarea.style.height = (textarea.scrollHeight + 2) + 'px'; // Os 14px são do padding acrescentado
                } else {
                    textarea.style.height = "40px";
                }
            }
        }
    }
</script>