# General Storage Durable Object

A general-purpose key-value storage system using Cloudflare Durable Objects. Can be used for rate limiting, user sessions, and any stateful data that needs consistency across worker instances.

## Features

- ✅ Key-value storage with optional TTL (time to live)
- ✅ Consistent across all worker instances
- ✅ Persistent storage with in-memory cache
- ✅ Batch operations (getMany, setMany, deleteMany)
- ✅ Namespace support for organizing data
- ✅ Easy-to-use client wrapper

## Usage Examples

### Basic Storage Operations

```typescript
import { createStorageClient } from './lib/services/do/storageClient';

// In your route handler
const storage = createStorageClient(c.env.STORAGE_DO);

// Set a value
await storage.set('my-key', { data: 'value' }, 60000); // 60s TTL

// Get a value
const result = await storage.get('my-key');
if (result.success) {
  console.log(result.data);
}

// Delete a value
await storage.delete('my-key');
```

### Using Storage Helpers

```typescript
import { createStorageClient, StorageHelpers } from './lib/services/do/storageClient';

const client = createStorageClient(c.env.STORAGE_DO);
const helpers = new StorageHelpers(client);

// Rate limiting (already used in rateLimiter.ts)
const bucket = await helpers.getRateLimit('user123');
await helpers.setRateLimit('user123', 29, Date.now());

// Sessions (for future auth)
await helpers.setSession('session-id', sessionData, 7 * 24 * 60 * 60 * 1000);
const session = await helpers.getSession('session-id');
```

### Namespaces

Use namespaces to organize data:

```typescript
// Rate limiting namespace
await storage.set('rate_limit:user123', data, undefined, 'rate_limiting');

// Sessions namespace
await storage.set('session:abc123', data, ttl, 'sessions');

// Custom namespace
await storage.set('custom:key', data, undefined, 'my_namespace');
```

## Rate Limiting

The rate limiter uses the general storage:

```typescript
import { createRateLimiter } from './lib/rateLimiter';

const rateLimiter = createRateLimiter(c.env.STORAGE_DO);
const result = await rateLimiter.checkLimit('user123');
// { allowed: true, remaining: 29 }
```

## Future Auth System

The auth system will use the same storage:

```typescript
import { createLoginService } from './lib/services/auth/login';

const loginService = createLoginService(c.env.STORAGE_DO);
const result = await loginService.login({ email, password });
// { success: true, sessionId: '...', session: {...} }
```

## Configuration

In `wrangler.jsonc`:

```jsonc
{
  "durable_objects": {
    "bindings": [
      {
        "name": "STORAGE_DO",
        "class_name": "StorageDurableObject",
        "script_name": "querylab-backend"
      }
    ]
  }
}
```

## API Endpoints (Internal)

The DO also exposes HTTP endpoints for direct access:

- `GET /storage/:key` - Get value
- `POST /storage/:key` - Set value (body: `{ value, ttlMs? }`)
- `DELETE /storage/:key` - Delete value
- `POST /storage/batch/get` - Get multiple keys
- `POST /storage/batch/set` - Set multiple keys
- `POST /storage/batch/delete` - Delete multiple keys
- `GET /storage/list?prefix=...` - List keys
- `POST /storage/clear` - Clear all keys

