// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css' // Ensure you are using css-loader
import { VNumberInput } from 'vuetify/labs/components'

export default createVuetify({  
    components: {
        ...components,
        VNumberInput
    },
    directives,
    icons: {
        defaultSet: 'mdi', // This is already the default value - only for display purposes
    },
})