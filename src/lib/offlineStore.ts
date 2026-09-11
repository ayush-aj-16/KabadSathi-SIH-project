import { EWasteLot, MaterialPrice, RecyclerFacility, TransactionRecord, SyncAuditLog } from '../types';
import { INITIAL_LOTS, INITIAL_PRICES, INITIAL_RECYCLERS, INITIAL_TRANSACTIONS } from '../data/initialData';

const STORAGE_KEYS = {
  LOTS: 'kabadi_lots_v1',
  PRICES: 'kabadi_prices_v1',
  PRICES_TIMESTAMP: 'kabadi_prices_time_v1',
  RECYCLERS: 'kabadi_recyclers_v1',
  RECYCLERS_TIMESTAMP: 'kabadi_recyclers_time_v1',
  TRANSACTIONS: 'kabadi_transactions_v1',
  AUDIT_LOGS: 'kabadi_sync_audit_v1',
  LOT_COUNTER: 'kabadi_offline_seq_v1',
  FIREBASE_CLOUD_DB: 'kabadi_firebase_cloud_v1', // Server-side mirror for SIH demonstration
};

// Low-end device friendly safe localStorage accessor
function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.warn(`[OfflineStore] Failed to read ${key} from storage:`, e);
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.warn(`[OfflineStore] Storage quota exceeded or error writing ${key}:`, e);
    return false;
  }
}

// Low-end Android Image Compressor (downscales canvas to max 480px, WebP/JPEG 0.6 quality)
export async function compressImageForLowEndDevice(base64OrBlob: string): Promise<string> {
  return new Promise((resolve) => {
    if (!base64OrBlob || !base64OrBlob.startsWith('data:image')) {
      resolve(base64OrBlob);
      return;
    }

    const img = new Image();
    img.onload = () => {
      const maxDimension = 480;
      let width = img.width;
      let height = img.height;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64OrBlob);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      // Produce lightweight compressed JPEG
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.65);
      resolve(compressedDataUrl);
    };
    img.onerror = () => {
      resolve(base64OrBlob);
    };
    img.src = base64OrBlob;
  });
}

// Helper to generate sequential readable offline ID e.g. OFFLINE-LOT-001
export function generateNextOfflineId(): string {
  const currentSeq = safeGet<number>(STORAGE_KEYS.LOT_COUNTER, 0) + 1;
  safeSet(STORAGE_KEYS.LOT_COUNTER, currentSeq);
  const padded = String(currentSeq).padStart(3, '0');
  return `OFFLINE-LOT-${padded}`;
}

// --- LOTS REPOSITORY ---
export function getStoredLots(): EWasteLot[] {
  return safeGet<EWasteLot[]>(STORAGE_KEYS.LOTS, INITIAL_LOTS);
}

export function saveStoredLots(lots: EWasteLot[]): void {
  safeSet(STORAGE_KEYS.LOTS, lots);
}

// Create new lot locally (works 100% offline)
export async function createOfflineLot(lotInput: Omit<EWasteLot, 'id' | 'localId' | 'syncState' | 'createdAt' | 'retryCount'>): Promise<EWasteLot> {
  const localId = generateNextOfflineId();
  let compressedPhoto = lotInput.photoUrl;
  if (compressedPhoto) {
    try {
      compressedPhoto = await compressImageForLowEndDevice(compressedPhoto);
    } catch {
      // ignore
    }
  }

  const newLot: EWasteLot = {
    ...lotInput,
    id: localId,
    localId,
    photoUrl: compressedPhoto,
    createdAt: Date.now(),
    syncState: 'pending',
    retryCount: 0,
    status: 'submitted',
  };

  const currentLots = getStoredLots();
  // Insert at top
  const updatedLots = [newLot, ...currentLots];
  saveStoredLots(updatedLots);

  // Add audit log
  recordAuditLog('Local Lot Created', 1, 'success', `Saved offline with local ID: ${localId}`);

  return newLot;
}

// --- SYNC ENGINE ---
export interface SyncResult {
  syncedLotsCount: number;
  failedLotsCount: number;
  syncedLotIds: string[];
  error?: string;
}

export async function syncPendingDataToFirebase(): Promise<SyncResult> {
  const lots = getStoredLots();
  const pendingLots = lots.filter(l => l.syncState === 'pending' || l.syncState === 'failed');

  if (pendingLots.length === 0) {
    return {
      syncedLotsCount: 0,
      failedLotsCount: 0,
      syncedLotIds: [],
    };
  }

  // Mark pending lots as 'syncing'
  const updatedLots = lots.map(lot => {
    if (lot.syncState === 'pending' || lot.syncState === 'failed') {
      return { ...lot, syncState: 'syncing' as const };
    }
    return lot;
  });
  saveStoredLots(updatedLots);

  // Simulate network flight / Firebase latency (600ms - 1200ms)
  await new Promise(res => setTimeout(res, 900));

  const syncedIds: string[] = [];
  const now = Date.now();

  // Read current Firebase cloud database mirror
  const cloudDb = safeGet<EWasteLot[]>(STORAGE_KEYS.FIREBASE_CLOUD_DB, []);

  // Update states to 'synced' with unique server document ID
  const finalizedLots = updatedLots.map(lot => {
    if (lot.syncState === 'syncing') {
      // Idempotency: generate deterministic doc ID from local ID if not present
      const docId = lot.firebaseDocId || `fb_doc_${lot.localId.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${lot.createdAt}`;
      syncedIds.push(lot.localId);

      const syncedLot: EWasteLot = {
        ...lot,
        id: docId, // Canonical ID updated
        firebaseDocId: docId,
        syncState: 'synced',
        syncedAt: now,
        syncError: undefined,
      };

      // Push into cloud mirror if not already there (duplicate prevention)
      const existingCloudIndex = cloudDb.findIndex(c => c.localId === lot.localId || c.firebaseDocId === docId);
      if (existingCloudIndex >= 0) {
        cloudDb[existingCloudIndex] = syncedLot;
      } else {
        cloudDb.unshift(syncedLot);
      }

      return syncedLot;
    }
    return lot;
  });

  saveStoredLots(finalizedLots);
  safeSet(STORAGE_KEYS.FIREBASE_CLOUD_DB, cloudDb);

  // Also auto-generate verified transaction for newly synced accepted lots
  const currentTxns = getStoredTransactions();
  const newTxns: TransactionRecord[] = [];

  for (const lot of finalizedLots) {
    if (syncedIds.includes(lot.localId)) {
      // Check if already in transactions
      const alreadyHasTxn = currentTxns.some(t => t.localId === `TXN-${lot.localId}`);
      if (!alreadyHasTxn) {
        newTxns.push({
          id: `TXN-FB-${Math.floor(10000 + Math.random() * 90000)}`,
          localId: `TXN-${lot.localId}`,
          lotId: lot.firebaseDocId || lot.id,
          materialName: lot.materialName,
          weightKg: lot.approxWeightKg,
          ratePerKg: lot.estimatedRatePerKg,
          amount: lot.estimatedTotalValue,
          paymentMode: 'UPI',
          date: now,
          syncState: 'synced',
          recyclerName: lot.recyclerAssigned || 'EcoRecycle India Dismantling Hub',
        });
      }
    }
  }

  if (newTxns.length > 0) {
    safeSet(STORAGE_KEYS.TRANSACTIONS, [...newTxns, ...currentTxns]);
  }

  recordAuditLog('Firebase Batch Sync', syncedIds.length, 'success', `Synced ${syncedIds.join(', ')} to Firebase Firestore.`);

  return {
    syncedLotsCount: syncedIds.length,
    failedLotsCount: 0,
    syncedLotIds: syncedIds,
  };
}

// Mark lot as failed or retry
export function markLotSyncFailed(localId: string, reason: string): void {
  const lots = getStoredLots();
  const updated = lots.map(l => {
    if (l.localId === localId) {
      return {
        ...l,
        syncState: 'failed' as const,
        retryCount: l.retryCount + 1,
        syncError: reason,
      };
    }
    return l;
  });
  saveStoredLots(updated);
  recordAuditLog('Sync Error', 1, 'failed', `Lot ${localId} sync failed: ${reason}`);
}

// --- PRICES & RECYCLERS CACHE ---
export function getCachedPrices(): { prices: MaterialPrice[]; lastSynced: number } {
  const prices = safeGet<MaterialPrice[]>(STORAGE_KEYS.PRICES, INITIAL_PRICES);
  const lastSynced = safeGet<number>(STORAGE_KEYS.PRICES_TIMESTAMP, Date.now() - 3600000 * 3);
  return { prices, lastSynced };
}

export function updatePricesCache(prices: MaterialPrice[]): void {
  safeSet(STORAGE_KEYS.PRICES, prices);
  safeSet(STORAGE_KEYS.PRICES_TIMESTAMP, Date.now());
}

export function getCachedRecyclers(): { recyclers: RecyclerFacility[]; lastSynced: number } {
  const recyclers = safeGet<RecyclerFacility[]>(STORAGE_KEYS.RECYCLERS, INITIAL_RECYCLERS);
  const lastSynced = safeGet<number>(STORAGE_KEYS.RECYCLERS_TIMESTAMP, Date.now() - 3600000 * 5);
  return { recyclers, lastSynced };
}

export function updateRecyclersCache(recyclers: RecyclerFacility[]): void {
  safeSet(STORAGE_KEYS.RECYCLERS, recyclers);
  safeSet(STORAGE_KEYS.RECYCLERS_TIMESTAMP, Date.now());
}

// --- TRANSACTIONS REPOSITORY ---
export function getStoredTransactions(): TransactionRecord[] {
  return safeGet<TransactionRecord[]>(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
}

// --- CLOUD DB ACCESS (For SIH Demonstration View) ---
export function getFirebaseCloudLots(): EWasteLot[] {
  // Initialize with initial synced lots if empty
  const cloud = safeGet<EWasteLot[]>(STORAGE_KEYS.FIREBASE_CLOUD_DB, []);
  if (cloud.length === 0) {
    const initialSynced = INITIAL_LOTS.filter(l => l.syncState === 'synced');
    safeSet(STORAGE_KEYS.FIREBASE_CLOUD_DB, initialSynced);
    return initialSynced;
  }
  return cloud;
}

// --- AUDIT LOGS ---
export function getAuditLogs(): SyncAuditLog[] {
  return safeGet<SyncAuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, [
    {
      id: 'log-01',
      timestamp: Date.now() - 3600000 * 2,
      action: 'System Startup',
      itemCount: 0,
      status: 'success',
      details: 'Offline storage cache primed with essential e-waste guidelines and prices.',
    },
  ]);
}

export function recordAuditLog(action: string, itemCount: number, status: 'success' | 'failed' | 'in-progress', details: string): void {
  const logs = getAuditLogs();
  const newLog: SyncAuditLog = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: Date.now(),
    action,
    itemCount,
    status,
    details,
  };
  safeSet(STORAGE_KEYS.AUDIT_LOGS, [newLog, ...logs.slice(0, 49)]); // Keep last 50 logs
}

// Reset data for clean SIH demo
export function resetDemoData(): void {
  localStorage.removeItem(STORAGE_KEYS.LOTS);
  localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
  localStorage.removeItem(STORAGE_KEYS.FIREBASE_CLOUD_DB);
  localStorage.removeItem(STORAGE_KEYS.LOT_COUNTER);
  localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
}
