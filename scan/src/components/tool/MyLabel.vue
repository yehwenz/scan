<template>
    <span :style="{ color: color }">{{ text }}</span>
</template>
<script setup lang="ts">
export type myLabel = {
    color?: string
    text?: string
}

defineProps<myLabel>()
</script>