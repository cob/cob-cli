<template>
    <ul class="space-y-2 text-slate-700 decoration-slate-700">
        <li v-for="(menuItem, i) in menuItems" 
            :key="'menuItem-' + i"
            :class="'transition ease-in-out duration-300 rounded-md border border-cobline border-l-2 border-l-sky-600 shadow-sm transform hover:translate-x-0.5 '
                    + menuItem.style"
        >
            <a :href="menuItem.link" class="flex items-center font-light py-1 px-3" >
                <span v-html="menuItem.text"/>
            </a>
        </li>
    </ul>
</template>

<script>
export default {
    props: {
        componentData: Object
    },
    computed: {
        menuItems() { 
            return this.componentData['Text'].map( m => ({
                text: m['Text'],
                link: m['Link'],
                style: m['Style Text'],
            }))
        }
    }
}
</script>