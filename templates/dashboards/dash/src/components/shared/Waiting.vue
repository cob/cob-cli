<template>
  <div v-show="active" :class="['z-40 absolute inset-0 w-full h-full opacity-75', {'pointer-events-none':interactable}]">
    <div class="absolute inset-0 bg-white opacity-50"></div>
    <div class="flex p-4">
      <i class="fas fa-spinner fa-spin fa-2x text-slate-700"></i>
    </div>
  </div>
</template>

<script>
  export default {
    props: {
      active: {
        /* If true show overlay */
        type: Boolean,
        default: false
      },
      interactable: {
        /* If true it will allow interaction with elements bellow */
        type: Boolean,
        default: false
      }
    }
  }
</script>