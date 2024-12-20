<template>
  <v-container>
    <QRCodeScaner/>
  </v-container>
</template>
<script setup lang="ts">
import QRCodeScaner from '@/components/tool/QRCodeScaner.vue';
</script>
<style lang="scss" scoped>
.header {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem 1rem;
}
.body {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.result{
  margin: 1rem 0;
  text-align: center;
  font-size: clamp(25px, 2vw, 35px);
}
</style>