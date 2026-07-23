# Authentication & Authorization Design

**Project:** Coastal Hazard Prevention Application

------------------------------------------------------------------------

# 1. Overview

The Authentication & Authorization module provides secure identity
management, role-based access control (RBAC), session management, and
API protection for the Coastal Hazard Prevention Application.

## Responsibilities

-   User Registration
-   User Login
-   User Logout
-   JWT Authentication
-   Refresh Token Management
-   Password Hashing (bcrypt)
-   Role-Based Access Control (RBAC)
-   Forgot / Reset Password
-   Change Password
-   User Profile Management
-   Account Lockout
-   Audit Logging
-   Security Middleware

------------------------------------------------------------------------

# 2. User Roles

  Role      Permissions
  --------- -----------------------------------------
  Admin     Full system access
  Officer   Operational access with limited control
  User      Monitor hazards and report incidents

------------------------------------------------------------------------

# 3. Architecture

``` text
Next.js Frontend
        │
        ▼
 Express Routes
        │
        ▼
 Validation Middleware
        │
        ▼
 Controllers
        │
        ▼
 Services
        │
        ▼
 Repositories
        │
        ▼
 MongoDB
```

------------------------------------------------------------------------

# 4. Backend Directory Structure

``` text
backend/src/
├── config/
├── controllers/
├── middleware/
├── models/
├── repositories/
├── routes/
├── services/
├── utils/
├── validations/
└── app.js
```

------------------------------------------------------------------------

# 5. Folder Responsibilities

## config/

-   Database connection
-   JWT configuration
-   Environment variables
-   Logger configuration

Functions

-   connectDB()
-   loadEnvironment()
-   getAccessTokenSecret()
-   getRefreshTokenSecret()

------------------------------------------------------------------------

## models/

### User

Stores

-   Name
-   Email
-   Password Hash
-   Role
-   Verification Status
-   Failed Login Attempts
-   Account Lock Time

### RefreshToken

Stores hashed refresh tokens.

### AuditLog

Stores authentication events.

------------------------------------------------------------------------

## repositories/

Database access only.

### user.repository.js

-   createUser()
-   findByEmail()
-   findById()
-   updateProfile()
-   updatePassword()
-   updateFailedAttempts()
-   resetFailedAttempts()
-   lockAccount()
-   unlockAccount()

### token.repository.js

-   saveRefreshToken()
-   findRefreshToken()
-   deleteRefreshToken()
-   deleteAllUserTokens()

### audit.repository.js

-   createAuditLog()

------------------------------------------------------------------------

## services/

Business logic.

### auth.service.js

-   registerUser()
-   loginUser()
-   logoutUser()
-   refreshSession()
-   forgotPassword()
-   resetPassword()
-   changePassword()
-   checkAccountLock()
-   incrementFailedAttempts()
-   resetFailedAttempts()

### password.service.js

-   hashPassword()
-   comparePassword()
-   generateSalt()

### token.service.js

-   generateAccessToken()
-   generateRefreshToken()
-   verifyAccessToken()
-   verifyRefreshToken()
-   hashRefreshToken()

### email.service.js

-   sendVerificationEmail()
-   sendPasswordResetEmail()

------------------------------------------------------------------------

## controllers/

Thin request handlers.

### auth.controller.js

-   register()
-   login()
-   logout()
-   refresh()
-   forgotPassword()
-   resetPassword()
-   changePassword()

### user.controller.js

-   getProfile()
-   updateProfile()

------------------------------------------------------------------------

## routes/

### Authentication

-   POST /api/auth/register
-   POST /api/auth/login
-   POST /api/auth/logout
-   POST /api/auth/refresh
-   POST /api/auth/forgot-password
-   POST /api/auth/reset-password
-   POST /api/auth/change-password

### User

-   GET /api/users/profile
-   PATCH /api/users/profile

------------------------------------------------------------------------

## middleware/

### authenticate.js

-   verifyJWT()

### authorize.js

-   allowRoles()

### validate.js

-   validateBody()

### rateLimiter.js

-   loginLimiter()

### auditLogger.js

-   logAction()

### errorHandler.js

-   handleError()

------------------------------------------------------------------------

## validations/

Schemas

-   registerSchema
-   loginSchema
-   resetPasswordSchema
-   changePasswordSchema

------------------------------------------------------------------------

## utils/

### jwt.js

-   signJWT()
-   verifyJWT()

### bcrypt.js

-   hash()
-   compare()

### crypto.js

-   generateRandomToken()
-   encrypt()
-   decrypt()

### response.js

-   successResponse()
-   errorResponse()

------------------------------------------------------------------------

# 6. Database Design

## User

``` javascript
{
  _id,
  name,
  email,
  phone,
  passwordHash,
  role,
  isVerified,
  failedLoginAttempts,
  accountLockedUntil,
  lastLogin,
  createdAt,
  updatedAt
}
```

Indexes

-   email (unique)
-   phone (unique)

------------------------------------------------------------------------

## RefreshToken

``` javascript
{
  _id,
  userId,
  tokenHash,
  expiresAt,
  revoked,
  createdAt
}
```

------------------------------------------------------------------------

## AuditLog

``` javascript
{
  _id,
  userId,
  action,
  ipAddress,
  browser,
  device,
  timestamp
}
```

------------------------------------------------------------------------

# 7. Authentication Flow

## Registration

``` text
Validate Input
      ↓
Email Exists?
      ↓
Hash Password
      ↓
Create User
      ↓
Success
```

## Login

``` text
Find User
      ↓
Locked?
      ↓
Compare Password
      ↓
Generate JWT
      ↓
Store Refresh Token
      ↓
Return Tokens
```

## Protected Route

``` text
Access Token
      ↓
JWT Verification
      ↓
Authentication
      ↓
Authorization
      ↓
Controller
```

------------------------------------------------------------------------

# 8. Password Security

-   bcrypt hashing
-   Automatic Salt Generation
-   Cost Factor: 12
-   Never store plain passwords

------------------------------------------------------------------------

# 9. JWT Strategy

## Access Token

-   Lifetime: 15 minutes
-   Payload

``` json
{
  "userId": "...",
  "role": "USER",
  "tokenVersion": 1
}
```

## Refresh Token

-   Lifetime: 7--30 days
-   Store only hashed value

------------------------------------------------------------------------

# 10. RBAC

``` text
Admin
 ├── Full Access

Officer
 ├── Operational Access

User
 ├── Monitor
 └── Report
```

------------------------------------------------------------------------

# 11. Security Features

-   Helmet
-   CORS
-   HTTPS
-   bcrypt
-   JWT
-   Zod/Joi Validation
-   NoSQL Injection Protection
-   XSS Sanitization
-   Rate Limiting
-   Audit Logging

------------------------------------------------------------------------

# 12. Account Lockout

Policy

-   5 failed login attempts
-   Lock account for 15 minutes
-   Successful login resets counter
-   Password reset unlocks account

Fields

-   failedLoginAttempts
-   accountLockedUntil

------------------------------------------------------------------------

# 13. Next.js Integration

``` text
frontend/
├── lib/
│   └── axios.ts
├── services/
│   └── auth.service.ts
├── hooks/
│   └── useAuth.ts
├── context/
│   └── AuthContext.tsx
└── middleware.ts
```

Responsibilities

-   Centralized Axios instance
-   Token refresh interceptor
-   Auth Context
-   Route protection
-   Role-based page guards

------------------------------------------------------------------------

# 14. Development Roadmap

1.  Environment & Database
2.  Mongo Models
3.  Repository Layer
4.  Password & JWT Services
5.  Authentication Service
6.  Controllers
7.  Routes
8.  Middleware
9.  Next.js Integration
10. Forgot Password
11. Account Lockout
12. Audit Logging

------------------------------------------------------------------------

# 15. Future Enhancements

-   Email Verification
-   MFA / 2FA
-   OAuth (Google/Microsoft)
-   Session Management
-   Token Blacklisting
-   Device Fingerprinting
-   Fine-grained Permissions

------------------------------------------------------------------------

# 16. Best Practices

-   Controllers should never access MongoDB directly.
-   Services contain all business logic.
-   Repositories only perform database operations.
-   Hash passwords before storage.
-   Hash refresh tokens before saving.
-   Validate every request.
-   Use HTTPS in production.
-   Log every authentication event.
-   Keep JWT payload minimal.

------------------------------------------------------------------------

# 17. Conclusion

This authentication module follows a scalable layered architecture with
clear separation of concerns. It is suitable for production-style MERN
applications and integrates cleanly with a Next.js frontend while
remaining independent of the AI and hazard management modules.
