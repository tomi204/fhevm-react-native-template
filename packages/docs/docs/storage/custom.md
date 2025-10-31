---
sidebar_position: 3
---

# Custom Storage Implementation

Create custom storage adapters for specific requirements.

## Basic Implementation

```typescript
import { GenericStringStorage } from '@fhevm/sdk';

class CustomStorage implements GenericStringStorage {
  private data: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.data.get(key) || null;
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }
}
```

## Server-Backed Storage

```typescript
class ServerStorage implements GenericStringStorage {
  private apiUrl: string;
  private authToken: string;

  constructor(apiUrl: string, authToken: string) {
    this.apiUrl = apiUrl;
    this.authToken = authToken;
  }

  async getItem(key: string): Promise<string | null> {
    try {
      const response = await fetch(`${this.apiUrl}/storage/${key}`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
        },
      });

      if (!response.ok) return null;

      const data = await response.json();
      return data.value;
    } catch (error) {
      console.error('Server storage get failed:', error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      await fetch(`${this.apiUrl}/storage/${key}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value }),
      });
    } catch (error) {
      console.error('Server storage set failed:', error);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await fetch(`${this.apiUrl}/storage/${key}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
        },
      });
    } catch (error) {
      console.error('Server storage remove failed:', error);
    }
  }
}
```

## Encrypted Storage

```typescript
class EncryptedStorage implements GenericStringStorage {
  private storage: GenericStringStorage;
  private key: CryptoKey;

  constructor(storage: GenericStringStorage, key: CryptoKey) {
    this.storage = storage;
    this.key = key;
  }

  private async encrypt(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.key,
      dataBuffer
    );

    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    return btoa(String.fromCharCode(...combined));
  }

  private async decrypt(data: string): Promise<string> {
    const combined = Uint8Array.from(atob(data), c => c.charCodeAt(0));

    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      this.key,
      encrypted
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  async getItem(key: string): Promise<string | null> {
    const encrypted = await this.storage.getItem(key);
    if (!encrypted) return null;

    try {
      return await this.decrypt(encrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    const encrypted = await this.encrypt(value);
    await this.storage.setItem(key, encrypted);
  }

  async removeItem(key: string): Promise<void> {
    await this.storage.removeItem(key);
  }
}

// Usage
const key = await crypto.subtle.generateKey(
  { name: 'AES-GCM', length: 256 },
  true,
  ['encrypt', 'decrypt']
);

const baseStorage = new LocalStorageAdapter();
const encryptedStorage = new EncryptedStorage(baseStorage, key);
```

## Multi-Layer Storage

```typescript
class MultiLayerStorage implements GenericStringStorage {
  private layers: GenericStringStorage[];

  constructor(...layers: GenericStringStorage[]) {
    this.layers = layers;
  }

  async getItem(key: string): Promise<string | null> {
    // Try each layer in order
    for (const layer of this.layers) {
      const value = await layer.getItem(key);
      if (value) {
        // Backfill to faster layers
        for (let i = 0; i < this.layers.indexOf(layer); i++) {
          await this.layers[i].setItem(key, value);
        }
        return value;
      }
    }
    return null;
  }

  async setItem(key: string, value: string): Promise<void> {
    // Write to all layers
    await Promise.all(
      this.layers.map(layer => layer.setItem(key, value))
    );
  }

  async removeItem(key: string): Promise<void> {
    // Remove from all layers
    await Promise.all(
      this.layers.map(layer => layer.removeItem(key))
    );
  }
}

// Usage: Memory -> LocalStorage -> Server
const storage = new MultiLayerStorage(
  new GenericStringInMemoryStorage(),
  new LocalStorageAdapter(),
  new ServerStorage(apiUrl, token)
);
```

## TTL Storage

```typescript
class TTLStorage implements GenericStringStorage {
  private storage: GenericStringStorage;
  private defaultTTL: number;

  constructor(storage: GenericStringStorage, defaultTTL: number = 86400000) {
    this.storage = storage;
    this.defaultTTL = defaultTTL;
  }

  async getItem(key: string): Promise<string | null> {
    const raw = await this.storage.getItem(key);
    if (!raw) return null;

    try {
      const item = JSON.parse(raw);

      if (Date.now() > item.expiry) {
        await this.removeItem(key);
        return null;
      }

      return item.value;
    } catch {
      // Not a TTL item, return as-is
      return raw;
    }
  }

  async setItem(key: string, value: string, ttl?: number): Promise<void> {
    const item = {
      value,
      expiry: Date.now() + (ttl || this.defaultTTL),
    };

    await this.storage.setItem(key, JSON.stringify(item));
  }

  async removeItem(key: string): Promise<void> {
    await this.storage.removeItem(key);
  }
}
```

## Namespace Storage

```typescript
class NamespacedStorage implements GenericStringStorage {
  private storage: GenericStringStorage;
  private namespace: string;

  constructor(storage: GenericStringStorage, namespace: string) {
    this.storage = storage;
    this.namespace = namespace;
  }

  private getKey(key: string): string {
    return `${this.namespace}:${key}`;
  }

  async getItem(key: string): Promise<string | null> {
    return await this.storage.getItem(this.getKey(key));
  }

  async setItem(key: string, value: string): Promise<void> {
    await this.storage.setItem(this.getKey(key), value);
  }

  async removeItem(key: string): Promise<void> {
    await this.storage.removeItem(this.getKey(key));
  }
}

// Usage
const userStorage = new NamespacedStorage(localStorage, 'user-123');
const appStorage = new NamespacedStorage(localStorage, 'app');
```

## Testing Storage

```typescript
class MockStorage implements GenericStringStorage {
  private data: Map<string, string> = new Map();
  public calls: { method: string; args: any[] }[] = [];

  getItem(key: string): string | null {
    this.calls.push({ method: 'getItem', args: [key] });
    return this.data.get(key) || null;
  }

  setItem(key: string, value: string): void {
    this.calls.push({ method: 'setItem', args: [key, value] });
    this.data.set(key, value);
  }

  removeItem(key: string): void {
    this.calls.push({ method: 'removeItem', args: [key] });
    this.data.delete(key);
  }

  reset(): void {
    this.data.clear();
    this.calls = [];
  }
}

// In tests
const mockStorage = new MockStorage();

test('saves signature', () => {
  mockStorage.setItem('key', 'value');
  expect(mockStorage.calls).toHaveLength(1);
  expect(mockStorage.getItem('key')).toBe('value');
});
```

## Best Practices

### 1. Handle Errors Gracefully

```typescript
async getItem(key: string): Promise<string | null> {
  try {
    return await this.storage.getItem(key);
  } catch (error) {
    console.error('Storage error:', error);
    return null; // Fail gracefully
  }
}
```

### 2. Implement Cleanup

```typescript
class CleanableStorage implements GenericStringStorage {
  async cleanup(): Promise<void> {
    // Remove expired items
    // Clear old data
  }
}
```

### 3. Add Logging

```typescript
class LoggedStorage implements GenericStringStorage {
  private storage: GenericStringStorage;

  async setItem(key: string, value: string): Promise<void> {
    console.log(`Setting ${key}:`, value.slice(0, 50));
    await this.storage.setItem(key, value);
  }
}
```

### 4. Validate Data

```typescript
async setItem(key: string, value: string): Promise<void> {
  if (!key || !value) {
    throw new Error('Invalid key or value');
  }

  if (value.length > 1000000) {
    throw new Error('Value too large');
  }

  await this.storage.setItem(key, value);
}
```

## Next Steps

- Review [Storage Overview](./overview.md)
- See [IndexedDB Implementation](./indexeddb.md)
- Explore [Examples](../examples/basic-usage.md)
