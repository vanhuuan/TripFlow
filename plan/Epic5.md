## Epic 5: File Upload

---

### TRIP-026 — Implement image upload API

**Description**

Create an API for uploading ticket images, place images, and trip cover images.

**API**

```http
POST /api/files/upload
```

**Scope**

* Accept image files only
* Support JPG, JPEG, PNG, WEBP
* Reject invalid file types
* Limit file size to 5MB
* Save files locally under `/uploads`
* Return public file URL

**Acceptance Criteria**

* User can upload valid image
* Invalid file type is rejected
* Large file is rejected
* API returns usable image URL

---

### TRIP-027 — Serve uploaded files publicly

**Description**

Configure backend to serve uploaded files.

**Scope**

* Add static file serving
* Expose `/uploads` path
* Ensure uploaded image URLs can be viewed from frontend

**Acceptance Criteria**

* Uploaded image URL opens in browser
* Frontend can display uploaded images
* Missing files return not found

---

### TRIP-028 — Prepare storage abstraction for future Azure Blob

**Description**

Create a storage service abstraction so local upload can be replaced by Azure Blob later.

**Scope**

* Create `IFileStorageService`
* Create `LocalFileStorageService`
* Move upload logic into service
* Keep controller simple

**Acceptance Criteria**

* File upload still works
* Storage logic is not inside controller
* Future Azure Blob implementation can be added easily

---
