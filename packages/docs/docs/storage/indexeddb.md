---
sidebar_position: 2
---

# IndexedDB Storage

Use IndexedDB for advanced browser storage with better performance and capacity.

## Implementation

```typescript
import { GenericStringStorage } from '@fhevm/sdk';

class IndexedDBStorage implements GenericStringStorage {
  private dbName = 'fhevm-storage';
  private storeName = 'signatures';
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });
  }

  async getItem(key: string): Promise<string | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async setItem(key: string, value: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(value, key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async removeItem(key: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}
```

## Usage

```typescript
import { FhevmDecryptionSignature } from '@fhevm/sdk';

// Create storage instance
const storage = new IndexedDBStorage();

// Initialize before use
await storage.init();

// Use with SDK
const signature = await FhevmDecryptionSignature.loadOrSign(
  instance,
  contractAddresses,
  signer,
  storage // Use IndexedDB storage
);
```

## With React Hook

```typescript
import { useState, useEffect } from 'react';

function useIndexedDBStorage() {
  const [storage, setStorage] = useState<IndexedDBStorage | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initStorage = async () => {
      const db = new IndexedDBStorage();
      await db.init();
      setStorage(db);
      setIsReady(true);
    };

    initStorage().catch(console.error);
  }, []);

  return { storage, isReady };
}

// In component
function MyComponent() {
  const { storage, isReady } = useIndexedDBStorage();

  const { decrypt } = useFHEDecrypt({
    instance,
    ethersSigner,
    fhevmDecryptionSignatureStorage: storage!,
    chainId,
    requests,
  });

  if (!isReady) return <div>Initializing storage...</div>;

  return <div>Ready to decrypt</div>;
}
```

## Advanced Features

### With Expiration

```typescript
class IndexedDBStorageWithTTL extends IndexedDBStorage {
  async setItemWithTTL(key: string, value: string, ttl: number): Promise<void> {
    const item = {
      value,
      expiry: Date.now() + ttl,
    };
    await this.setItem(key, JSON.stringify(item));
  }

  async getItem(key: string): Promise<string | null> {
    const data = await super.getItem(key);
    if (!data) return null;

    try {
      const item = JSON.parse(data);
      if (item.expiry && Date.now() > item.expiry) {
        await this.removeItem(key);
        return null;
      }
      return item.value;
    } catch {
      return data; // Return as-is if not TTL format
    }
  }
}
```

### With Encryption

```typescript
class EncryptedIndexedDBStorage extends IndexedDBStorage {
  private encryptionKey: string;

  constructor(encryptionKey: string) {
    super();
    this.encryptionKey = encryptionKey;
  }

  private async encrypt(data: string): Promise<string> {
    // Implement encryption
    // Use Web Crypto API for proper encryption
    return data; // Placeholder
  }

  private async decrypt(data: string): Promise<string> {
    // Implement decryption
    return data; // Placeholder
  }

  async setItem(key: string, value: string): Promise<void> {
    const encrypted = await this.encrypt(value);
    await super.setItem(key, encrypted);
  }

  async getItem(key: string): Promise<string | null> {
    const encrypted = await super.getItem(key);
    if (!encrypted) return null;
    return await this.decrypt(encrypted);
  }
}
```

## Benefits

### vs LocalStorage

| Feature | IndexedDB | LocalStorage |
|---------|-----------|--------------|
| Storage Limit | ~50MB+ | ~5-10MB |
| Async | Yes | No |
| Indexing | Yes | No |
| Performance | Better for large data | Better for small data |
| Complexity | Higher | Lower |

### Use IndexedDB When

- Storing large amounts of data
- Need better performance
- Want structured storage
- Need async operations

### Use LocalStorage When

- Small data storage
- Simple key-value pairs
- Synchronous access needed
- Simpler implementation preferred

## Browser Support

IndexedDB is supported in:
- Chrome 24+
- Firefox 16+
- Safari 10+
- Edge 12+

Check support:

```typescript
const isIndexedDBSupported = 'indexedDB' in window;
```

## Error Handling

```typescript
try {
  const storage = new IndexedDBStorage();
  await storage.init();
} catch (error) {
  console.error('IndexedDB not available:', error);
  // Fallback to LocalStorage or InMemory
  const fallbackStorage = new LocalStorageAdapter();
}
```

## Next Steps

- See [Custom Storage Implementation](./custom.md)
- Review [Storage Overview](./overview.md)
