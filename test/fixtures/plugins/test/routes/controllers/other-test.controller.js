import { Controller } from '../../../../../../'

class OtherTestController extends Controller {
  constructor(mid, testService) {
    super(mid)
    this.testService = testService
  }

  async test(req, res) {
    const errors = await this.getValidatorErrors(req)
    res.send({ result: 'other-test-contoller-test-route-result', errors })
  }
}

export default {
  name: 'other-test',
  controller: OtherTestController
}
