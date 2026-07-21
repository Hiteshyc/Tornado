import crypto from "crypto";

/**
 * Derives a per-user salt from their name + email.
 * NOTE: bcrypt already embeds its own cryptographically random salt
 * inside the hash it produces. This value is an additional "pepper"
 * layered onto the password before bcrypt hashing — it does not
 * replace bcrypt's own salting, and since email/name are not secret,
 * it should not be relied on as the sole source of randomness.
 */
export function generateSalt(name, email) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedName = name.trim().toLowerCase();

  // Random bytes ensure the salt isn't purely guessable from public info,
  // even though it's seeded with name/email as required.
  const randomComponent = crypto.randomBytes(16).toString("hex");

  return crypto
    .createHash("sha256")
    .update(`${normalizedName}:${normalizedEmail}:${randomComponent}`)
    .digest("hex");
}
