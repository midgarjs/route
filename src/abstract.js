import { validationResult } from 'express-validator'

export default class Abstract {
  /**
   * Return an array containing validator errors
   *
   * @param {Request} req Express request
   *
   * @return {Error}
   */
  getValidatorErrors(req) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return errors.array()
    } else {
      return []
    }
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
}
