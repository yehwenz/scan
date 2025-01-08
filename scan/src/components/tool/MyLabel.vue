<template>
    <span class="label" :style="{ color: color }">{{ text }}</span>
</template>
<script setup lang="ts">
export type myLabel = {
    color?: string
    text?: string
}

defineProps<myLabel>()
</script>
<style lang="scss" scoped>
.label {
  font-size: clamp(30px, 2vw, 70px);
}
</style>