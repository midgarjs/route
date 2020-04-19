/**
 * Validator Class
 * @class
 * @abstract
 */
class Validator {
  /**
   * @param {Midgar} mid Midgar instance
   */
  constructor(mid) {
    if (this.constructor === Validator)
      throw new TypeError('@midgar/route: Abstract class "Validator" cannot be instantiated directly.')
    /**
     * Validator name
     * This property is set route plugin
     * @type {String}
     */
    this.name = null

    /**
     * Midgar instance
     * @type {Midgar}
     */
    this.mid = mid

    /**
     * Route plugin instance
     * This property is route plugin
     * after create an instance of this class
     * @type {RoutePlugin}
     */
    this.routePlugin = null
  }

  /**
   * Init controller
   *
   * @return {Promise<void>}
   */
  async init() {}

  /**
   * Return a validator instance
   *
   * @param {String} name Validator name
   *
   * @returns {validator}
   */
  getValidator(name) {
    return this.routePlugin.getValidator(name)
  }

  /**
   * Return a service instance
   *
   * @param {String} name Service name
   *
   * @return {Service}
   */
  getService(name) {
    return this.mid.getService(name)
  }

  async beforeCallRoute(route, req, res) {}
}

export default Validator
