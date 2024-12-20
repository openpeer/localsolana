# Lists API Documentation

## Overview
The Lists API provides endpoints for managing P2P trading listings. All endpoints are prefixed with `/api`.

## Authentication
Most endpoints require authentication via Bearer token:
```http
Authorization: Bearer <token>
```

## Data Models

### List Model
```typescript
interface List {
  id: number;
  chain_id: number;              // Default: 1
  seller_id: number;
  token_id: number;
  fiat_currency_id: number;
  total_available_amount: number;
  limit_min: number | null;      // Optional
  limit_max: number | null;      // Optional
  margin_type: 0 | 1;            // 0=fixed, 1=floating
  margin: number;
  terms: string;                 // HTML allowed
  automatic_approval: boolean;
  status: number;                // 0=inactive, 1=active, 2=cancelled
  payment_method_id: number;
  type: "BuyList" | "SellList";
  bank_id: number;
  deposit_time_limit: number;    // In minutes
  payment_time_limit: number;    // In minutes
  accept_only_verified: boolean;
  accept_only_trusted: boolean;  // Default: false
  escrow_type: 0 | 1;           // 0=manual, 1=instant
  price_source: 0 | 1;          // 0=coingecko, 1=binance
  price: number | null;         // Required if margin_type=0
  created_at: Date;
  updated_at: Date;
}
```

## Endpoints

### 1. Create List
**POST** `/api/createList`

Creates a new buy/sell listing.

#### Authentication Required: Yes

#### Request Body
```typescript
interface CreateListRequest {
  chain_id?: number;              // Optional, defaults to 1
  token_id: number;               // Required: Token being traded
  fiat_currency_id: number;       // Required: Fiat currency
  total_available_amount: number; // Required: Total amount
  limit_min?: number;            // Optional: Minimum trade limit
  limit_max?: number;            // Optional: Maximum trade limit
  margin_type: 0 | 1;            // Required: 0=fixed, 1=floating
  margin?: number;               // Required if margin_type=1
  price?: number;                // Required if margin_type=0
  terms?: string;                // Optional: Trading terms
  automatic_approval?: boolean;   // Optional
  type: "BuyList" | "SellList";  // Required
  payment_methods: Array<{       // Required
    bank_id: number;             
    values?: Record<string, any> // Required for SellList
  }>;
  deposit_time_limit?: number;   
  payment_time_limit?: number;   
  accept_only_verified?: boolean;
  escrow_type?: 0 | 1;          // 0=manual, 1=instant
  price_source?: number;         // 0=coingecko, 1=binance
}
```

### 2. Get All Lists
**GET** `/api/getLists`

Retrieves all active listings with pagination and filtering.

#### Authentication Required: No

#### Query Parameters
```typescript
interface ListQueryParams {
  type?: "BuyList" | "SellList";
  amount?: number;
  currency?: number;        // fiat_currency_id
  payment_method?: number;
  token?: number;          // token_id
  fiat_amount?: number;
  page?: number;           // default: 1
  pageSize?: number;       // default: 20
}
```

### 3. Get My Ads
**GET** `/api/lists/ads`

Retrieves authenticated user's listings.

#### Authentication Required: Yes

#### Query Parameters
```typescript
interface MyAdsParams {
  page?: number;    // default: 1
  pageSize?: number; // default: 20
}
```

### 4. Update List
**PUT** `/api/list_management/:id`

Updates an existing listing.

#### Authentication Required: Yes

#### Request Body
Same as Create List endpoint.

### 5. Delete List
**DELETE** `/api/list_management/:id`

Deletes a listing and its associated payment methods.

#### Authentication Required: Yes

### 6. Get List Count
**GET** `/api/getListsCount`

Returns total number of active listings.

#### Authentication Required: No

### 7. Get User Lists
**GET** `/api/lists`

Retrieves listings for a specific user.

#### Authentication Required: No

#### Query Parameters
```typescript
interface UserListsParams {
  seller: string;   // Required: User address
  page?: number;    // default: 1
  pageSize?: number; // default: 10
}
```

## Implementation Details

### Buy Lists vs Sell Lists

#### 1. Payment Methods Structure

**BuyList Payment Methods**
```typescript
interface BuyListPaymentMethod {
  bank_id: number;      // Required: ID of the bank
}
```

**SellList Payment Methods**
```typescript
interface SellListPaymentMethod {
  bank_id: number;           // Required: ID of the bank
  values: {                  // Required: Payment details
    account_number?: string; // Bank account number
    account_name?: string;   // Bank account name
    branch_code?: string;    // Bank branch code
    additional_info?: string;// Any additional payment instructions
    [key: string]: any;     // Other bank-specific fields
  };
}
```

#### 2. Database Storage
- **BuyList**: Payment methods are stored in `lists_banks` table
  - Simple mapping of list_id to bank_id
- **SellList**: Payment methods are stored in `lists_payment_methods` table
  - Includes additional payment details in `values` JSON column
  - Links list_id, payment_method_id, and user_id

#### 3. Validation Requirements
- **BuyList**:
  - Must provide at least one bank_id
  - No additional payment details required
  - Bank must exist in the system

- **SellList**:
  - Must provide at least one payment method
  - Each payment method must include values object
  - Bank must exist and be enabled for the user
  - Payment details must match bank's required fields

#### 4. Retrieval Behavior
When fetching lists:
- **BuyList**: Includes array of bank_ids
- **SellList**: Includes full payment method details if requester is authorized

### Status Values
- 0: Inactive/Disabled - List is not visible or tradeable
- 1: Active - Default for new lists, visible and tradeable
- 2: Cancelled/Closed - List has been terminated

### Price Sources
- 0: Coingecko (default)
  - Used for fixed rate listings
  - Default price source
- 1: Binance
  - Used for real-time price updates
  - Required when margin_type = 1 (floating)

### Important Notes

1. Payment Methods are Required
   - Both BuyList and SellList require at least one payment method
   - The difference is in the structure and detail requirements

2. Security Considerations
   - SellList payment details are only returned to authorized users
   - BuyList bank IDs are publicly visible

3. Update Behavior
   - When updating either type of list, existing payment methods are deleted and replaced
   - This ensures consistency and prevents orphaned payment methods

4. Error Handling
   - Missing payment methods: 400 Bad Request
   - Invalid bank_id: 400 Bad Request
   - Missing payment details for SellList: 400 Bad Request

## Status Codes
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `500`: Server Error