import { Router, body } from '../../../../../../'

class TestRouter extends Router {
  constructor(mid, testService) {
    super(mid)
    this.testService = testService
  }

  async init() {
    this.prefix = '/v1'

    this.addRoute({
      path: '/',
      action: (req, res) => res.send({ result: '/v1-result' })
    })

    this.addRoutes([
      // Controller route
      {
        path: '/test-route',
        action: 'test'
      },

      // Array validator
      // POST /test-validator-array-router
      {
        ignorePrefix: true,
        method: 'post',
        validator: [body('email').isEmail().withMessage('Invalid email !')],
        path: '/test-validator-array-router',
        action: (req, res) => {
          const errors = this.getValidatorErrors(req)
          res.send({ result: 'test-router-validator-array-router', errors })
        }
      },

      // Schema validation
      // POST /test-validator-schema-router
      {
        ignorePrefix: true,
        method: 'post',
        validator: {
          email: {
            errorMessage: 'Invalid email !',
            isEmail: true
          }
        },
        path: '/test-validator-schema-router',
        action: (req, res) => {
          const errors = this.getValidatorErrors(req)
          res.send({ result: 'test-router-validator-schema-router', errors })
        }
      },

      // Schema external validation
      // POST /test-validator-schama-validator
      {
        ignorePrefix: true,
        method: 'post',
        validator: 'testSchema',
        path: '/test-validator-schema-validator',
        action: (req, res) => {
          const errors = this.getValidatorErrors(req)
          res.send({ result: 'test-router-validator-schema-validator', errors })
        }
      },
      // Router service
      // GET /test-router-service
      {
        ignorePrefix: true,
        path: '/test-router-service',
        validator: 'testServiceValidator',
        action: (req, res) => {
          res.send({ result: 'test-router-service-result', serviceResult: this.testService.getResult() })
        }
      },
      // Controller service
      // GET /test-controller-service
      {
        ignorePrefix: true,
        path: '/test-controller-service',
        action: 'testServiceAction'
      },
      // POST /test-other-route
      {
        method: 'post',
        path: '/test-other-route',
        validator: (...args) => this.getValidator('other-test').test(...args),
        action: (...args) => this.getController('other-test').test(...args)
      }
    ])
  }
}

export default {
  controller: 'test',
  validator: 'test',
  services: ['test'],
  router: TestRouter
}
