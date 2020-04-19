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
        errorMessage: 'Invalid test param.',
        custom: {
          options: async (value, { req, location, path }) => {
            return this.testService.isValidTestParam(value)
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
