## Epic 10: Sharing, Future Version

---

### TRIP-047 — Add public share token to Trip

**Description**

Prepare trip sharing by adding a public share token field to Trip.

**Scope**

* Add `publicShareToken`
* Add `isPublicShared`
* Update database migration

**Acceptance Criteria**

* Trip can store share token
* Sharing can be enabled or disabled
* Existing trips still work after migration

---

### TRIP-048 — Implement create share link API

**Description**

Allow users to generate a public read-only trip link.

**API**

```http
POST /api/trips/{tripId}/share
```

**Scope**

* Validate trip ownership
* Generate public token
* Save token to trip
* Return public share URL

**Acceptance Criteria**

* User can generate share link for own trip
* User cannot generate share link for another user's trip
* API returns public URL

---

### TRIP-049 — Implement public trip view API

**Description**

Allow anyone with a share token to view a trip.

**API**

```http
GET /api/public/trips/{token}
```

**Scope**

* Find trip by public token
* Return trip detail and ordered steps
* Do not require authentication
* Do not expose private user data

**Acceptance Criteria**

* Public trip can be viewed without login
* Invalid token returns not found
* Public response does not expose sensitive data

---

### TRIP-050 — Build public shared trip page

**Description**

Create a public read-only page for shared trips.

**Route**

```text
/share/:token
```

**Scope**

* Load trip by token
* Show trip info
* Show ordered itinerary
* Show map and ticket buttons
* Hide edit/delete buttons

**Acceptance Criteria**

* Shared trip page works without login
* Visitors can view itinerary
* Visitors cannot edit trip
* Invalid share link shows not found message

---
