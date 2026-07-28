import Joi from "joi";

export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string()
    .pattern(/^[0-9+\-\s]{7,15}$/)
    .optional()
    .allow("", null)
    .messages({ "string.pattern.base": "Phone number must be 7–15 digits" }),
  password: Joi.string().min(6).max(128).required(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const verifyOtpSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string()
    .pattern(/^\d{6}$/)
    .required()
    .messages({ "string.pattern.base": '"otp" must be a 6-digit number' }),
});

export const resetPasswordSchema = Joi.object({
  resetToken: Joi.string().required(),
  newPassword: Joi.string().min(6).max(128).required(),
  confirmNewPassword: Joi.valid(Joi.ref("newPassword")).required().messages({
    "any.only": "Passwords do not match",
  }),
});

export function validate(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const message = error.details.map((d) => d.message).join(", ");
      return res.status(400).json({ message });
    }

    next();
  };
}
