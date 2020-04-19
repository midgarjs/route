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
  }

  /**
   * Init controller
   *
   * @return {Promise<void>}
   */
  async init() {}

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
