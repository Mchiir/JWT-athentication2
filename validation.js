//export more fun using Object literal
const Joi = require('joi');

const userSchema = Joi.object({
  id: Joi.number().integer().required().allow(null),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  country: Joi.string().required(),
  password: Joi.string().required()
});

function validateUserData(data) {
  return userSchema.validate(data);
}

const validate_delete = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  password: Joi.string().required()
});

const update = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  country: Joi.string().required(),
  password: Joi.string().required(),
});

function update_data(data){
  return update.validate(data);
}

const validate_del = (values) =>{
  return validate_delete.validate(values);
}

module.exports = {
  validateUserData,
  validate_del,
  update_data
 }; //importing : { validateUserData, validate_del } = require('./validation');
//using these fun in your App codes: const { error, value } = validateDeleteData(req.body);
 







//Using "named Exports from" syntax
/*

const Joi = require('joi');

const userSchema = Joi.object({
  //codes...
});

export function validateUserData(data) {
  return userSchema.validate(data);
}

const validate_delete = Joi.object({
  //codes....
});

validate_del = (values) =>{
  return validate_delete.validate(values);
}


 export { validateUserData, validate_del };
 //import : { validateUserData, validate_del } from './validation';
*/

//using direct exporting direct named exports:
/*

const Joi = require('joi');

const userSchema = Joi.object({
  //codes...
});

export function validateUserData(data) {
  return userSchema.validate(data);
}

const validate_delete = Joi.object({
  //codes....
});

export function validate_del(values){
  return validate_delete.validate(values);
}


export finished;
 //import : { validate_del, validate_also } from './validate_functions';
*/