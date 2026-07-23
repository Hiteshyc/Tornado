import User from "../models/User.js";

export const userRepository = {
  findByEmail(email, withPassword = false) {
    const query = User.findOne({ email });
    return withPassword ? query.select("+passwordHash +salt") : query;
  },

  findById(id) {
    return User.findById(id);
  },

  create(userData) {
    return User.create(userData);
  },

  incrementFailedAttempts(userId) {
    return User.findByIdAndUpdate(
      userId,
      { $inc: { failedLoginAttempts: 1 } },
      { new: true },
    );
  },

  lockAccount(userId, lockUntilDate) {
    return User.findByIdAndUpdate(
      userId,
      { accountLockedUntil: lockUntilDate },
      { new: true },
    );
  },

  resetLoginAttempts(userId) {
    return User.findByIdAndUpdate(
      userId,
      {
        failedLoginAttempts: 0,
        accountLockedUntil: null,
        lastLogin: new Date(),
      },
      { new: true },
    );
  },

  updatePassword(userId, passwordHash, salt) {
    return User.findByIdAndUpdate(
      userId,
      {
        passwordHash,
        salt,
        failedLoginAttempts: 0,
        accountLockedUntil: null,
        lastLogin: new Date(),
      },
      { new: true },
    );
  },
};
