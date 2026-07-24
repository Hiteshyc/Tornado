import Joi from "joi";
import { validate } from "./authValidation.js";

export const createAlertSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  severity: Joi.string()
    .valid("critical", "high", "moderate", "low", "safe")
    .required(),
  location: Joi.string().min(2).max(200).required(),
  lat: Joi.number().min(-90).max(90).required(),
  lng: Joi.number().min(-180).max(180).required(),
  expectedHours: Joi.number().min(0).required(),
  action: Joi.string().min(5).max(500).required(),
});

export const createAnnouncementSchema = Joi.object({
  agency: Joi.string().min(2).max(200).required(),
  badge: Joi.string()
    .valid("WEATHER", "RESPONSE", "EVACUATION", "MARITIME", "HEALTH", "OTHER")
    .required(),
  title: Joi.string().min(3).max(300).required(),
  body: Joi.string().min(10).required(),
  priority: Joi.string()
    .valid("critical", "high", "moderate", "low")
    .default("moderate"),
});

export const createSafetyGuideSchema = Joi.object({
  key: Joi.string()
    .lowercase()
    .pattern(/^[a-z]+$/)
    .min(2)
    .max(50)
    .required(),
  title: Joi.string().min(2).max(100).required(),
  icon: Joi.string().max(10).required(),
  dos: Joi.array().items(Joi.string().min(3)).min(1).required(),
  donts: Joi.array().items(Joi.string().min(3)).min(1).required(),
  order: Joi.number().integer().min(0).default(0),
});

// Re-export validate so routes only need one import
export { validate };
