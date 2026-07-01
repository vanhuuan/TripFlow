## Epic 2: Authentication

---

### TRIP-005 — Create User entity and authentication models

**Description**

Create the user model and authentication-related request/response DTOs.

**Scope**

* Create `User` entity
* Add email
* Add display name
* Add password hash
* Add created date
* Add auth request DTOs
* Add auth response DTOs

**Acceptance Criteria**

* User table can be created in database
* User model supports login and signup flow
* DTOs are separated from entity models

---

### TRIP-006 — Implement user signup API

**Description**

Implement the signup endpoint for new users.

**API**

```http
POST /api/auth/signup
```

**Scope**

* Validate email
* Validate password
* Validate display name
* Check duplicate email
* Hash password securely
* Save new user
* Return user info and JWT token

**Acceptance Criteria**

* User can create an account
* Duplicate email is rejected
* Password is not stored as plain text
* Successful signup returns JWT token

---

### TRIP-007 — Implement user login API

**Description**

Implement the login endpoint for existing users.

**API**

```http
POST /api/auth/login
```

**Scope**

* Validate email and password
* Check password hash
* Return JWT token
* Return basic user information

**Acceptance Criteria**

* User can log in with valid credentials
* Invalid credentials return proper error
* Successful login returns JWT token
* Password is never returned in API response

---

### TRIP-008 — Implement current user API

**Description**

Implement an endpoint to return the currently logged-in user.

**API**

```http
GET /api/auth/me
```

**Scope**

* Read user ID from JWT
* Return current user profile
* Protect endpoint with authentication

**Acceptance Criteria**

* Authenticated user can get their profile
* Anonymous request is rejected
* Returned data does not include password hash

---

### TRIP-009 — Add JWT authentication middleware

**Description**

Configure JWT authentication for protected backend APIs.

**Scope**

* Configure JWT settings
* Add authentication middleware
* Add authorization middleware
* Protect trip and trip step endpoints
* Add helper for current user ID

**Acceptance Criteria**

* Protected APIs require valid token
* Invalid token returns unauthorized
* Backend can identify current user from JWT

---
