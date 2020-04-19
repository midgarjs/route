/**
 * Midgar Test service
 */
class TestService {
  constructor(mid) {
    this.isValidTestParamCalled = false
  }

  getResult() {
    return 'test-service-result'
  }

  isValidTestParam(test) {
    this.isValidTestParamCalled = true
    return test
  }
}

export default {
  name: 'test',
  service: TestService
}
