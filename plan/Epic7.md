## Epic 7: Frontend Trip Management

---

### TRIP-033 — Build dashboard page

**Description**

Create the main dashboard where users can see their trips.

**Scope**

* Fetch trips from API
* Show trip cards
* Show trip title
* Show destination
* Show date range
* Show status
* Show cover image if available
* Add create trip button

**Acceptance Criteria**

* User can see their own trips
* User can open trip detail
* User can create new trip from dashboard
* Empty state is shown when no trips exist

---

### TRIP-034 — Build create trip page

**Description**

Create a form for creating a new trip.

**Scope**

* Title field
* Destination field
* Description field
* Start date field
* End date field
* Cover image upload field
* Submit button

**Acceptance Criteria**

* User can create trip from UI
* Required fields are validated
* Created trip appears in dashboard
* User is redirected to trip detail after creation

---

### TRIP-035 — Build edit trip page

**Description**

Create a form for editing an existing trip.

**Scope**

* Load existing trip data
* Update trip fields
* Upload or change cover image
* Save changes

**Acceptance Criteria**

* User can edit trip information
* Updated trip data is displayed correctly
* Validation errors are shown
* User cannot edit non-existing trip

---

### TRIP-036 — Build trip detail page

**Description**

Create the trip detail page where users manage itinerary steps.

**Scope**

* Show trip information
* Show trip status
* Show ordered steps
* Add step button
* Edit trip button
* Delete trip button
* Start trip button
* Complete trip button

**Acceptance Criteria**

* Trip detail loads correctly
* Steps are displayed in order
* User can access add/edit step actions
* User can start trip from this page

---

### TRIP-037 — Add delete trip UI

**Description**

Allow users to delete a trip from the UI.

**Scope**

* Add delete button
* Add confirmation dialog
* Call delete API
* Redirect to dashboard after deletion

**Acceptance Criteria**

* User is asked to confirm before delete
* Deleted trip disappears from dashboard
* Cancel does not delete trip

---
