## Epic 3: Trip Management

---

### TRIP-010 — Create Trip entity and TripStatus enum

**Description**

Create the core Trip entity.

**Scope**

* Create `Trip` entity
* Create `TripStatus` enum
* Add relationship between User and Trip
* Add EF Core configuration

**Trip Fields**

* ID
* User ID
* Title
* Destination
* Description
* Start date
* End date
* Cover image URL
* Status
* Created date
* Updated date

**Acceptance Criteria**

* Trip table is created
* Trip belongs to a user
* Trip status supports Draft, Active, and Completed
* Trip entity is included in database context

---

### TRIP-011 — Implement create trip API

**Description**

Allow authenticated users to create a new trip.

**API**

```http
POST /api/trips
```

**Scope**

* Validate trip title
* Validate destination
* Save trip under current user
* Default status to Draft
* Return created trip

**Acceptance Criteria**

* Authenticated user can create trip
* Anonymous user cannot create trip
* New trip belongs to current user
* New trip has Draft status by default

---

### TRIP-012 — Implement get trips API

**Description**

Return all trips owned by the current user.

**API**

```http
GET /api/trips
```

**Scope**

* Return only current user's trips
* Sort by start date or created date
* Include trip status
* Include cover image URL

**Acceptance Criteria**

* User only sees their own trips
* Trip list returns required fields
* Anonymous request is rejected

---

### TRIP-013 — Implement get trip detail API

**Description**

Return detailed information for a selected trip.

**API**

```http
GET /api/trips/{tripId}
```

**Scope**

* Get trip by ID
* Validate ownership
* Include ordered trip steps
* Return full trip detail

**Acceptance Criteria**

* User can view their own trip
* User cannot view another user's trip
* Trip steps are ordered by order index
* Not found is returned for invalid trip ID

---

### TRIP-014 — Implement update trip API

**Description**

Allow users to update trip information.

**API**

```http
PUT /api/trips/{tripId}
```

**Scope**

* Validate ownership
* Update title
* Update destination
* Update description
* Update start date
* Update end date
* Update cover image URL
* Update modified date

**Acceptance Criteria**

* User can update their own trip
* User cannot update another user's trip
* Updated date is changed
* Invalid data returns validation error

---

### TRIP-015 — Implement delete trip API

**Description**

Allow users to delete a trip.

**API**

```http
DELETE /api/trips/{tripId}
```

**Scope**

* Validate ownership
* Delete trip
* Delete related trip steps
* Return success response

**Acceptance Criteria**

* User can delete their own trip
* User cannot delete another user's trip
* Related trip steps are removed
* Deleted trip no longer appears in dashboard

---

### TRIP-016 — Implement start trip API

**Description**

Allow users to start a trip and move it into active mode.

**API**

```http
POST /api/trips/{tripId}/start
```

**Scope**

* Validate ownership
* Change trip status to Active
* Optionally set other active trips to Draft or Completed later
* Return updated trip

**Acceptance Criteria**

* User can start their own trip
* Trip status changes to Active
* Started trip can be opened in focus mode

---

### TRIP-017 — Implement complete trip API

**Description**

Allow users to mark a trip as completed.

**API**

```http
POST /api/trips/{tripId}/complete
```

**Scope**

* Validate ownership
* Change trip status to Completed
* Return updated trip

**Acceptance Criteria**

* User can complete their own trip
* Trip status changes to Completed
* Completed trip no longer appears as active

---
