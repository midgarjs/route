import Abstract from './abstract'

/**
 * @typedef {Object} Route
 * @property {string|RegExp|Array} path   Express route path
 * @property {string}              method Http method
 * @property {function}            action Route callback
 */

/**
 * Router Class
 * @class
 * @abstract
 */
class Router extends Abstract {
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
     * Route plugin instance
     * This property is route plugin
     * after create an instance of this class
     * @type {RoutePlugin}
     */
    this.routePlugin = null

    /**
     * Routes prefix
     * @type {String|null}
     */
    this.prefix = null

    /**
     * Controller instance
     * @type {Controller}
     */
    this.controller = null

    /**
     * Validator instance
     * @type {Validator}
     */
    this.validator = null

    /**
     * Allowed HTTP methods
     */
    this._methods = ['get', 'post', 'put', 'delete', 'all']
  }

  /**
   * Init controller
   *
   * @return {Promise<void>}
   */
  async init() {}

  /**
   * Return routes array
   * @return {Array<Route>}
   */
  getRoutes() {
    return this.routes
  }

  /**
   * Add routes to express
   *
   * @param {Array<Route>} routes Array of Route object to add
   */
  addRoutes(routes) {
    if (!Array.isArray(routes)) throw new TypeError('Invalid routes type !')
    for (const route of routes) {
      try {
        this._checkRoute(route)
        this.routePlugin.addRoute(route, this)
      } catch (error) {
        const routeString = JSON.stringify(route, null, '  ')
        this.mid.error(`Invalid route: ${routeString}`)
        this.mid.error(error.message)
      }
    }
  }

  /**
   * Add route to route express
   *
   * @param {Array<Route>} route Route object to add
   */
  addRoute(route) {
    try {
      this._checkRoute(route)
      this.routePlugin.addRoute(route, this)
    } catch (error) {
      const routeString = JSON.stringify(route, null, '\n')
      this.mid.error(`Invalid route: ${routeString}`)
      this.mid.error(error.message)
    }
  }

  /**
   * Check route definition
   *
   * @param {RouteDef} route Route definition
   * @private
   */
  _checkRoute(route) {
    if (typeof route !== 'object') throw new TypeError('Invalid route type !')
    // Check path
    if (route.path === undefined) throw new Error('Path is not defined !')
    if (typeof route.path !== 'string' && !(route.path instanceof RegExp) && !Array.isArray(route.path))
      throw new Error('Invalid path type !')

    if (!route.path) throw new Error('Invalid path !')

    // Check method
    if (route.method !== undefined && !this._methods.includes(route.method))
      throw new Error(`Invalid method ${route.method} !`)

    if (route.controller !== undefined && typeof route.controller !== 'string') {
      throw new Error(`Invalid controller type ${route.controller} !`)
    }

    // check action
    if (route.action === undefined) throw new Error('Action is not defined !')
    if (typeof route.action === 'string') {
      if (!this.controller && route.controller === undefined)
        throw new Error('Invalid action type, controller is not set on router.')

      let controller = this.controller
      if (route.controller) {
        controller = this.routePlugin.getController(route.controller)
      }

      if (!controller[route.action]) throw new Error(`Unknow controller action ${route.action}.`)
    } else if (typeof route.action !== 'function') {
      throw new Error('Invalid action type !')
    }
    if (route.validator) this._checkeRouteValidator(route.validator)
  }

  /**
   * Check route validator definition
   *
   * @param {ValidatorDef} validator Validator definition
   */
  _checkeRouteValidator(validator) {
    if (Array.isArray(validator)) return

    if (typeof validator === 'string') {
      if (!this.validator) throw new Error('Invalid validator type, validator is not set on router.')

      if (!this.validator[validator]) throw new Error(`Unknow validator method ${validator}.`)
    } else if (typeof validator !== 'function' && typeof validator !== 'object') {
      throw new Error('Invalid validator type !')
    }
  }

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
   * Return a controller instance
   *
   * @param {String} name Controller name
   *
   * @returns {Controller}
   */
  getController(name) {
    return this.routePlugin.getController(name)
  }

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

export default Router
