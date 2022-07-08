<template>
    <div :class="classes" :style="image" >
        <div :class="width + ' ' + grid">
            <Board v-for="(board,i) in boards" :board="board" :key="i" :userInfo="userInfo"/>
        </div>
    </div>
</template>

<script>
    import Board from './Board.vue'

    export default {
        components: { Board },
        props: {
          dashboard: Object,
          userInfo: Object
        },
        computed: {
            options() { return this.dashboard['DashboardCustomize'][0] },
            boards()  { return this.dashboard['Board'] },
            classes() { return this.options['DashboardClasses'] || "h-full bg-cover bg-center overflow-auto p-3" },
            width()   { return this.options['Width']            || "max-w-6xl mx-auto" },
            grid()    { return this.options['Grid']             || "grid grid-flow-row-dense md:grid-cols-12" },
            image()   { return this.options['Image'] ? "background-image: url(" + this.options['Image'] +  ");" : "" }
        }
    }
</script>
