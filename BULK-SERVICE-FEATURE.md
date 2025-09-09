# Bulk Service Creation Feature

## Overview
Implemented a comprehensive bulk service creation feature for the customer and service management system, allowing administrators to create multiple services for a single customer with predefined categories and pricing.

## Features Implemented

### 1. Bulk Service Creation Button
- Added "Toplu Hizmet Tanımla" button in the services page
- Only visible to users with `canEditServices` permission
- Located next to the regular "Hizmet Ekle" button

### 2. Service Categories with Predefined Configurations
The following service categories are available with default pricing:

| Category | Default Price | Description |
|----------|---------------|-------------|
| **Adisyon Programı** | 200 TL | Restoran adisyon programı lisansı |
| **QR Menu** | 50 TL | QR menü sistemi |
| **Kurye Uygulaması** | 100 TL | Kurye takip uygulaması |
| **Patron Uygulaması** | 150 TL | Patron yönetim uygulaması |
| **Yemek Sepeti** | 300 TL | Yemek Sepeti entegrasyonu |
| **Migros Yemek** | 250 TL | Migros Yemek entegrasyonu |
| **Trendyol Yemek** | 280 TL | Trendyol Yemek entegrasyonu |
| **Getir Yemek** | 270 TL | Getir Yemek entegrasyonu |

### 3. Quick Selection Groups
Four predefined quick selection options:

#### 🔵 **Sadece Program Lisansı**
- Adisyon Programı
- Total: 200 TL

#### 🔴 **Yemek Uygulamaları**
- Yemek Sepeti
- Trendyol Yemek
- Migros Yemek
- Getir Yemek
- Total: 1,100 TL

#### 🟢 **Tam Paket**
- Adisyon Programı
- QR Menu
- Kurye Uygulaması
- Patron Uygulaması
- Total: 500 TL

#### 🟣 **Komple Çözüm**
- All 8 categories included
- Total: 1,600 TL

### 4. Interactive UI Features

#### Service Selection Interface
- **Card-based selection**: Each service category displayed as a clickable card
- **Visual feedback**: Selected services highlighted with primary color border
- **Checkbox integration**: Visual confirmation of selected items
- **Individual toggles**: Click anywhere on card or use checkboxes
- **Remove badges**: Selected services shown as removable badges

#### Quick Selection
- **One-click packages**: Instant selection of common service combinations
- **Color-coded buttons**: Each package has distinct color scheme
- **Smart selection**: Replaces current selection with package contents

#### Form Controls
- **Customer selection**: Dropdown with all available customers
- **Company name**: Optional field (defaults to customer name)
- **Payment period**: 1 month, 6 months, 1 year, 2 years, 3 years, unlimited, custom
- **Currency**: TL, USD, EUR support
- **Date pickers**: Start and end dates with automatic calculation based on payment period

#### Real-time Calculations
- **Dynamic pricing**: Total price updates as services are selected/deselected
- **Automatic dates**: End date automatically calculated based on start date and payment period
- **Service counter**: Submit button shows number of services to be created

### 5. Technical Implementation

#### Frontend Components
- **BulkServiceModal.jsx**: Main modal component with full functionality
- **Service categories configuration**: Predefined service templates with pricing
- **Form validation**: Ensures required fields are completed
- **Error handling**: User-friendly error messages with toast notifications

#### Backend API
- **Bulk creation endpoint**: `/api/services/bulk`
- **Transaction safety**: All services created in database transaction
- **Automatic reminders**: Creates reminders for non-unlimited services
- **Validation**: Server-side validation for all service data
- **Error handling**: Comprehensive error responses with proper HTTP status codes

#### Performance Optimizations
- **Batch operations**: All services created in single transaction
- **Reduced API calls**: Single bulk request instead of multiple individual requests
- **Automatic refresh**: Services list updated after successful creation

### 6. User Experience Features

#### Validation & Feedback
- **Required field validation**: Customer and service selection required
- **Real-time feedback**: Immediate visual feedback for selections
- **Progress indication**: Loading states during submission
- **Success notifications**: Confirmation with number of services created
- **Error handling**: Clear error messages for failed operations

#### Accessibility
- **Keyboard navigation**: Full keyboard support for all interactions
- **Screen reader friendly**: Proper labels and descriptions
- **Focus management**: Logical tab order through form elements
- **Color contrast**: Accessible color schemes for all elements

### 7. Integration Points

#### Database Integration
- **Prisma transactions**: Ensures data consistency
- **Foreign key relationships**: Proper customer-service linking
- **Reminder automation**: Automatic reminder creation for expiring services
- **Index optimization**: Leverages existing database indexes for performance

#### Existing System Integration
- **Permission system**: Respects existing user permissions
- **Service management**: Integrates with existing service CRUD operations
- **Customer system**: Uses existing customer data and relationships
- **UI consistency**: Matches existing design patterns and components

## Usage Workflow

1. **Access**: Click "Toplu Hizmet Tanımla" button on services page
2. **Select Customer**: Choose customer from dropdown
3. **Quick Select** (optional): Use predefined packages or select manually
4. **Customize**: Add/remove individual services as needed
5. **Configure**: Set payment period, dates, and company name
6. **Review**: Check selected services and total price
7. **Submit**: Create all services with one click
8. **Confirm**: Receive success notification and see updated services list

## Benefits

### For Users
- **Time Saving**: Create multiple services in single operation
- **Consistency**: Standardized pricing and configurations
- **Flexibility**: Mix and match services or use predefined packages
- **Error Reduction**: Automated calculations and validations

### For Business
- **Standardization**: Consistent service offerings and pricing
- **Efficiency**: Faster customer onboarding process
- **Scalability**: Easy to add new service categories
- **Compliance**: Proper reminder creation and data integrity

## Technical Files Created/Modified

### New Files
- `components/servicesPage/BulkServiceModal.jsx` - Main bulk service creation modal
- `app/api/services/bulk/route.js` - Bulk service creation API endpoint

### Modified Files
- `app/services/page.js` - Added bulk service button and handlers
- Various performance optimizations with useCallback hooks

## Future Enhancements
- **Templates**: Save and reuse custom service combinations
- **Pricing Rules**: Dynamic pricing based on quantity or customer type
- **Import/Export**: Bulk service creation from CSV/Excel files
- **Scheduling**: Schedule bulk service activation for future dates
- **Notifications**: Email notifications for bulk service creation
