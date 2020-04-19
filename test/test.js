import mocha from 'mocha'
import chai from 'chai'
import chaiHttp from 'chai-http'
import dirtyChai from 'dirty-chai'
import path from 'path'
import { htmlEncode } from 'htmlencode'
import ControllerPlugin, { Router, Controller } from '..'

/**
 * @type {Midgar}
 */
import Midgar from '@midgar/midgar'

class TestRouter extends Router {}

// fix for TypeError: describe is not a function with mocha-teamcity-reporter
const { describe, it } = mocha

const expect = chai.expect
chai.use(chaiHttp)
chai.use(dirtyChai)

let mid = null
const initMidgar = async () => {
  mid = new Midgar()
  await mid.start(path.join(__dirname, 'fixtures/config'))
  return mid
}

/**
 * Test the service plugin
 */
describe('Controller', function () {
  beforeEach(async () => {
    mid = await initMidgar()
  })

  afterEach(async () => {
    // mid.pm.getPlugin('@midgar/service').plugins = {}
    await mid.stop()
    mid = null
  })

  /**
   * Test if the plugin is load
   */
  it('plugin', async () => {
    const plugin = mid.pm.getPlugin('@midgar/route')
    expect(plugin).to.be.an.instanceof(ControllerPlugin, 'Plugin is not an instance of ControllerPlugin !')
  })

  /**
   * Test controller class
   */
  it('Router', async () => {
    // Test Instance abstract controller
    const router = new TestRouter(mid)

    // addRoutes()
    expect(function () {
      router.addRoutes({})
    }).to.throw(TypeError, 'Invalid routes type !')

    // addRoute()
    expect(function () {
      router._checkRoute('str')
    }).to.throw(TypeError, 'Invalid route type !')
    expect(function () {
      router._checkRoute({})
    }).to.throw(Error, 'Path is not defined !')
    expect(function () {
      router._checkRoute({ path: null })
    }).to.throw(Error, 'Invalid path type !')
    expect(function () {
      router._checkRoute({ path: 22 })
    }).to.throw(Error, 'Invalid path type !')
    expect(function () {
      router._checkRoute({ path: '' })
    }).to.throw(Error, 'Invalid path !')
    expect(function () {
      router._checkRoute({ path: 'test' })
    }).to.throw(Error, 'Action is not defined !')
    expect(function () {
      router._checkRoute({ path: 'test', action: {} })
    }).to.throw(Error, 'Invalid action type !')

    // init()
    expect(router.init).to.not.be.undefined('Missing init property !')
    expect(router.init).to.be.a('function', 'Invalid init property type !')

    // beforeCallRoute()
    expect(router.beforeCallRoute).to.not.be.undefined('Missing beforeCallRoute property !')
    expect(router.beforeCallRoute).to.be.a('function', 'Invalid beforeCallRoute property type !')

    expect(router.getService).to.not.be.undefined('Missing getService property !')
    expect(router.getService).to.be.a('function', 'Invalid getService property type !')
  })

  /**
   * The getParam method
   */
  it('getParam', async () => {
    const testStringValue = 'test<script type="text/javascript">alert(\'test\');</script>'
    const testObjectValue = {
      foo: 'testObject<script type="text/javascript">alert(\'test\');</script>'
    }

    const testArrayValue = ['testObject<script type="text/javascript">alert(\'test\');</script>']

    const app = mid.getService('mid:express').app
    // Add a post route to test getParam function
    app.post('/posttest', function (req, res) {
      const testString = req.getParam('testString')
      const testStringClear = req.getParam('testString', false)
      const testObject = req.getParam('testObject')
      const testObjectClear = req.getParam('testObject', false)
      const testArray = req.getParam('testArray')
      const testArrayClear = req.getParam('testArray', false)
      const testUndefined = req.getParam('testUndefined')
      const testNull = req.getParam('testNull')
      const testUndefinedNullObject = req.getParam('testUndefinedNullObject')

      res.status(200).json({
        testString,
        testStringClear,
        testObject,
        testObjectClear,
        testArray,
        testArrayClear,
        testUndefined,
        testNull
      })
    })

    // Do post request for test
    const chaiRes = await chai
      .request(app)
      .post('/posttest')
      .send({
        testString: testStringValue,
        testObject: testObjectValue,
        testArray: testArrayValue,
        testUndefined: undefined,
        testNull: null,
        testUndefinedNullObject: {
          a: null,
          b: undefined,
          c: {
            a: null,
            b: undefined
          }
        }
      })

    // Test response
    expect(chaiRes).have.status(200)
    expect(chaiRes.body.testString).equal(htmlEncode(testStringValue).trim(), 'Invalid testString value !')
    expect(chaiRes.body.testStringClear).equal(testStringValue, 'Invalid testStringClear value !')
    expect(chaiRes.body.testObject).to.eql({ foo: htmlEncode(testObjectValue.foo).trim() }, 'Invalid testObject value !')
    expect(chaiRes.body.testObjectClear).to.eql(testObjectValue, 'Invalid testObjectClear value !')
    expect(chaiRes.body.testArray).to.eql([htmlEncode(testArrayValue[0]).trim()], 'Invalid testArray value !')
    expect(chaiRes.body.testArrayClear).to.eql(testArrayValue, 'Invalid testArrayClear value !')
  })

  /**
   * Test simple route
   */
  it('test router', async () => {
    const app = mid.getService('mid:express').app

    // GET /V1
    let res = await chai.request(app).get('/v1').send()
    expect(res.body.result).to.be.equal('/v1-result', 'Invalid GET /v1 response !')

    // GET /test-route
    res = await chai.request(app).get('/v1/test-route').send()
    expect(res.body.result).to.be.equal('test-controller-test-route-result', 'Invalid GET /v1/test-route response !')
  })

  /**
   * Test validator route
   */
  it('test validator', async () => {
    const app = mid.getService('mid:express').app

    // POST /test-validator-array-router
    let res = await chai.request(app).post('/test-validator-array-router').send()
    expect(res.body.result).to.be.equal(
      'test-router-validator-array-router',
      'Invalid POST /test-validator-array-router response !'
    )
    console.log('body', res.body)
    expect(res.body.errors).to.be.eql(
      [{ msg: 'Invalid email !', param: 'email', location: 'body' }],
      'Invalid POST /test-validator-array-router response !'
    )

    res = await chai.request(app).post('/test-validator-array-router').send({ email: 'test@gmail.com' })
    expect(res.body.errors.length).to.be.equal(0, 'Invalid POST /test-validator-array-router response !')

    // POST /test-validator-schema-router
    res = await chai.request(app).post('/test-validator-schema-router').send()
    expect(res.body.errors).to.be.eql(
      [{ msg: 'Invalid email !', param: 'email', location: 'body' }],
      'Invalid POST /test-validator-schema-router response !'
    )

    res = await chai.request(app).post('/test-validator-schema-router').send({ email: 'test@gmail.com' })
    expect(res.body.errors.length).to.be.equal(0, 'Invalid POST /test-validator-schema-router response !')

    // POST /test-validator-schema-validator
    res = await chai.request(app).post('/test-validator-schema-validator').send()
    expect(res.body.errors).to.be.eql(
      [{ msg: 'Invalid email !', param: 'email', location: 'body' }],
      'Invalid POST /test-validator-schema-validator response !'
    )

    res = await chai.request(app).post('/test-validator-schema-validator').send({ email: 'test@gmail.com' })
    expect(res.body.errors.length).to.be.equal(0, 'Invalid POST /test-validator-schema-validator response !')
  })

  /**
   * Test service
   */
  it('test service', async () => {
    const app = mid.getService('mid:express').app

    expect(mid.getService('test').isValidTestParamCalled).to.be.false('isValidTestParamCalled is not false !')

    // GET /test-router-service
    let res = await chai.request(app).get('/test-router-service').send({ test: true })

    expect(mid.getService('test').isValidTestParamCalled).to.be.true('isValidTestParamCalled is not true !')

    expect(res.body.serviceResult).to.be.equal('test-service-result', 'Invalid GET /test-router-service response !')
    expect(res.body.result).to.be.equal('test-router-service-result', 'Invalid GET /test-router-service response !')

    // GET /test-controller-service
    res = await chai.request(app).get('/test-controller-service').send()
    expect(res.body.result).to.be.equal(
      'test-controller-test-service-result',
      'Invalid GET /test-controller-service response !'
    )
  })

  /**
   * Test other router
   */
  it('test other router', async () => {
    const app = mid.getService('mid:express').app
    // POST /test-other-route
    let res = await chai.request(app).post('/v1/test-other-route').send()
    expect(res.body.result).to.be.equal(
      'other-test-contoller-test-route-result',
      'Invalid POST /test-other-route response !'
    )
    expect(res.body.errors).to.be.eql(
      [{ msg: 'Invalid email !', param: 'email', location: 'body' }],
      'Invalid POST /test-validator-array-router response !'
    )

    res = await chai.request(app).post('/v1/test-other-route').send({ email: 'test@gmail.com' })
    expect(res.body.errors.length).to.be.equal(0, 'Invalid POST /test-validator-array-router response !')
    expect(res.body.result).to.be.equal(
      'other-test-contoller-test-route-result',
      'Invalid POST /test-other-route response !'
    )
  })
})
