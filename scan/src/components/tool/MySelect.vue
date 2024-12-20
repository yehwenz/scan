<template>
    <v-select v-model="model" v-bind="props" @update:model-value="action"/>
</template>
<script setup lang="ts">
export type mySelect = {
    label?: string
    itemTitle?: string
    itemValue?: string
    variant?: "filled" | "underlined" | "outlined" | "plain" | "solo" | "solo-inverted" | "solo-filled"
    density?: "default" | "comfortable" | "compact"
    bgColor?: string
    baseColor?: string
    color?: string
    placeholder?: string
    items?: Array<Record<string, unknown>>
    action?: () => void
}

const model = defineModel<string | undefined>()
const props = defineProps<mySelect>()

</script>
