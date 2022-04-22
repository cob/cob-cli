<template>
    <div class="read-time">
        <p>
            <strong>Reading time:</strong> {{ readingTime }} minute{{readingTime > 1 ? 's': ''}}<br />
        </p>
    </div>
</template>

<script>
export default {
    name: 'ReadingTime',
    computed: {
        // Full object list: //github.com/darrenjennings/vuepress-plugin-reading-time#usage
        readingTime() { 
            let minutes = this.$page.readingTime.minutes
            
            if (minutes < 1) {
                minutes = 1
            } else {
                minutes = (minutes - Math.floor(minutes) < .5) ? Math.floor(minutes) : Math.ceil(minutes)
            }
            return minutes 
        },
    }
}
</script>