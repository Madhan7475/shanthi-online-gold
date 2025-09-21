# Admin Profile Management Feature

## Overview
The Admin Profile Management system allows administrators to manage their own profiles and oversee all user accounts in the system. This feature provides comprehensive user management capabilities with proper authentication and role-based access control.

## Features

### 1. My Profile Management
- **View Profile**: Display admin's name, email, phone, role, and registration date
- **Edit Profile**: Update name, email, and phone number
- **Validation**: Email and phone uniqueness validation
- **Real-time Updates**: Changes reflect immediately after saving

### 2. User Management Dashboard
- **User Statistics**: Overview of total users, customers, admins, and new users
- **User Listing**: Paginated table showing all users with their details
- **Search Functionality**: Search by name, email, or phone number
- **Role Filtering**: Filter users by customer or admin role
- **Role Management**: Update user roles between customer and admin
- **Safety Checks**: Prevent removal of the last admin user

### 3. User Interface
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **AdminLayout Integration**: Consistent admin interface with navigation
- **Loading States**: Visual feedback during API operations
- **Error Handling**: User-friendly error messages and success notifications
- **Pagination**: Efficient handling of large user lists

## API Endpoints

### Backend Routes (`/api/admin`)
- `GET /profile` - Get admin's own profile
- `PUT /profile` - Update admin's own profile
- `GET /users` - Get all users with pagination and search
- `GET /users/:id` - Get single user details
- `PUT /users/:id/role` - Update user role
- `GET /stats` - Get user statistics

### Authentication
- Requires admin authentication via `adminAuth` middleware
- Supports both Firebase tokens and local JWT tokens
- Validates admin role before granting access

## Database Schema

### User Model Fields
- `name`: User's full name
- `email`: Unique email address (lowercase, sparse)
- `phone`: Unique phone number (sparse)
- `role`: Either 'customer' or 'admin'
- `firebaseUid`: Firebase authentication ID (sparse)
- `createdAt`: Registration timestamp
- `updatedAt`: Last modification timestamp

## Component Structure

```
frontend/src/components/Admin/
└── AdminProfileManagement.jsx     # Main component with tabs and functionality
```

### Key Features
- **Tab Interface**: Switch between "My Profile" and "User Management"
- **State Management**: React hooks for all data and UI state
- **API Integration**: RESTful API calls with proper error handling
- **Form Validation**: Client-side validation with server-side verification
- **Permissions**: Role-based access control and safety measures

## Usage

### For Admins
1. Navigate to `/admin/profiles`
2. Use "My Profile" tab to update personal information
3. Use "User Management" tab to:
   - View user statistics
   - Search and filter users
   - Change user roles
   - Monitor user activity

### Security Features
- Admin authentication required for all operations
- Email and phone uniqueness validation
- Prevention of last admin removal
- Secure token-based authentication
- Input sanitization and validation

## Installation

1. Backend routes are automatically registered in `server.js`
2. Frontend component is integrated into the admin routing system
3. No additional dependencies required - uses existing packages

## Environment Variables
- `VITE_API_URL`: Frontend API base URL (defaults to `http://localhost:9000/api`)

## Error Handling

The system includes comprehensive error handling for:
- Network connectivity issues
- Authentication failures  
- Validation errors
- Server errors
- User permission violations

## Responsive Design

The interface adapts to different screen sizes:
- **Desktop**: Full sidebar navigation with detailed tables
- **Tablet**: Optimized layout with maintained functionality
- **Mobile**: Responsive tables and touch-friendly controls

## Future Enhancements

Potential improvements:
- Bulk user operations
- User export functionality
- Advanced filtering options
- User activity logs
- Email notifications for role changes
- Profile picture uploads
