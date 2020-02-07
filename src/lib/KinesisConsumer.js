import prom from 'prom-client'
import logger from './logger'

const events_seen = new prom.Counter({
  name: 'stream_event_seen_count',
  help: 'number of stream events seen',
  labelNames: ['event'],
})

const handlers_triggered = new prom.Counter({
  name: 'stream_event_handler_triggered_count',
  help: 'number of handlers triggered',
  labelNames: ['event', 'handler', 'result']
})

const handlers_time_spent = new prom.Histogram({
  name: 'stream_event_handler_time_spent',
  help: 'time spent in various event handlers',
  labelNames: ['event', 'handler', 'result']
})

const sleep = async (delay) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => { resolve(true) }, delay)
  })
}



class KinesisConsumer {
  constructor(iterator, options = {}) {
    this.logger = options.logger
    this.iterator = iterator
    this.handlers = {}
  }

  setHandlers(handlers) {
    this.handlers = handlers
  }

  setHandlerDependencies(dependencies) {
    this.handlerDependencies = dependencies
  }

  async start() {
    for await (const record of this.iterator.records()) {
      let data
      try {
        data = JSON.parse(record.Data.toString())
      } catch( error ) {
        this.logger.error({ 'msg': 'failed to parse JSON', 'data': record.Data.toString() })
        continue
      }

      await this.process(data)
    }
  }

  async process(event) {
    events_seen.labels(event.event).inc()

    const l = new logger.constructor(logger.instance)

    l.setContext('event', event.event)
    l.setContext('event_id', event.id)

    if(!this.handlers[event.event]) {
      l.info('event has no handler')
      return
    }

    const instances = this.handlers[event.event].map( handler => {
      let dependencies
      if(typeof(this.handlerDependencies) === 'function') {
        dependencies = this.handlerDependencies(event, handler)
      } else {
        dependencies = this.handlerDependencies
      }

      return new handler(dependencies)
    })

    let results = await Promise.all(
      instances.map( async (handler) => {
        const response = {}
        const start = new Date()

        response[handler.constructor.name] = await handler.run(event)

        handlers_triggered
          .labels(event.event, handler.constructor.name, true)
          .inc()

        handlers_time_spent
          .labels(event.event, handler.constructor.name, true)
          .observe((new Date() - start) / 1000)

        return response
      })
    )

    for(const result of results) {
      l.info({
        handler: Object.entries(result)[0][0],
        result: Object.entries(result)[0][1]
      })
    }

    return true
  }
}

export default KinesisConsumer
