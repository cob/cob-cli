<template>
    <li :class="wrapperClass">
        <div class="py-4 px-5 space-y-2">
            <slot></slot>
        </div>
    </li>
</template>

<script>
export default {
    props: {
        rowSpan: String,
        colSpan: String,
        title: String,
        showTitle: Boolean
    },
    computed: {
        wrapperClass() {
            const c = "w-full bg-cobbg rounded-md border border-cobline" // hover:ring-1 ring-slate-400/50 ring-offset-1;

            // Force possible dynamic classes to be loaded
            const dynamicRowClasses = {
                1:  "md:row-span-1",
                2:  "md:row-span-2",
                3:  "md:row-span-3",
                4:  "md:row-span-4",
                5:  "md:row-span-5",
                6:  "md:row-span-6",
                full: "md:row-span-full"
            }
            const rspan = this.rowSpan ? " " + dynamicRowClasses[this.rowSpan] : "";

            // Force possible dynamic classes to be loaded
            const dynamicColClasses = {
                1:  "md:col-span-1",
                2:  "md:col-span-2",
                3:  "md:col-span-3",
                4:  "md:col-span-4",
                5:  "md:col-span-5",
                6:  "md:col-span-6",
                full: "md:col-span-full"
            }
            const cspan = this.colSpan ?  " " + dynamicColClasses[this.colSpan] : ""; 

            return c + rspan + cspan;
        }
    }
}
</script>
