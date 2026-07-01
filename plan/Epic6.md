## Epic 6: Frontend Authentication

---

### TRIP-029 — Build login page

**Description**

Create the login page for existing users.

**Scope**

* Email input
* Password input
* Submit button
* Validation
* Call login API
* Store JWT token
* Redirect to dashboard after login

**Acceptance Criteria**

* User can log in from UI
* Invalid login shows error message
* Successful login redirects to dashboard
* Token is stored correctly

---

### TRIP-030 — Build signup page

**Description**

Create the signup page for new users.

**Scope**

* Display name input
* Email input
* Password input
* Confirm password input
* Validation
* Call signup API
* Store JWT token
* Redirect to dashboard after signup

**Acceptance Criteria**

* User can create account from UI
* Duplicate email shows error
* Password mismatch shows validation error
* Successful signup redirects to dashboard

---

### TRIP-031 — Implement frontend auth state

**Description**

Create frontend authentication state management.

**Scope**

* Create auth context or hook
* Store current user
* Store JWT token
* Load current user on app start
* Add logout function

**Acceptance Criteria**

* App knows whether user is logged in
* User remains logged in after refresh
* Logout clears token and redirects to login

---

### TRIP-032 — Add protected routes

**Description**

Protect authenticated frontend pages.

**Scope**

* Create `ProtectedRoute` component
* Redirect anonymous users to login
* Allow authenticated users to access dashboard and trip pages

**Acceptance Criteria**

* Anonymous user cannot access dashboard
* Anonymous user cannot access trip pages
* Logged-in user can access protected pages

---
