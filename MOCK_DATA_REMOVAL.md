# Mock Data Removal - Listener System

## Overview

The listener discovery system has been updated to use **REAL DATA from the database** instead of mock/placeholder data. Only verified, approved listeners from the `listeners` table are now displayed.

## What Changed

### Before (Mock Data)
- `listenerService.getListeners()` returned hardcoded MOCK_LISTENERS array
- Always showed the same 6 fake listener profiles
- Data never changed regardless of database state
- Placeholder avatars and fake information

### After (Real Data)
- `listenerService.getListeners()` queries the `listeners` table via Supabase
- Only shows listeners with `verification_status = 'verified'`
- Only shows listeners with `accepts_new_patients = true`
- Real profiles from actual registered and approved listeners
- Empty state shown when no verified listeners exist

## Files Modified

1. **src/services/listener.service.ts**
   - Completely rewritten to query Supabase
   - Added filtering, pagination, and sorting
   - Added `transformListenerFromDB()` function to map DB schema to frontend types
   - Removed dependency on `MOCK_LISTENERS`

2. **src/services/dashboard.service.ts**
   - Updated `recommendedListener` to fetch from real data
   - Removed MOCK_LISTENERS import
   - Now uses `listenerService.getRecommended(1)`

3. **src/services/booking.service.ts**
   - Updated to fetch real listener data
   - Removed MOCK_LISTENERS import
   - Now uses `listenerService.getListenerById()`

## How It Works

### Listener Discovery Flow

```typescript
// 1. User visits /listeners page
// 2. Frontend calls listenerService.getListeners()
// 3. Service queries Supabase:

SELECT * FROM listeners
WHERE verification_status = 'verified'
  AND accepts_new_patients = true
ORDER BY rating DESC, reviews_count DESC;

// 4. Results transformed to Listener type
// 5. Displayed in UI
```

### Filtering

The service supports filtering by:
- **Expertise/Specialization**: `params.expertise` 
- **Languages**: `params.language`
- **Max Price**: `params.maxPrice`
- **Minimum Rating**: `params.rating`

### Data Transformation

Database schema → Frontend Listener type:

```typescript
{
  id: dbListener.id,
  name: dbListener.name,
  avatar: dbListener.avatar_url,
  bio: dbListener.bio,
  title: dbListener.professional_title,
  expertise: dbListener.specialization,
  languages: dbListener.languages,
  rating: dbListener.rating,
  reviewCount: dbListener.reviews_count,
  // ... etc
}
```

## Empty State Handling

When no verified listeners exist:
- `getListeners()` returns `{ listeners: [], total: 0 }`
- `getRecommended()` returns `[]`
- UI should show appropriate empty state message

Recommended empty state message:
> "No listeners are currently available. Check back soon!"

## Badge Generation

Badges are auto-generated based on listener attributes:

| Badge | Criteria |
|-------|----------|
| Verified | `verification_status = 'verified'` |
| Top Rated | `rating >= 4.8` |
| Trusted | `reviews_count > 50` |
| Experienced | `years_of_experience >= 10` |

## Testing Real Listener Data

### 1. Verify Database Has Listeners

```sql
SELECT 
  id, 
  name, 
  professional_title, 
  verification_status,
  accepts_new_patients,
  rating,
  reviews_count
FROM listeners
WHERE verification_status = 'verified';
```

### 2. If No Listeners Exist

Create test listener via approved application or directly:

```sql
INSERT INTO listeners (
  user_id,
  name,
  professional_title,
  specialties,
  specialization,
  bio,
  languages,
  verification_status,
  accepts_new_patients,
  consultation_fee,
  rating,
  reviews_count,
  years_of_experience
) VALUES (
  '00000000-0000-0000-0000-000000000000', -- User UUID
  'Dr. Sarah Chen',
  'Licensed Clinical Psychologist',
  ARRAY['anxiety', 'stress', 'depression'],
  ARRAY['anxiety', 'stress', 'depression'],
  'Experienced therapist specializing in anxiety and stress management',
  ARRAY['English', 'Mandarin'],
  'verified',
  true,
  7500, -- $75.00
  4.9,
  127,
  8
);
```

### 3. Verify Service Returns Real Data

```typescript
// In browser console or component
const { listeners } = await listenerService.getListeners();
console.log('Real listeners:', listeners);
// Should show actual database records, not mock data
```

## Migration Guide

### For Frontend Developers

No changes needed! The `Listener` type interface remains the same.

### For Backend Developers

Ensure `listeners` table has:
- ✅ `verification_status` column with values: 'pending', 'verified', 'rejected'
- ✅ `accepts_new_patients` boolean column
- ✅ Proper indexes on `verification_status` and `rating`
- ✅ RLS policies allowing authenticated users to read verified listeners

## Impact on Other Features

### ✅ No Impact
- Connection requests (already uses user_connections table)
- Messaging (already uses conversations/messages tables)
- Appointments (already uses appointments table)
- Admin dashboard (already queries database directly)

### ⚠️ Requires Testing
- Listener profile pages (ensure they work with real IDs)
- Booking flow (ensure it handles real listener data)
- Search functionality (test with actual listener names)
- Filtering (test with real specializations/languages)

## Backwards Compatibility

The mock data files (`src/mocks/listeners.mock.ts`) are **NOT deleted** to avoid breaking:
- Test suites that may reference them
- Storybook stories
- Development utilities

However, they are **NO LONGER USED** in the production application flow.

## Performance Considerations

### Database Queries
- Listener queries are indexed on `verification_status` and `rating`
- Pagination implemented (default: 20 per page)
- Supabase RLS policies optimized for read performance

### Caching
- Consider adding React Query for client-side caching
- API route caching for frequently accessed listener lists
- CDN caching for listener avatar images

## Security Notes

### RLS Policies
Only verified listeners are exposed:

```sql
CREATE POLICY "Anyone can view verified listeners" 
  ON listeners FOR SELECT
  USING (verification_status = 'verified');
```

### Data Exposure
- Listener contact info (email, phone) is NOT exposed via API
- Only public-facing profile data is returned
- Personal verification documents remain private

## Next Steps

1. ✅ **Phase 3 Complete**: Mock data removed, real listeners displayed
2. ⏭️ **Phase 4**: Implement connection request workflow
3. ⏭️ **Phase 7**: Implement feedback/ratings (currently returns empty array)
4. ⏭️ **Phase 10**: Track session counts for `sessionCount` field

## Troubleshooting

### "No listeners found"
- Check if any listeners have `verification_status = 'verified'`
- Verify `accepts_new_patients = true`
- Check RLS policies allow read access

### "Listener not found" error
- Verify listener ID exists in database
- Check if listener is verified
- Ensure user has permission to view listener

### Type errors
- Ensure database schema matches TypeScript types
- Check `database.types.ts` is up to date
- Run `supabase gen types typescript` if needed

## Support

For issues or questions about the real listener system:
1. Check database has verified listeners
2. Verify RLS policies are correct
3. Test API endpoint directly: `/api/listeners`
4. Review browser console for errors
5. Check Supabase logs for query issues
