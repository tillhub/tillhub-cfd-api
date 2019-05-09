import * as Ajv from 'ajv'
import dataSchema from '@tillhub/schemas/lib/v0/cfd_api/data'

import { EventTarget, defineEventAttribute } from 'event-target-shim'
import * as CustomEvent from 'custom-event-polyfill'

const ajv = new Ajv()
const validate = ajv.compile(dataSchema)

class CFDApi extends EventTarget {
  get auth () {
    return this._auth
  }

  ingest (appString) {
    try {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.log('CFDApi: received string ingestion:', appString)
      }
      let data
      try {
        data = JSON.parse(appString)
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('CFDApi: parsing failed', e)
        return new Error('parsing failed').message
      }

      if (!data) return new Error('no data').message

      if (!validate(data)) {
        // eslint-disable-next-line no-console
        console.error('CFDApi: validation failed', validate.errors)
      }

      if (data.type === 'auth') {
        // let's keep track of latest auth state
        this._auth = data.body
      }

      // dispatch type-specific event
      this.dispatchEvent(new CustomEvent(data.type, data.body))

      // dispatch 'global' event
      this.dispatchEvent(new CustomEvent('data', data))
    } catch (e) {
      // unexpected error
      // eslint-disable-next-line no-console
      console.error('CFDApi: unexpected error', e)
      return e.message
    }
  }
}

// Define `CFDApi.on*` properties.
defineEventAttribute(CFDApi.prototype, 'action')
defineEventAttribute(CFDApi.prototype, 'auth')
defineEventAttribute(CFDApi.prototype, 'pos_message')

defineEventAttribute(CFDApi.prototype, 'data')

const instance = new CFDApi()

export default instance
