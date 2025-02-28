## [1.2.9] - 2025-02-03

### Changed
- Version bump

## [1.2.8] - 2025-01-30

### Changed
- Version bump

## [1.2.7] - 2025-01-30

### Changed
- Version bump

## [1.2.6] - 2025-01-30

### Changed
- Version bump

## [1.2.5] - 2025-01-30

### Changed
- Version bump

## [1.2.4] - 2025-01-30

### Changed
- Version bump

## [1.2.0] - 2024-01-04

### Changed
- Improved file upload UX with preview and two-step process
- Simplified SKU generation with ID and acronym fields
- Split upload form components for better maintainability
- Made storage bucket private for enhanced security
- Added file upload utilities and SKU generator

### Security
- Storage bucket set to private
- Added proper RLS policies for file access
- Improved file upload security checks

## [1.1.0] - 2024-01-04

### Changed
- Improved dashboard layout with new sidebar navigation
- Enhanced user interface with better component organization
- Extracted layout components for better maintainability

## [1.0.0] - 2024-01-04

### Added
- Initial release of Print Files Manager
- Authentication system with email/password login
- Dashboard layout with sidebar navigation
- File management structure
- Database schema with:
  - User roles (admin/staff)
  - Files table with tracking
  - Row Level Security (RLS) policies
- Security improvements:
  - Updated OTP expiration settings
  - Secure function execution paths
  - Rate limiting configuration

### Database Schema State
The current database schema includes:
- user_roles table (enum: admin, staff)
- files table with:
  - id (uuid)
  - name (text)
  - path (text)
  - size (bigint)
  - uploaded_by (uuid)
  - created_at (timestamptz)
  - updated_at (timestamptz)
  - status (text: active, archived, deleted)

All tables have appropriate RLS policies configured for security.