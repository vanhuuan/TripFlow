## Epic 4: Trip Step Management

---

### TRIP-018 — Create TripStep entity and enums

**Description**

Create the TripStep entity used to store itinerary items.

**Scope**

* Create `TripStep` entity
* Create `TripStepType` enum
* Create `TripStepStatus` enum
* Add relationship between Trip and TripStep
* Add EF Core configuration

**TripStep Types**

* Place
* Transport
* Hotel
* Restaurant
* Activity
* Note

**TripStep Statuses**

* Todo
* Done
* Skipped

**Acceptance Criteria**

* TripStep table is created
* TripStep belongs to a Trip
* Step type and status are supported
* TripStep has order index field

---

### TRIP-019 — Implement create trip step API

**Description**

Allow users to add a new itinerary step to a trip.

**API**

```http
POST /api/trips/{tripId}/steps
```

**Scope**

* Validate trip ownership
* Add new step to trip
* Set default status to Todo
* Set default order index to end of list
* Save Google Maps URL if provided
* Save ticket image URL if provided
* Save place image URL if provided

**Acceptance Criteria**

* User can add step to their own trip
* New step appears at the end of itinerary
* Step supports place, ticket, hotel, restaurant, activity, and note data
* User cannot add step to another user's trip

---

### TRIP-020 — Implement get trip steps API

**Description**

Return all steps for a selected trip.

**API**

```http
GET /api/trips/{tripId}/steps
```

**Scope**

* Validate trip ownership
* Return ordered steps
* Include all step fields

**Acceptance Criteria**

* User can view steps for their own trip
* Steps are ordered by order index
* User cannot view steps from another user's trip

---

### TRIP-021 — Implement update trip step API

**Description**

Allow users to update a trip step.

**API**

```http
PUT /api/trips/{tripId}/steps/{stepId}
```

**Scope**

* Validate trip ownership
* Validate step belongs to trip
* Update title
* Update description
* Update type
* Update scheduled date/time
* Update Google Maps URL
* Update external URL
* Update ticket image URL
* Update place image URL

**Acceptance Criteria**

* User can update their own trip step
* User cannot update another user's trip step
* Step updated date is changed
* Invalid step ID returns not found

---

### TRIP-022 — Implement delete trip step API

**Description**

Allow users to delete a step from a trip.

**API**

```http
DELETE /api/trips/{tripId}/steps/{stepId}
```

**Scope**

* Validate trip ownership
* Validate step belongs to trip
* Delete step
* Recalculate or preserve order indexes

**Acceptance Criteria**

* User can delete their own step
* Deleted step no longer appears in itinerary
* User cannot delete another user's step

---

### TRIP-023 — Implement reorder trip steps API

**Description**

Allow users to reorder itinerary steps.

**API**

```http
POST /api/trips/{tripId}/steps/reorder
```

**Request Example**

```json
{
  "stepIds": ["step-1", "step-2", "step-3"]
}
```

**Scope**

* Validate trip ownership
* Validate all step IDs belong to trip
* Update order indexes based on submitted list

**Acceptance Criteria**

* User can reorder their own trip steps
* Order is saved after refresh
* Invalid step IDs return validation error

---

### TRIP-024 — Implement mark step as done API

**Description**

Allow users to mark a trip step as done.

**API**

```http
POST /api/trips/{tripId}/steps/{stepId}/done
```

**Scope**

* Validate trip ownership
* Validate step belongs to trip
* Change step status to Done

**Acceptance Criteria**

* User can mark step as done
* Done step is reflected in focus mode
* User cannot update another user's step

---

### TRIP-025 — Implement skip step API

**Description**

Allow users to skip a trip step.

**API**

```http
POST /api/trips/{tripId}/steps/{stepId}/skip
```

**Scope**

* Validate trip ownership
* Validate step belongs to trip
* Change step status to Skipped

**Acceptance Criteria**

* User can skip step
* Skipped step is reflected in focus mode
* User cannot update another user's step

---
