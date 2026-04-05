# TempShare - Feature Ideas

## High Priority

### 1. File Preview
- Image thumbnails on share page
- PDF preview with embedded viewer
- Video/audio metadata display (duration, codec)
- Text file syntax highlighting preview

### 2. Password Protection
- Optional password on file upload
- Password input on share page before download
- bcrypt hashed passwords stored in DB

### 3. Download Limits
- Maximum number of downloads (1, 5, 10, unlimited)
- Counter on share page showing remaining downloads
- Block download after limit reached

### 4. Upload Progress Bar
- Real-time progress indicator during upload
- Percentage complete display
- Cancel upload button

---

## Medium Priority

### 5. Email Sharing
- Send share link via email directly from app
- Optional recipient email field
- Simple email template with download link

### 6. Multiple File Upload
- Upload multiple files at once
- ZIP files on the server side for grouping
- Display file count on share page

### 7. File Metadata
- Store uploader IP (optional, for abuse prevention)
- Download count tracking
- Created date/time display
- Last downloaded timestamp

### 8. Custom Expiry
- Custom time input (not just presets)
- Date/time picker for specific expiry
- Auto-delete at specific time

### 9. Copy Link Modal
- Custom success modal after upload
- QR code generation for share URL
- Social share buttons (Twitter, etc.)

---

## Low Priority

### 10. Branding
- Custom logo/brand colors
- Custom domain support
- Theme customization

### 11. Admin Dashboard
- View all active shares
- Manual delete functionality
- Usage statistics
- Storage usage metrics

### 12. Rate Limiting
- Limit uploads per IP
- Prevent abuse/spam
- Configurable thresholds

### 13. Notifications
- Email when file expires (24h warning)
- Download notification email to uploader
- Optional feature toggle

### 14. Retention History
- Log of all downloads
- IP addresses of downloaders
- Audit trail for compliance

### 15. API Keys
- API access for programmatic uploads
- Rate limited API endpoints
- Usage quotas per key

---

## Technical Improvements

### 16. S3/Cloud Storage
- Support AWS S3, GCS, or R2
- Offload files from local disk
- Better scalability

### 17. Webhooks
- Trigger on upload/download
- Integrate with external services
- Event payload configuration

### 18. Chunked Uploads
- Support resumable uploads
- Better for large files over unstable connections
- tus protocol implementation

### 19. Compression
- Auto-compress uploads before storage
- Zip-based compression option
- Reduce storage costs

### 20. File Scanning
- Virus/malware scanning
- Content type validation
- Safe storage guarantee

---

## UX Improvements

### 21. Dark Mode
- Toggle in UI
- Respect system preference
- Persistent theme choice

### 22. Keyboard Shortcuts
- `Ctrl+V` to paste files
- `Enter` to confirm upload
- `Escape` to cancel

### 23. PWA Support
- Offline-capable upload page
- Installable app
- Better mobile experience

### 24. Paste from Clipboard
- `Ctrl+V` to upload from clipboard
- Drag image from browser
- Screen capture paste support

### 25. Internationalization
- Multiple language support
- i18n framework integration
- User locale detection

---

## Ideas for v2

### 26. Collections
- Group multiple files together
- Shared expiration timer for group
- Batch download as ZIP

### 27. File Requests
- Create upload links (one-way)
- Request files from others
- Anonymous drop-off feature

### 28. Expiring Links
- Expire any URL through the service
- No file upload required
- Short link with timer
