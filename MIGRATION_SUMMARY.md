# Prisma to PostgreSQL (pg) Migration Summary

## Overview
Successfully migrated the agtbook-backend project from Prisma ORM to raw PostgreSQL queries using the `pg` library.

## Files Modified

### 1. Configuration
- **`src/config/db.js`** (NEW)
  - Created PostgreSQL connection pool configuration
  - Exports `pool` and `query` helper function
  - Uses `DATABASE_URL` from environment variables

### 2. Controllers Updated
All controllers have been refactored to use raw SQL queries:

- **`src/controllers/book.controller.js`**
  - Replaced all Prisma queries with raw SQL
  - Implemented complex filtering logic with dynamic WHERE clauses
  - Handled image uploads (bytea) and Base64 encoding
  - Used parameterized queries for security
  - Implemented manual JOIN operations for Language and Category relations

- **`src/controllers/master.controller.js`**
  - Converted Language and Category CRUD operations to raw SQL
  - Simple SELECT, INSERT, UPDATE, DELETE queries

- **`src/controllers/reader.controller.js`**
  - Implemented raw SQL for Reader operations
  - Manual data structuring for nested Order and ReaderHistory relations
  - Subquery for order counts

- **`src/controllers/order.controller.js`**
  - Implemented manual transactions using `client.query('BEGIN')` and `COMMIT/ROLLBACK`
  - Complex order creation with reader lookup/creation, stock updates, and activity logging
  - Dynamic filtering with multiple query parameters
  - Manual JOIN operations for Reader, OrderedBook, and Book relations

- **`src/controllers/activity.controller.js`**
  - Converted ActivityLog operations to raw SQL
  - Used LEFT JOIN for optional Order and Reader relations
  - Implemented `row_to_json()` for nested object structure

- **`src/controllers/interest.controller.js`**
  - Updated to use pg (Note: Interest table doesn't exist in current schema)
  - Added placeholder responses with comments for future implementation

### 3. Test Files
- **`src/test-db.js`**
  - Updated to use pg instead of Prisma
  - Tests database connection and Language table query

- **`test-db-info.js`**
  - Already updated in previous session
  - Tests connection and introspects database schema

### 4. Dependencies
- **`package.json`**
  - Removed: `@prisma/client`, `prisma`
  - Kept: `pg` (v8.13.1)
  - Ran `npm install` to clean up node_modules

## Key Implementation Patterns

### 1. Parameterized Queries
```javascript
const result = await db.query('SELECT * FROM "Book" WHERE id = $1', [bookId]);
```

### 2. Manual Transactions
```javascript
const client = await db.pool.connect();
try {
    await client.query('BEGIN');
    // ... operations
    await client.query('COMMIT');
} catch (error) {
    await client.query('ROLLBACK');
    throw error;
} finally {
    client.release();
}
```

### 3. JSON Aggregation for Relations
```javascript
SELECT b.*, 
    row_to_json(l.*) as "Language",
    row_to_json(c.*) as "Category"
FROM "Book" b
LEFT JOIN "Language" l ON b."languageId" = l.id
LEFT JOIN "Category" c ON b."categoryId" = c.id
```

### 4. Dynamic WHERE Clauses
```javascript
let conditions = [];
let values = [];
if (filter) {
    values.push(filter);
    conditions.push(`field = $${values.length}`);
}
const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
```

## Database Schema Notes

### Table Names (Case-Sensitive)
- `"Book"`, `"Language"`, `"Category"`
- `"Reader"`, `"ReaderHistory"`
- `"Order"`, `"OrderedBook"`
- `"ActivityLog"`

### Column Names (camelCase, quoted)
- `"languageId"`, `"categoryId"`, `"bookId"`
- `"readerId"`, `"orderId"`
- `"createdAt"`, `"updatedAt"`, `"orderDate"`
- `"frontImage"`, `"backImage"` (bytea type)

### Enums
- `OrderStatus`: PENDING, PROCESS, SHIPPED, DELIVERED, CANCELLED
- `BookStatus`: PENDING, WAITLISTED, PROCESS, AVAILABLE, OUT_OF_STOCK, NEW_ORDER, IN_PROGRESS, DISPATCHED, CANCELLED, REJECTED

## Testing Recommendations

1. **Test Database Connection**
   ```bash
   node test-db-info.js
   ```

2. **Test Basic Queries**
   ```bash
   node src/test-db.js
   ```

3. **Test API Endpoints**
   - Books: GET, POST, PUT, DELETE, bulk create, image retrieval
   - Readers: GET, POST, PUT, DELETE
   - Orders: GET, POST, PUT (status updates)
   - Masters: Languages and Categories CRUD
   - Activity Logs: GET, POST, PUT, DELETE

4. **Test Complex Operations**
   - Order creation with reader lookup/creation
   - Book filtering with multiple parameters
   - Image uploads (multipart and Base64)
   - Transaction rollback on errors

## Known Issues / Notes

1. **Interest Table**: The `interest.controller.js` references an `Interest` table that doesn't exist in the current Prisma schema. The controller has been updated with placeholder responses.

2. **Image Handling**: Images are stored as `bytea` in PostgreSQL. The `transformBook` function adds image URLs for frontend consumption.

3. **Case Sensitivity**: PostgreSQL table and column names are case-sensitive when quoted. All queries use double quotes around identifiers.

4. **Manual Relation Fetching**: Unlike Prisma's `include`, relations must be manually fetched with separate queries or JOINs.

## Environment Variables Required

```env
DATABASE_URL=postgresql://username:password@host:port/database
PORT=3000
```

## Next Steps

1. ✅ Remove Prisma dependencies
2. ✅ Update all controllers to use pg
3. ✅ Test database connection
4. ⏳ Test all API endpoints thoroughly
5. ⏳ Update frontend if response structures changed
6. ⏳ Consider adding query logging for debugging
7. ⏳ Implement connection pooling optimization if needed
8. ⏳ Add database migration scripts if schema changes are needed

## Migration Complete! 🎉

All Prisma references have been removed and replaced with raw PostgreSQL queries using the `pg` library.
