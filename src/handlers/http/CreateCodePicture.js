import { Operation, HTTPResponse } from '../../lib/http/Base'

import crypto from 'crypto'

import Code from '../../models/Code'

class CreateCodePicture extends Operation {
  static model = Code
  static canBeCalledAnonymously = false

  async extract_params(req) {
    const now = new Date().toISOString()
    this.args = {
      body: {
        ...req.params,
        created_at: now,
        updated_at: now
      },
      picture: req.files[0],
      base_url: [
        req.headers['x-forwarded-proto'] || 'http',
        '://',
        req.headers['x-forwarded-host'] || req.headers['host'],
        req.originalUrl
      ].join('')

    }
  }

  generatePictureFilename(hash) {
    return ([
      this.args.body.code, hash
    ].join('/')
    +
    '.'
    +
    this.args.picture.mimetype.split('/')[1])
  }

  async execute() {
    let hash = crypto.createHash('sha256').update(this.args.picture.buffer).digest('hex')
    try {
      await this.services.image_repository.put(
        this.generatePictureFilename(hash),
        this.args.picture.buffer
      )
    } catch(error) {
      this.services.logger.warn({ 'msg': 'Failed to upload picture', error })
      return HTTPResponse.ServerError('Failed to upload picture')
    }

    const picture = {
      id: hash,
      size: this.args.picture.size,
      last_modified: new Date().toISOString()
    }


    this.services.event_publisher.publish(
      ['CodePicture', 'Created'].join(''),
      {
        ...picture,
        code: this.args.body.code
      },
      this.user
    )

    return HTTPResponse.Created(picture)
  }

}

export {
  CreateCodePicture
}
