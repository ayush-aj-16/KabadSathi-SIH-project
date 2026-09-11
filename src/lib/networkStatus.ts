import { NetworkStatusType } from '../types';

type NetworkListener = (status: NetworkStatusType, isSimulated: boolean) => void;

class NetworkManager {
  private currentStatus: NetworkStatusType = navigator.onLine ? 'online' : 'offline';
  private isSimulatedOffline: boolean = false;
  private listeners: Set<NetworkListener> = new Set();
  private syncTimer: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleBrowserOnline);
      window.addEventListener('offline', this.handleBrowserOffline);
    }
  }

  private handleBrowserOnline = () => {
    if (!this.isSimulatedOffline) {
      this.triggerReconnectSync();
    }
  };

  private handleBrowserOffline = () => {
    this.setStatus('offline');
  };

  public getStatus(): NetworkStatusType {
    if (this.isSimulatedOffline) {
      // If simulated offline is active, return offline (or syncing if in transit)
      return this.currentStatus === 'syncing' ? 'syncing' : 'offline';
    }
    return this.currentStatus;
  }

  public isOnline(): boolean {
    return this.getStatus() === 'online' || this.getStatus() === 'synced';
  }

  public isSimulated(): boolean {
    return this.isSimulatedOffline;
  }

  public setStatus(status: NetworkStatusType) {
    this.currentStatus = status;
    this.notify();
  }

  // SIH Judge Demo Helper: toggle simulated offline mode
  public setSimulatedOffline(simulateOffline: boolean, onSyncTrigger?: () => Promise<void>) {
    this.isSimulatedOffline = simulateOffline;

    if (simulateOffline) {
      if (this.syncTimer) clearTimeout(this.syncTimer);
      this.setStatus('offline');
    } else {
      // Returned online! Trigger syncing sequence
      this.triggerReconnectSync(onSyncTrigger);
    }
  }

  public async triggerReconnectSync(onSyncTrigger?: () => Promise<void>) {
    // Transition to 'syncing'
    this.setStatus('syncing');

    try {
      if (onSyncTrigger) {
        await onSyncTrigger();
      } else {
        // Default small delay to show visual feedback
        await new Promise(res => setTimeout(res, 1200));
      }
      // Transition to 'synced'
      this.setStatus('synced');

      // After 3.5 seconds in 'synced', settle on 'online'
      if (this.syncTimer) clearTimeout(this.syncTimer);
      this.syncTimer = setTimeout(() => {
        if (!this.isSimulatedOffline && navigator.onLine) {
          this.setStatus('online');
        }
      }, 3500);
    } catch (err) {
      console.warn('[NetworkManager] Sync failed on reconnect:', err);
      this.setStatus('online');
    }
  }

  public subscribe(listener: NetworkListener): () => void {
    this.listeners.add(listener);
    listener(this.getStatus(), this.isSimulatedOffline);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const status = this.getStatus();
    this.listeners.forEach(fn => fn(status, this.isSimulatedOffline));
  }
}

export const networkManager = new NetworkManager();
