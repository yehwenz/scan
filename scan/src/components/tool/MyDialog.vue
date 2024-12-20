<template>
    <v-dialog v-model="model" v-bind="{ maxWidth: maxWidth, persistent: persistent }">
        <v-card v-bind="{ color: color }">
            <template v-slot:prepend>
                <slot name="perpend">
                    <v-icon v-bind="{ icon: prependIcon, color: prependIconColor }"/>
                </slot>
            </template>
            <template v-slot:title>
                <slot name="title">
                    {{ title }}
                </slot>
            </template>
            <template v-slot:append>
                <slot name="append">
                    <v-icon v-bind="{ icon: appendIcon, color: appendIconColor }"/>
                </slot>
            </template>
            <template v-slot:text>
                <slot name="text">
                    {{ text }}
                </slot>
            </template>
            <template v-slot:actions>
                <slot name="actions">
                    <v-btn />
                </slot>
            </template>
        </v-card>
    </v-dialog>
</template>
<script setup lang="ts">
export type myDialog = {
    title?: string
    text?: string
    prependIcon?: string
    prependIconColor?: string
    appendIcon?: string
    appendIconColor?: string
    maxWidth?: string
    persistent?: boolean
    color?: string
}

const model = defineModel<boolean>({ default: false})
withDefaults(defineProps<myDialog>(), { persistent: true, maxWidth: '500px' })
</script>