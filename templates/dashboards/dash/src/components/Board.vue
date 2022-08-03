<template>
    <div :class="classes" :style="image" >
        <template v-for="(item, i) in components">
            <Label    v-if="item['Component'] === 'Label'"    :component="item" :key="i" />
            <Menu     v-if="item['Component'] === 'Menu'"     :component="item" :key="i" />
            <Totals   v-if="item['Component'] === 'Totals'"   :component="item" :key="i" :userInfo="userInfo"/>
            <Kibana   v-if="item['Component'] === 'Kibana'"   :component="item" :key="i" :userInfo="userInfo"/>
            <Filtro   v-if="item['Component'] === 'Filter'"   :component="item" :key="i" />
            <Calendar v-if="item['Component'] === 'Calendar'" :component="item" :key="i" />
        </template>
    </div>
</template>

<script>
    import Label  from './Label.vue'
    import Menu   from './Menu.vue'
    import Totals from './Totals.vue'
    import Kibana from './Kibana.vue'
    import Filtro from './Filter.vue'
    import Calendar from './Calendar.vue'

    export default {
        components: { Label, Menu, Totals, Kibana, Filtro, Calendar },
        props: {
          board: Object,
          userInfo: Object,
        },
        computed: {
            options()    { return this.board['BoardCustomize'][0] },
            components() { return this.board['Component'] },
            classes()    { return this.options['BoardClasses'] || "col-span-12 md:col-span-4 rounded-md border border-gray-300 bg-white bg-opacity-70 p-4 m-1" },
            image()      { return this.options['Image'] ? "background-image: url(" + this.options['Image'] +  ");" : "" }
        }
    }
</script>
