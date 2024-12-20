<template>
    <v-text-field v-model="model" v-bind="props" />
</template>
<script setup lang="ts">

export type textField = {
    label?: string
    variant?: "filled" | "underlined" | "outlined" | "plain" | "solo" | "solo-inverted" | "solo-filled"
    density?: "default" | "comfortable" | "compact"
    bgColor?: string
    baseColor?: string
    color?: string
    placeholder?: string
}

const model = defineModel<string | undefined>()
const props = defineProps<textField>()
</script>