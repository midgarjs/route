import { Validator } from '../../../../../../'

class OtherTestValidator extends Validator {
  constructor(mid, testService) {
    super(mid)
    this.testService = testService
  }

  test() {
    return {
      email: {
        errorMessage: 'Invalid email !',
        isEmail: true
      }
    }
  }
}

export default {
  name: 'other-test',
  validator: OtherTestValidator
}
