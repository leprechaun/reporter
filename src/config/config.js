const baseConfig = env => ({
  ENVIRONMENT_NAME: env.ENVIRONMENT_NAME,
  port: env.PORT || 5000,
  bodyLimit: '100kb',
  corsHeaders: ['Link'],
  useSwaggerValidation: true,
  reporter_base_url: env.REPORTER_BASE_URL || 'http://full:5000/v1',
  s3: {
    endpoint: env.S3_ENDPOINT || 'http://s3/',
    bucket: env.S3_BUCKET || 'snacker-tracker-' + env.ENVIRONMENT_NAME,
    accessKeyId: env.AWS_ACCESS_KEY_ID || 'none',
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY || 'none',
    s3ForcePathStyle: true
  },
  database: {
    host: env.DATABASE_HOST,
    database: env.DATABASE_NAME,
    user: env.DATABASE_USERNAME,
    password: env.DATABASE_PASSWORD
  },
  kinesis: {
    enabled: true,
    region: 'local',
    endpoint: env.KINESIS_ENDPOINT || 'http://kinesis:4567',
    stream_name: env.KINESIS_STREAM || 'snacker-tracker',
    accessKeyId: 'daasd',
    secretAccessKey: 'daasd',
  },
})

export const Config = env => {
  const base = baseConfig(env)
  return base
}
