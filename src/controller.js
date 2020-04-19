import Abstract from './abstract'

/**
 * @typedef {Object} Route
 * @property {string|RegExp|Array} path   Express route path
 * @property {string}              method Http method
 * @property {function}            action Route callback
 */

/**
 * Controller Class
 * @class
 * @abstract
 */
class Controller extends Abstract {
  /**
   * @param {Midgar} mid Midgar instance
   */
  constructor(mid) {
    super()
    /**
     * Midgar instance
     * @type {Midgar}
     */
    this.mid = mid

    /**
     * Controller name
     * This property is set route plugin
     * @type {String}
     */
    this.name = null
  }

  /**
   * Init controller
   *
   * @return {Promise<void>}
   */
  async init() {}

  /**
   * Before call route hook
   *
   * @param {Route}    route Route object
   * @param {Request}  req   Express request object
   * @param {Response} res   Express responde object
   *
   * @return {Promise<void>}
   */
  async beforeCallRoute(route, req, res) {}
}

export default Controller
