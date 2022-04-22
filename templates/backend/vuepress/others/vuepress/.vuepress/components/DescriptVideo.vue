<template>
  <div style="text-align:center;">
    <iframe
      :src="'https://share.descript.com/embed/' + id"
      width="100%"
      height="360"
      frameborder="0"
      allowfullscreen
      style="max-width:640px"
    ></iframe>
  </div>
</template>

<script>
export default {
  props: {
    id: String,
  },
};
</script>

<style></style>
