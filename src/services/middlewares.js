import * as middlewares from '../lib/middlewares/'

const register = (app, { config, spec, services }) => {
  const register = services.prometheus.register
  Object.entries(services.metrics.swagger).map( ([key, value]) => {
    register.registerMetric(value)
  })

  const HealthCheck = new middlewares.HealthCheck('/health', services)
  const SwaggerDoc = new middlewares.SwaggerDoc('/swagger.json', { spec, ...services })
  const Cors = new middlewares.Cors(false, { config })
  const ValidateResponse = new middlewares.ValidateResponse(false, services)
  const RequestId = new middlewares.RequestId(false, services)
  const AccessLogs = new middlewares.AccessLogs(false, services)
  const Prometheus = new middlewares.Prometheus('/metrics', services)

  const list = [
    Cors,
    AccessLogs,
    ValidateResponse,
    HealthCheck,
    SwaggerDoc,
    RequestId,
    Prometheus
  ]

  list.map( (middleware) => {
    middleware.registerFunction(app)()
  })
}

export default register