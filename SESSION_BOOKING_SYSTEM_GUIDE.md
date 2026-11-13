# Session Booking System - Complete Guide

## Overview

This is a **specialized booking form system** where listeners can send booking forms to users, allowing users to book mental health support sessions with customized time slots and pricing.

## How It Works

### Step 1: Listener Creates Booking Form

The listener sets up their availability and pricing:

```json
{
  "title": "Book a Session with Me",
  "description": "I'm here to help you with your mental health journey",
  "available_slots": [
    {"date": "2024-01-15", "time": "09:00", "timezone": "UTC"},
    {"date": "2024-01-15", "time": "14:00", "timezone": "UTC"},
    {"date": "2024-01-16", "time": "10:00", "timezone": "UTC"},
    {"date": "2024-01-16", "time": "15:00", "timezone": "UTC"}
  ],
  "duration_pricing": {
    "15": 2500,  // $25.00 for 15 minutes
    "30": 4500,  // $45.00 for 30 minutes
    "45": 6500,  // $65.00 for 45 minutes
    "60": 8000   // $80.00 for 60 minutes
  },
  "support_areas": [
    "Anxiety",
    "Depression", 
    "Stress Management",
    "Relationships",
    "Career Counseling",
    "Other"
  ]
}
```

### Step 2: Listener Sends Form to User in Chat

- Click "Listener Actions" → "Send Booking Form"
- Select which booking form to send
- Form appears as special message in chat

### Step 3: User Fills Out Booking Form

User sees a form with:

**1. Choose Time Slot** (radio buttons)
- Monday, Jan 15 at 9:00 AM
- Monday, Jan 15 at 2:00 PM
- Tuesday, Jan 16 at 10:00 AM
- Tuesday, Jan 16 at 3:00 PM

**2. Choose Duration & Price** (radio buttons with pricing)
- ⏱️ 15 minutes - $25.00
- ⏱️ 30 minutes - $45.00
- ⏱️ 45 minutes - $65.00
- ⏱️ 60 minutes - $80.00

**3. Support Area** (dropdown or radio)
- Anxiety
- Depression
- Stress Management
- Relationships
- Career Counseling
- Other

**4. Describe Your Needs** (text area)
```
Please describe what you'd like to discuss in this session...
```

### Step 4: User Submits Booking

- Booking is created with status: "pending"
- Listener receives notification
- User sees confirmation

### Step 5: Listener Confirms/Manages Booking

Listener can:
- ✅ Confirm booking → Add meeting URL
- ❌ Cancel booking → With reason
- 📝 Add notes
- ✅ Mark as completed after session

### Step 6: After Session - Request Feedback

- Listener can request feedback for the booking
- User rates the session and listener
- Feedback is tied to the specific booking

## Database Schema

### Table 1: `session_booking_forms`
Listener's reusable booking form template.

**Key Fields**:
- `listener_id` - Who created this form
- `available_slots` - JSONB array of date/time slots
- `duration_pricing` - JSONB object with duration:price pairs
- `support_areas` - JSONB array of support categories
- `is_active` - Whether this form can be sent

### Table 2: `session_bookings`
Individual booking requests from users.

**Key Fields**:
- `booking_form_id` - Which form template was used
- `listener_id` - Listener being booked
- `user_id` - User making booking
- `selected_slot` - JSONB with chosen date/time
- `selected_duration` - 15, 30, 45, or 60 minutes
- `price_amount` - Price in cents at time of booking
- `support_area` - Chosen category
- `support_details` - User's description
- `status` - pending, confirmed, cancelled, completed, no_show
- `meeting_url` - Video call link (added after confirmation)

### Table 3: `feedback_requests` & `feedback_responses`
Post-session feedback system (same as before).

## Installation

### Run the SQL Script

1. Open Supabase SQL Editor
2. Copy all SQL from `CREATE_SESSION_BOOKING_SYSTEM.sql`
3. Run it
4. Verify tables created:
   - `session_booking_forms`
   - `session_bookings`
   - `feedback_requests`
   - `feedback_responses`

## Example Workflow

### Example 1: Simple Booking

**Listener creates form**:
```json
{
  "available_slots": [
    {"date": "2024-01-20", "time": "14:00"},
    {"date": "2024-01-21", "time": "10:00"}
  ],
  "duration_pricing": {
    "30": 5000,
    "60": 9000
  }
}
```

**User books**:
```json
{
  "selected_slot": {"date": "2024-01-20", "time": "14:00"},
  "selected_duration": 30,
  "price_amount": 5000,
  "support_area": "Anxiety",
  "support_details": "I've been experiencing panic attacks and need help managing them."
}
```

**Listener confirms**:
```sql
UPDATE session_bookings
SET 
  status = 'confirmed',
  meeting_url = 'https://meet.google.com/abc-defg-hij',
  confirmed_at = now()
WHERE id = 'booking-id';
```

### Example 2: User Cancels

```sql
UPDATE session_bookings
SET 
  status = 'cancelled',
  cancelled_at = now()
WHERE id = 'booking-id' AND user_id = auth.uid();
```

### Example 3: Session Completed

```sql
UPDATE session_bookings
SET 
  status = 'completed',
  completed_at = now(),
  meeting_notes = 'Great session, user made good progress on anxiety management techniques.'
WHERE id = 'booking-id' AND listener_id = auth.uid();
```

## UI Components Needed

### 1. Booking Form Builder (`/listener/booking-forms/create`)

**Form Fields**:
- Title (text input)
- Description (textarea)
- Available Time Slots (date + time picker, add multiple)
- Duration & Pricing:
  - [ ] 15 mins - $___
  - [ ] 30 mins - $___
  - [ ] 45 mins - $___
  - [ ] 60 mins - $___
- Support Areas (checkboxes or tags)
- [Save Form] button

### 2. Booking Form Selector in Chat

When listener clicks "Send Booking Form":
- Shows list of their active booking forms
- Click to send to user
- Creates special message type in chat

### 3. Booking Form Display (User View)

Chat message shows:
```
┌─────────────────────────────────────┐
│ 📅 Book a Session                    │
│                                      │
│ Choose a time slot:                  │
│ ○ Mon, Jan 15 at 9:00 AM            │
│ ○ Mon, Jan 15 at 2:00 PM            │
│ ○ Tue, Jan 16 at 10:00 AM           │
│                                      │
│ Choose duration:                     │
│ ○ 15 mins - $25                      │
│ ○ 30 mins - $45 ⭐ Popular           │
│ ○ 45 mins - $65                      │
│ ○ 60 mins - $80                      │
│                                      │
│ What support do you need?            │
│ [Dropdown: Anxiety ▼]                │
│                                      │
│ Tell me more:                        │
│ [Text area...]                       │
│                                      │
│ Total: $45.00                        │
│ [Book Session] [Cancel]              │
└─────────────────────────────────────┘
```

### 4. Bookings Dashboard (`/listener/bookings`)

**Tabs**:
- Pending (need confirmation)
- Confirmed (upcoming sessions)
- Completed (past sessions)
- Cancelled

**Each booking shows**:
- User name & avatar
- Date & time
- Duration & price
- Support area & details
- Actions: [Confirm] [Cancel] [Add Meeting URL] [Mark Complete]

### 5. User Bookings Page (`/my-bookings`)

Shows user's bookings with status:
- Pending - "Waiting for listener confirmation"
- Confirmed - Shows meeting URL, countdown
- Completed - "Rate this session" button
- Cancelled - Shows reason

## API Routes Needed

### POST /api/booking-forms/create
```typescript
{
  title: string;
  description?: string;
  available_slots: Array<{date: string, time: string}>;
  duration_pricing: Record<string, number>;
  support_areas?: string[];
}
```

### GET /api/booking-forms/list
Returns listener's booking forms.

### POST /api/messages/send-booking-form
```typescript
{
  conversation_id: string;
  booking_form_id: string;
}
```

### POST /api/bookings/create
```typescript
{
  booking_form_id: string;
  selected_slot: {date: string, time: string};
  selected_duration: 15 | 30 | 45 | 60;
  support_area: string;
  support_details: string;
}
```

### PATCH /api/bookings/{id}/confirm
```typescript
{
  meeting_url: string;
  meeting_notes?: string;
}
```

### PATCH /api/bookings/{id}/cancel
```typescript
{
  reason?: string;
}
```

### PATCH /api/bookings/{id}/complete
```typescript
{
  meeting_notes?: string;
}
```

### GET /api/bookings/list
Query params: `status=pending|confirmed|completed|cancelled`

## Message Type for Chat

Add new message type: `'session_booking_form'`

**Message content structure**:
```json
{
  "booking_form_id": "uuid",
  "title": "Book a Session",
  "description": "...",
  "available_slots": [...],
  "duration_pricing": {...},
  "support_areas": [...],
  "booking_id": "uuid (after user submits)"
}
```

## Payment Integration (Future)

This system is **payment-ready**:
- Prices stored in cents
- Price locked at booking time
- Can integrate Stripe/PayPal later
- For now: Manual payment or "pay later"

## Benefits of This Approach

✅ **Fixed format** - No complex form builder needed
✅ **Clear workflow** - Listener sets availability, user chooses
✅ **Pricing transparency** - User sees price before booking
✅ **Scalable** - Easy to add features (recurring slots, cancellation policies)
✅ **Professional** - Like booking a therapy session on any professional platform
✅ **Payment ready** - Structure supports future payment integration

## Next Steps

1. ✅ **Run SQL script** - Create database tables
2. ⏳ **Build Booking Form Creator** - UI for listeners to create forms
3. ⏳ **Build Booking Form Message** - Display in chat for users
4. ⏳ **Build Bookings Dashboard** - For listeners to manage bookings
5. ⏳ **Build My Bookings Page** - For users to see their bookings
6. ⏳ **Add notifications** - Email/push when booking confirmed
7. ⏳ **Add calendar sync** - Export to Google Calendar
8. ⏳ **Add payment** - Integrate Stripe (optional)

The database structure is ready and designed specifically for your use case! 🎯
