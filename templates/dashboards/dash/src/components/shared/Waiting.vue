<template>
  <div v-show="showWaiting" class="z-40 absolute inset-0 w-full h-full opacity-75">
    <div class="absolute inset-0 bg-gray-400"></div>
    <div class="flex justify-center items-center h-full">
      <i class="fas fa-spinner fa-spin fa-5x"></i>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    waiting: {
      type: Boolean,
      default: false
    }
  },

  computed: {
    showWaiting() {
      return this.waiting || false
    }
  }
}
</script>
