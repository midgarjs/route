import { htmlEncode } from 'htmlencode'
import { Plugin } from '@midgar/midgar'
import { asyncMap } from '@midgar/utils'
import { body, checkSchema, check, query, validationResult } from 'express-validator'
import Controller from './controller'
import Router from './router'
import Validator from './validator'

const ROUTERS_PATH = 'routes/routers'
const ROUTER_MODULE_TYPE_KEY = 'midgar-router'

const CONTROLLERS_PATH = 'routes/controllers'
const CONTROLLER_MODULE_TYPE_KEY = 'midgar-controller'

const VALIDATORS_PATH = 'routes/validators'
const VALIDATOR_MODULE_TYPE_KEY = 'midgar-validator'

export {
  Controller,
  Router,
  Validator,
  ROUTER_MODULE_TYPE_KEY,
  CONTROLLER_MODULE_TYPE_KEY,
  VALIDATOR_MODULE_TYPE_KEY,
  body,
  checkSchema,
  check,
  query,
  validationResult
}

/**
 * RoutePlugin plugin class
 */
class RoutePlugin extends Plugin {
  constructor(...args) {
    super(...args)

    /**
     * Express app
     * @type {Express|null}
     */
    this.app = null

    /**
     * Validators dictionary
     * @type {Object}
     */
    this.validators = {}

    /**
     * Controller dictionary
     * @type {Object}
     */
    this.controllers = {}
  }

  /**
   * Init plugins
   * Define controllers directory and bind event
   *
   * @return {Promise<void>}
   */
  async init() {
    // Add route module type to plugin manager
    this.pm.addModuleType(ROUTER_MODULE_TYPE_KEY, ROUTERS_PATH)
    this.pm.addModuleType(CONTROLLER_MODULE_TYPE_KEY, CONTROLLERS_PATH)
    this.pm.addModuleType(VALIDATOR_MODULE_TYPE_KEY, VALIDATORS_PATH)

    // Bind @midgar/express:afterInit event for add route to express
    this.mid.on('@midgar/express:afterInit', (expressService) => {
      this.app = expressService.app

      // Bind get param method on express instance
      this._bindGetParm()
      return this._loadModules()
    })
  }

  /**
   * Add a midlleware to set getParam method to request object
   * @private
   */
  _bindGetParm() {
    const _this = this
    // Attach method on express request prototype
    this.app.request.getParam = function (key, clean = true) {
      if (clean && this.__cleanParams && this.__cleanParams[key]) {
        return this.__cleanParams[key]
      }

      let value = null
      if (this.query[key] !== undefined) {
        value = this.query[key]
      } else if (this.body[key] !== undefined) {
        value = this.body[key]
      }

      if (value !== null && clean) {
        value = _this._cleanParam(value)
        if (!this.__cleanParams) {
          this.__cleanParams = {}
        }

        this.__cleanParams[key] = value
      }

      return value
    }
  }

  /**
   * Remove html from Object, array and String
   *
   * @param {any} value
   * @private
   */
  _cleanParam(value) {
    if (value === null || value === undefined) return value
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        const array = []
        const keys = value.keys()
        for (const key of keys) {
          array[key] = this._cleanParam(value[key])
        }

        return array
      } else {
        const obj = {}
        const keys = Object.keys(value)
        for (const key of keys) {
          const cleanKey = htmlEncode(key)
          obj[cleanKey] = this._cleanParam(value[key])
        }
        return obj
      }
    } else if (typeof value === 'string') {
      return htmlEncode(value).trim()
    } else {
      return value
    }
  }

  /**
   * Import modules and add routes to express
   *
   * @return {Promise<void>}
   * @private
   */
  async _loadModules() {
    /**
     * beforeLoadRoute event.
     * @event @midgar/route:beforeLoadModules
     */
    await this.mid.emit('@midgar/route:beforeLoadModules')

    this.mid.debug('@midgar/route: Load modules...')

    // Import modules files async
    const [routerModules, controllerModules, validatorModules] = await Promise.all([
      this.mid.pm.importModules(ROUTER_MODULE_TYPE_KEY),
      this.mid.pm.importModules(CONTROLLER_MODULE_TYPE_KEY),
      this.mid.pm.importModules(VALIDATOR_MODULE_TYPE_KEY)
    ])

    // Load modules
    await this._loadValidators(validatorModules)
    await this._loadControllers(controllerModules)
    await this._loadRouters(routerModules)

    this.mid.debug('@midgar/route: Load modules finish.')

    /**
     * afterLoad event.
     * @event @midgar/route:afterLoadModules
     */
    await this.mid.emit('@midgar/route:afterLoadModules')
  }

  /**
   * Load validators modules
   *
   * @param {Array<ValidatorModule} validatorModules Arary of validator modules
   *
   * @return {Promise<void>}
   * @private
   */
  async _loadValidators(validatorModules) {
    // List controller modules
    await asyncMap(validatorModules, async (validatorModule) => {
      try {
        await this._loadValidator(validatorModule)
      } catch (error) {
        this.mid.error(`Error on load validator ${validatorModule.path}.`)
        throw error
      }
    })
  }

  /**
   * Load controllers modules
   *
   * @param {Array<ControllerModule} controllerModules Arary of controller modules
   *
   * @return {Promise<void>}
   * @private
   */
  async _loadControllers(controllerModules) {
    // List controller modules
    await asyncMap(controllerModules, async (controllerModule) => {
      try {
        await this._loadController(controllerModule)
      } catch (error) {
        this.mid.error(`Error on load controller ${controllerModules.path}.`)
        throw error
      }
    })
  }

  /**
   * Load routers modules
   *
   * @param {Array<RouterModules} routersModules Arary of router modules
   *
   * @return {Promise<void>}
   * @private
   */
  async _loadRouters(routerModules) {
    // List controller modules
    await asyncMap(routerModules, async (routerModule) => {
      try {
        await this._loadRouter(routerModule)
      } catch (error) {
        this.mid.error(`Error on load router ${routerModule.path}.`)
        throw error
      }
    })
  }

  /**
   * Load a validator module
   *
   * @param {ValidatorModule} validatorModule
   *
   * @return {Promise<void>}
   * @private
   */
  async _loadValidator(validatorModule) {
    const {
      export: { name, validator: ValidatorClass, services }
    } = validatorModule

    if (!name) throw new Error(`Missing .name inside file ${validatorModule.path}`)
    if (!ValidatorClass) throw new Error(`Missing .validator inside file ${validatorModule.path}`)
    this.validators[name] = await this._createModuleInstance(ValidatorClass, services, { name, routePlugin: this })
  }

  /**
   * Load a controller module
   *
   * @param {ControllerModule} controllerModule
   *
   * @return {Promise<void>}
   * @private
   */
  async _loadController(controllerModule) {
    const {
      export: { name, controller: ControllerClass, services }
    } = controllerModule

    if (!name) throw new Error(`Missing .name inside file ${controllerModule.path}`)
    if (!ControllerClass) throw new Error(`Missing .controller inside file ${controllerModule.path}`)

    this.controllers[name] = await this._createModuleInstance(ControllerClass, services, { name })
  }

  /**
   * Load a router module
   *
   * @param {RouterModule} routerModule
   *
   * @return {Promise<void>}
   * @private
   */
  _loadRouter(routerModule) {
    const {
      export: { router: RouterClass, controller, validator, services }
    } = routerModule

    // if (!name) throw new Error(`Missing .name inside file ${routerModule.path}`)
    if (!RouterClass) throw new Error(`Missing .router inside file ${routerModule.path}`)

    const properties = {
      routePlugin: this
    }

    if (validator) {
      properties.validator = this.getValidator(validator)
    }

    if (controller) {
      properties.controller = this.getController(controller)
    }

    return this._createModuleInstance(RouterClass, services, properties)
  }

  /**
   * Return a validator instance by his name
   *
   * @param {String} name Controller name
   *
   * @return {Controller}
   */
  getValidator(name) {
    if (!this.validators[name]) throw new Error(`Unknow validator ${name}.`)
    return this.validators[name]
  }

  /**
   * Return a controller instance by his name
   *
   * @param {String} name Controller name
   *
   * @return {Controller}
   */
  getController(name) {
    if (!this.controllers[name]) throw new Error(`Unknow controller ${name}.`)
    return this.controllers[name]
  }

  /**
   * Créate an instance of a router, a controller or avalidator
   *
   * @param {constructor}   Class      Module constructor
   * @param {Array<String>} services   Dependencies services
   * @param {Object}        properties Properties to set on the module instance
   *
   * @return {Promise<any>}
   * @private
   */
  async _createModuleInstance(Class, services, properties = null) {
    const args = [this.mid]

    // Add service dependencies
    if (services) {
      for (const service of services) {
        args.push(this.mid.getService(service))
      }
    }

    // Create module intance
    const instance = new Class(...args)

    // Set properties
    if (properties) {
      for (const property of Object.keys(properties)) {
        instance[property] = properties[property]
      }
    }

    // init controller
    await instance.init()

    return instance
  }

  /**
   *
   * @param {Route}  route     Route object
   * @param {Router} router    Router instance
   * @param {String} routePath Route path
   *
   * @return {function}
   * @private
   */
  _getBeforCallRoute(route, router, routePath) {
    // Before route middleware
    return async (req, res, next) => {
      this.mid.debug(`@midgar/route: beforeCallRoute ${route.method} ${routePath}`)
      try {
        /**
         * beforeCallRoute event.
         * @event @midgar/route:beforeCallRoute
         */
        await this.mid.emit('@midgar/route:beforeCallRoute', {
          route,
          req,
          res,
          router,
          next
        })
      } catch (error) {
        return next(error)
      }

      // Before exec route
      await router.beforeCallRoute(route, req, res)
      next()
    }
  }

  /**
   * Add route to express
   *
   * @param {Route}  route  Route object
   * @param {Router} router Router instance
   *
   * @return {Promise<void>}
   */
  async addRoute(route, router) {
    if (!route.method) {
      route.method = 'get'
    }

    // Get route path
    const routePath = this._getRoutePath(route, router)

    this.mid.debug(`@midgar/route: add route ${route.method} ${routePath}.`)

    // Route middleswares
    const args = [this._getBeforCallRoute(route, router, routePath)]

    // If route have a validator
    if (route.validator) {
      // Call validator method
      if (typeof route.validator === 'string') {
        route.validator = await router.validator[route.validator]()
      }

      if (typeof route.validator === 'function') {
        route.validator = await route.validator()
      }

      if (Array.isArray(route.validator)) {
        // Or call validator function
        args.push(route.validator)
      } else {
        args.push(checkSchema(route.validator))
      }
    }

    let action = null
    // Add controller action
    if (typeof route.action === 'string') {
      action = (...args) => router.controller[route.action](...args)
      /*args.push(async (...args) => {
        this.mid.debug(`@midgar/route: Call controller route ${route.method} ${routePath}.`)
          await controller[route.action](...args)
      })*/
    } else {
      action = (...args) => route.action(...args)
      // Or call action function
      // args.push(async (...args) => {
      // this.mid.debug(`@midgar/route: Call route  ${route.method} ${routePath}.`)
      // await route.action(...args)
      // })
    }

    args.push(async (req, res, next) => {
      this.mid.debug(`@midgar/route: Call route  ${route.method} ${routePath}.`)
      try {
        await action(req, res, next)
      } catch (error) {
        this._error(error, res, route, next)
      }
    })

    // Decalare the route to express
    this.app[route.method](routePath, ...args)
  }

  /**
   * Return the path of the route
   *
   * @param {Route}      route      Route définition
   * @param {Router}     router     Router Instance
   *
   * @return {String}
   * @private
   */
  _getRoutePath(route, router) {
    // Force / at first char
    let routePath = route.path.charAt(0) !== '/' ? '/' + route.path : route.path
    // remove last / or empty if routePath === '/'
    if (routePath.charAt(routePath.length - 1) === '/') routePath = routePath.slice(0, -1)
    // If controller have prefix had it to the path
    if (router.prefix && !route.ignorePrefix) {
      let prefix = router.prefix

      // Force / at first char
      if (prefix.charAt(0) !== '/') prefix = '/' + prefix

      // remove last /
      if (prefix.charAt(prefix.length - 1) === '/') prefix = prefix.slice(0, -1)
      routePath = prefix + routePath
    }

    return routePath
  }

  /**
   * Default error handler
   * @param {*} error
   * @param {*} res
   * @param {*} route
   * @param {*} next
   * @private
   */
  _error(error, res, route, next) {
    this.mid.error(`@midgar/route: error in route ${route.method} ${route.path} !`)
    next(error)
  }
}

export default RoutePlugin
export const dependencies = ['@midgar/service', '@midgar/express']
