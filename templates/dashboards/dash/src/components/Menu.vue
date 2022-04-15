<template>
    <ul class="space-y-2 text-slate-700 decoration-slate-700">
        <li v-for="(item, i) in componentData.items" :key="item.text + i"
            :class="'transition ease-in-out duration-300 rounded-md border border-cobline border-l-2 border-l-sky-600 shadow-sm transform hover:translate-x-0.5 '
                    + item.text_style">
            <a :href="item.link" class="flex items-center font-light py-1 px-3">
                <span v-html="item.text"/>
            </a>
        </li>
    </ul>
</template>

<script>
export default {
    props: {
        componentData: Object
    }
}
</script>