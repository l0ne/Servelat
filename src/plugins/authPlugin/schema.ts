import Joi from "@hapi/joi";
import {RouteOptionsResponseSchema} from "@hapi/hapi";

export const apiTokenSchema = Joi.object({
  tokenId: Joi.number().integer().required(),
})

export const loginValidateSchema = Joi.object({
  email: Joi.string().email().required(),
}) as RouteOptionsResponseSchema;

export const authValidateSchema = Joi.object({
  email: Joi.string().email().required(),
  emailToken: Joi.string().required(),
}) as RouteOptionsResponseSchema;
