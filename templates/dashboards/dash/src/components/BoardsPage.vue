<template>
    <ul :class="wrapperClass">
        <slot></slot>
    </ul>
</template>

<script>
export default {
    props: { gridCols: String },
    computed: {
        wrapperClass() {
            const c = "grid grid-cols-1 gap-2 content-center md:grid-flow-row-dense";

            // Force possible dynamic classes to be loaded
            const dynamicClasses = {
                1: "md:grid-cols-1",
                2: "md:grid-cols-2",
                3: "md:grid-cols-3",
                4: "md:grid-cols-4",
                5: "md:grid-cols-5",
                6: "md:grid-cols-6",
                7: "md:grid-cols-7",
                8: "md:grid-cols-8",
                9: "md:grid-cols-9",
                10: "md:grid-cols-10",
                11: "md:grid-cols-11",
                12: "md:grid-cols-12",
                none: "md:grid-cols-none"
            }

            const gcols = this.gridCols ? " " + dynamicClasses[this.gridCols] : "";
            return c + gcols;
        }
    }
}
</script>
