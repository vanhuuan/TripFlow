## Epic 9: Focus Mode

---

### TRIP-043 — Build focus mode page

**Description**

Create a dedicated focus mode page for active trips.

**Route**

```text
/trips/:tripId/focus
```

**Scope**

* Load trip detail
* Show trip title
* Show trip progress
* Show current step
* Show next steps
* Hide unnecessary dashboard controls

**Acceptance Criteria**

* Focus mode displays active trip clearly
* Current Todo step is highlighted
* Completed steps are separated or collapsed
* Page is mobile-friendly

---

### TRIP-044 — Implement current step logic

**Description**

Determine which step should be shown as the current step.

**Logic**

The current step should be the first step with status `Todo`, ordered by `orderIndex`.

**Scope**

* Find first Todo step
* Show it as current step
* Show Done and Skipped steps separately
* Handle case where all steps are done

**Acceptance Criteria**

* First Todo step is shown as current
* Done steps are not selected as current
* Skipped steps are not selected as current
* Completed trip message is shown when all steps are done or skipped

---

### TRIP-045 — Add focus mode step actions

**Description**

Add action buttons to the focus mode current step.

**Scope**

* Open Google Maps
* View ticket image
* Open external URL
* Mark as Done
* Skip step

**Acceptance Criteria**

* Map button opens Google Maps in new tab
* Ticket button opens ticket image
* External URL opens in new tab
* Done button updates step status
* Skip button updates step status
* Current step moves to next Todo step after action

---

### TRIP-046 — Connect start trip flow to focus mode

**Description**

When the user starts a trip, redirect them to focus mode.

**Scope**

* Call start trip API
* Update trip status to Active
* Redirect to `/trips/:tripId/focus`
* Add continue active trip button on dashboard

**Acceptance Criteria**

* Clicking Start Trip activates the trip
* User is redirected to focus mode
* Dashboard shows active trip
* Continue Active Trip opens focus mode

---
