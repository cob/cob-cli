<template>
    <table :class="classes">
        <tr v-for="(line, i) in lines" :key="'line'+i" :class="line.lineClasses">
            <td  :class="line.titleClasses">
                {{ line.title }}
            </td>
            <td v-for="(value, j) in line.values" :key="'value'+i+'-'+j">
                <TotalsValue :value-data="value"/>
            </td>
        </tr>
    </table>
</template>

<script>
    import TotalsValue from './TotalsValue.vue'

    export default {
        components: { TotalsValue },
        props: {
          component: Object,
          userInfo: Object
        },
        computed: {
            options()     { return this.component['TotalsCustomize'][0] },
            classes()     { return this.options['TotalsClasses'] || "w-full table-auto" },
            inputs()      { return this.options['InputVarTotals'].map(v => v['InputVarTotals']) },
            inputFilter() { return this.inputs.filter(v => this.component.vars[v]).map(v => this.component.vars[v]).join(" ")},
            lines() {
                return this.component['Line'].map( l => ({
                    title :       l['Line']                             || "",
                    lineClasses:  l["LineCustomize"][0]["LineClasses"]  || "text-right transition ease-in-out ring-sky-600 ring-offset-1 hover:ring-2 rounded-md",
                    titleClasses: l["LineCustomize"][0]["TitleClasses"] || "text-left p-2",
                    values:       l['Value']
            }))}
        },
        watch: {
            inputFilter(newValue) {
                if(newValue === "") return //PRESSUPOSTO IMPORTANTE: se newValue é vazio é porque estamos em transições (porque usamos sempre um valor, nem que seja *) e o melhor é usar o valor antigo para o valor não mudar momentaneamente (e ainda desperdicar uma pesquisa). Se o pressuposto for quebrado vamos impedir a actualização do inputFilter quando o valor é ""
                this.lines.forEach(l => {
                    l.values.forEach(v => {
                      let arg = (v.Arg[1] instanceof Object ? v.Arg[1].Arg : v.Arg[1])
                      let newFilter = ((arg || "") + " " + newValue.trim()) || "*"
                      if (v.dash_info) v.dash_info.changeArgs({query: newFilter.replaceAll("__USERNAME__",this.userInfo.username)})
                    });
                });
            }
        }
    }
</script>
