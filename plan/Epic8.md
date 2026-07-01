## Epic 8: Frontend Trip Step Management

---

### TRIP-038 — Build add trip step form

**Description**

Create a form or modal for adding itinerary steps.

**Scope**

* Step type select
* Title field
* Description field
* Scheduled date/time field
* Google Maps URL field
* External URL field
* Ticket image upload
* Place image upload

**Acceptance Criteria**

* User can add a step from trip detail page
* Required fields are validated
* New step appears in itinerary
* Image preview works after upload

---

### TRIP-039 — Build edit trip step form

**Description**

Allow users to edit an existing itinerary step.

**Scope**

* Load existing step data
* Update step fields
* Update image URLs
* Save changes

**Acceptance Criteria**

* User can edit a step
* Updated step is reflected in itinerary
* Validation errors are displayed
* Cancel returns to trip detail without saving

---

### TRIP-040 — Build trip step card component

**Description**

Create a reusable card component for displaying itinerary steps.

**Scope**

* Show step type icon
* Show title
* Show scheduled time
* Show description
* Show Google Maps button if URL exists
* Show ticket button if ticket image exists
* Show place image preview if image exists
* Show status

**Acceptance Criteria**

* Step card displays correct data
* Map button opens Google Maps URL
* Ticket button opens ticket image
* Status is visually clear

---

### TRIP-041 — Add delete trip step UI

**Description**

Allow users to delete an itinerary step from the UI.

**Scope**

* Add delete button to step card
* Add confirmation dialog
* Call delete API
* Refresh itinerary after delete

**Acceptance Criteria**

* User can delete step
* Deleted step disappears from UI
* Cancel does not delete step

---

### TRIP-042 — Add drag-and-drop step reorder

**Description**

Allow users to reorder trip steps with drag-and-drop.

**Scope**

* Install and configure drag-and-drop library
* Enable dragging step cards
* Save order using reorder API
* Keep order after page refresh

**Acceptance Criteria**

* User can drag steps to reorder
* New order is saved
* Order remains correct after refresh
* UI handles API errors gracefully

---
