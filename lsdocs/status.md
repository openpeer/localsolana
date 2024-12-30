# List Status Update API Changes

## Overview
We've improved the list status update functionality by adding a dedicated PATCH endpoint and simplifying the PUT endpoint to avoid unnecessary validation when only updating status.

## API Endpoints

### 1. PATCH `/api/list_management/:id` (New)
Dedicated endpoint for status-only updates.

```typescript
// Request
{
  "status": number // 0 (inactive) or 1 (active)
}

// Response
{
  "status": 200,
  "message": "List has been updated successfully",
  "data": {
    "id": string,
    "status": number,
    // ... other list fields
  }
}
```

### 2. PUT `/api/list_management/:id` (Modified)
The existing PUT endpoint now handles status updates more gracefully by:
- Only validating price-related fields when they are included in the request
- Accepting minimal payloads for status-only updates

```typescript
// Minimal status update request
{
  "id": string,
  "status": number
}

// Full update request
{
  "id": string,
  "type": "SellList" | "BuyList",
  "status": number,
  "margin_type": number,
  "margin": string,
  // ... other optional fields
}
```

## Status Values
- `0`: Inactive
- `1`: Active

## Implementation Details

### Backend Changes
1. Added new `updateListStatus` endpoint for PATCH requests
2. Modified `updateList` to:
   - Only validate price fields when necessary
   - Accept minimal payloads for status updates
   - Preserve existing values for unspecified fields

### Error Handling
- `400 Bad Request`: Invalid status value or list not found
- `500 Server Error`: Unexpected server issues

## Migration Guide

### For Frontend Developers
1. For status-only updates, use the new PATCH endpoint:
```typescript
await api.patch(`/api/list_management/${listId}`, { status: newStatus });
```

2. For PUT requests, only include fields that are being updated:
```typescript
// Before
const payload = {
  id: listId,
  type: "SellList",
  status: newStatus,
  margin_type: 1,
  margin: "1.05",
  // ... many other fields
};

// After
const payload = {
  id: listId,
  status: newStatus
};
```

### Breaking Changes
- None. The PUT endpoint maintains backward compatibility
- The new PATCH endpoint is optional but recommended for status updates

## Examples

### Activate a List
```bash
curl -X PATCH "http://localhost:3000/api/list_management/102" \
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${TOKEN}" \
-d '{"status": 1}'
```

### Deactivate a List
```bash
curl -X PATCH "http://localhost:3000/api/list_management/102" \
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${TOKEN}" \
-d '{"status": 0}'
```

## Related Files
- `controllers/lists/update.js`
- `controllers/lists/shared/validation.js`
- Frontend components handling list activation/deactivation

## Testing Notes
- Verify both PATCH and PUT endpoints handle status updates correctly
- Test with both floating and fixed rate listings
- Ensure existing price validation still works for full updates
