import { Validator } from '../../../../../../'

class TestValidator extends Validator {
  constructor(mid, testService) {
    super(mid)
    this.testService = testService
  }

  testSchema() {
    return {
      email: {
        errorMessage: 'Invalid email !',
        isEmail: true
      }
    }
  }

  testServiceValidator() {
    return {
      test: {
        custom: {
          options: async (value, { req, location, path }) => {
            if (!this.testService.isValidTestParam(value)) throw new Error('Invalid test param.')
          }
        }
      }
    }
  }
}

export default {
  name: 'test',
  services: ['test'],
  validator: TestValidator
}
