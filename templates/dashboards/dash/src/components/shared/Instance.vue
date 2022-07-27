<template>
  <div class='flex flex-col p-4 rounded border-2 border-zinc-300 bg-zinc-50 text-sm calendar-tooltip'>
    <a :href='instanceUrl'
       class='max-w-fit mb-4 text-sky-500 uppercase no-underline hover:underline js-instance-label main-info'>
      {{ instanceLabel }}
    </a>
    <div class='details flex flex-col flex-wrap justify-start'>
      <div v-for='description in instanceDescriptions'
           class='flex flex-row mr-4 field-group max-w-xs'>
        <div class='whitespace-nowrap mr-1 text-gray-400 field'>{{ description.name }}:</div>
        <div class='whitespace-nowrap text-ellipsis overflow-hidden value'>{{ description.value }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import {toEsFieldName} from "@cob/rest-api-wrapper/src/utils/ESHelper";
import {getValue} from "@/utils/EsInstanceUtils";

export default {
  props: {
    esInstance: Object
  },

  computed: {
    instanceUrl() {
      return `#/instance/${this.esInstance.id}`
    },
    instanceLabel() {
      if (!this.esInstance._definitionInfo.instanceLabel) return this.esInstance.id
      if (!this.esInstance._definitionInfo.instanceLabel.length) return this.esInstance.id

      const fieldDefinition = this.esInstance._definitionInfo.instanceLabel[0];
      return this.getFieldValue(this.esInstance, fieldDefinition)[0]
    },

    instanceDescriptions() {
      if (!this.esInstance._definitionInfo.instanceDescription) return null

      return this.esInstance._definitionInfo.instanceDescription
          .filter(fieldDefinition => this.esInstance[toEsFieldName(fieldDefinition.name)])
          .map(fieldDefinition => {
            return {
              name: fieldDefinition.name,
              value: this.getFieldValue(this.esInstance, fieldDefinition).join(', ')
            }
          });
    },
  },
  methods: {
    getFieldValue(esInstance, fieldDefinition) {
      return getValue(esInstance, fieldDefinition)
    }
  }
}
</script>