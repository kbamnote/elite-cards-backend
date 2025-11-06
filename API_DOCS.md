# API Documentation

Base URL prefix: `/api`

Authentication: Protected endpoints require the `Authorization: Bearer <token>` header (JWT issued by the login endpoint).

---

## Auth Endpoints (`/api/auth`)

### POST `/api/auth/register`
- Description: Register a new user.
- Authentication: No
- Request Body (JSON):
```
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "secret123",
  "phone": "+1234567890"
}
```
- Success Response (201):
```
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "...",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "phone": "+1234567890",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  }
}
```
- Error Responses:
  - 400 Validation failed
  - 409 Email already in use
  - 500 Server error

### POST `/api/auth/login`
- Description: Login and retrieve a JWT.
- Authentication: No
- Request Body (JSON):
```
{
  "email": "jane@example.com",
  "password": "secret123"
}
```
- Success Response (200):
```
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "<jwt>",
    "user": {
      "_id": "...",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "phone": "+1234567890",
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```
- Error Responses:
  - 400 Validation failed
  - 401 Invalid email or password
  - 500 Server error

### GET `/api/auth/me`
- Description: Get the current authenticated user.
- Authentication: Yes
- Headers: `Authorization: Bearer <token>`
- Success Response (200):
```
{
  "success": true,
  "message": "User profile fetched",
  "data": {
    "user": {
      "_id": "...",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "phone": "+1234567890"
    }
  }
}
```
- Error Responses:
  - 401 Not authorized
  - 500 Server error

### PUT `/api/auth/profile`
- Description: Update user profile details.
- Authentication: Yes
- Headers: `Authorization: Bearer <token>`
- Request Body (JSON) — any subset of fields:
```
{
  "name": "Jane D.",
  "email": "jane.d@example.com",
  "phone": "+1234567890",
  "password": "newStrongPass"
}
```
- Success Response (200):
```
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": { "_id": "...", "name": "Jane D.", "email": "jane.d@example.com", "phone": "+1234567890" }
  }
}
```
- Error Responses:
  - 400 Validation failed
  - 409 Email already in use
  - 401 Not authorized
  - 500 Server error

---

## Card Endpoints (`/api/cards`)

### POST `/api/cards`
- Description: Create a new card.
- Authentication: Yes
- Headers: `Authorization: Bearer <token>`
- Request Body (JSON):
```
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "company": "Elite Associates",
  "designation": "Product Manager",
  "website": "https://example.com",
  "socialLinks": ["https://linkedin.com/in/jane", "https://twitter.com/jane"],
  "profileImage": "https://s3.amazonaws.com/bucket/images/jane.jpg",
  "backgroundColor": "#222222",
  "textColor": "#ffffff",
  "isActive": true
}
```
- Success Response (201):
```
{
  "success": true,
  "message": "Card created successfully",
  "data": { "card": { "_id": "...", "cardId": "abcd1234", "name": "Jane Doe", "email": "jane@example.com", "scanCount": 0, "createdAt": "..." } }
}
```
- Error Responses:
  - 400 Validation failed
  - 401 Not authorized
  - 500 Server error

### GET `/api/cards`
- Description: Get all cards for the authenticated user.
- Authentication: Yes
- Headers: `Authorization: Bearer <token>`
- Success Response (200):
```
{
  "success": true,
  "message": "Cards fetched",
  "data": { "cards": [ { "_id": "...", "cardId": "abcd1234", "name": "..." } ] }
}
```
- Error Responses:
  - 401 Not authorized
  - 500 Server error

### GET `/api/cards/:cardId`
- Description: Get a public card by its `cardId`.
- Authentication: No
- Path Params: `cardId` (string)
- Success Response (200):
```
{
  "success": true,
  "message": "Card fetched",
  "data": { "card": { "_id": "...", "cardId": "abcd1234", "name": "..." } }
}
```
- Error Responses:
  - 400 Missing cardId
  - 404 Card not found
  - 500 Server error

### PUT `/api/cards/:cardId`
- Description: Update card fields (owner only).
- Authentication: Yes
- Headers: `Authorization: Bearer <token>`
- Path Params: `cardId` (string)
- Request Body (JSON) — any subset:
```
{
  "name": "Jane D.",
  "website": "https://new.example.com",
  "socialLinks": ["https://linkedin.com/in/jane"]
}
```
- Success Response (200):
```
{
  "success": true,
  "message": "Card updated successfully",
  "data": { "card": { "_id": "...", "cardId": "abcd1234", "name": "Jane D." } }
}
```
- Error Responses:
  - 400 Validation failed or missing cardId
  - 401 Not authorized
  - 404 Card not found or not owned by user
  - 500 Server error

### DELETE `/api/cards/:cardId`
- Description: Delete a card (owner only).
- Authentication: Yes
- Headers: `Authorization: Bearer <token>`
- Path Params: `cardId` (string)
- Success Response (200):
```
{
  "success": true,
  "message": "Card deleted successfully"
}
```
- Error Responses:
  - 400 Missing cardId
  - 401 Not authorized
  - 404 Card not found or not owned by user
  - 500 Server error

### POST `/api/cards/:cardId/scan`
- Description: Log a card scan. Increments `scanCount` and saves a `ScanLog`.
- Authentication: No (optionally includes authenticated `scannedBy` if a token is present)
- Path Params: `cardId` (string)
- Request Body (JSON):
```
{
  "latitude": 19.1234,
  "longitude": 72.9876,
  "device": "iPhone 15 Pro"
}
```
- Success Response (201):
```
{
  "success": true,
  "message": "Scan logged",
  "data": { "log": { "_id": "...", "cardId": "...", "device": "iPhone 15 Pro", "timestamp": "..." } }
}
```
- Error Responses:
  - 400 Missing cardId
  - 404 Card not found
  - 500 Server error

### GET `/api/cards/:cardId/analytics`
- Description: Get scan analytics for a card.
- Authentication: Yes
- Headers: `Authorization: Bearer <token>`
- Path Params: `cardId` (string)
- Success Response (200):
```
{
  "success": true,
  "message": "Analytics fetched",
  "data": {
    "totalScans": 42,
    "dailyBreakdown": [ { "_id": "2025-01-01", "count": 5 } ],
    "recentScans": [ { "_id": "...", "device": "...", "timestamp": "..." } ],
    "scanCountField": 42
  }
}
```
- Error Responses:
  - 400 Missing cardId
  - 401 Not authorized
  - 404 Card not found
  - 500 Server error

---

## Upload Endpoints (`/api/upload`)

### POST `/api/upload/image`
- Description: Upload an image to S3 (optionally resized to max 1024×1024 if `sharp` is installed).
- Authentication: Yes
- Headers: `Authorization: Bearer <token>`; `Content-Type: multipart/form-data`
- Form Fields:
  - `image` (file) — required
  - `folder` (text) — optional, defaults to `images`
- Success Response (201):
```
{
  "success": true,
  "message": "Image uploaded",
  "data": {
    "key": "images/1700000000000_abcd1234.jpg",
    "url": "https://s3.<region>.amazonaws.com/<bucket>/images/1700000000000_abcd1234.jpg",
    "eTag": "\"etag123\""
  }
}
```
- Error Responses:
  - 400 No file provided / Invalid payload / Multer validation errors
  - 401 Not authorized
  - 500 Failed to upload image

### DELETE `/api/upload/image`
- Description: Delete an image from S3 by object key.
- Authentication: Yes
- Headers: `Authorization: Bearer <token>`
- Request: Provide `key` either in JSON body or query string.
```
{
  "key": "images/1700000000000_abcd1234.jpg"
}
```
- Success Response (200):
```
{
  "success": true,
  "message": "Image deleted",
  "data": { "key": "images/1700000000000_abcd1234.jpg" }
}
```
- Error Responses:
  - 400 S3 key is required
  - 401 Not authorized
  - 500 Failed to delete image

---

## Error Response Format
All error responses follow the shape:
```
{
  "success": false,
  "message": "<error message>",
  "errors": [ { "field": "<field>", "message": "<validation message>" } ] // optional
}
```

## Health Check
Public endpoint for service health:
- GET `/health` → `{ "status": "ok" }`