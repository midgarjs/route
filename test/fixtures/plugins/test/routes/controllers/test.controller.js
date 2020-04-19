import { Controller } from '../../../../../../'

class TestController extends Controller {
  constructor(mid, testService) {
    super(mid)
    this.testService = testService
  }

  test(req, res) {
    res.send({ result: 'test-controller-test-route-result' })
  }

  testServiceAction(req, res) {
    res.send({
      result: 'test-controller-test-service-result',
      serviceResult: this.testService.getResult()
    })
  }
}

export default {
  name: 'test',
  services: ['test'],
  controller: TestController
}
