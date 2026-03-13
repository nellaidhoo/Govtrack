
import { LogService } from './mockService';

export interface PendingAction {
  id: string;
  timestamp: string;
  type: 'INVENTORY_UPDATE' | 'ASSET_UPDATE';
  payload: any;
  status: 'PENDING' | 'SYNCED' | 'CONFLICT';
}

const STORAGE_KEY_QUEUE = 'govtrack_sync_queue';
const STORAGE_KEY_DATA = 'govtrack_offline_data';

export const OfflineService = {
  isOnline: (): boolean => navigator.onLine,

  // Get all pending actions from local storage
  getQueue: (): PendingAction[] => {
    const data = localStorage.getItem(STORAGE_KEY_QUEUE);
    return data ? JSON.parse(data) : [];
  },

  // Add a new action to the queue
  enqueue: (type: PendingAction['type'], payload: any) => {
    const queue = OfflineService.getQueue();
    const newAction: PendingAction = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      type,
      payload,
      status: 'PENDING'
    };
    queue.push(newAction);
    localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(queue));
    
    LogService.add({
      action: 'Offline Action Queued',
      category: 'AUTH',
      details: `Device offline. Queued ${type} for later sync.`,
      actor: 'System'
    });
    
    return newAction;
  },

  // Clear the queue after successful sync
  clearQueue: () => {
    localStorage.removeItem(STORAGE_KEY_QUEUE);
  },

  // Save a snapshot of data for offline viewing
  saveSnapshot: (key: string, data: any) => {
    const snapshots = JSON.parse(localStorage.getItem(STORAGE_KEY_DATA) || '{}');
    snapshots[key] = {
      timestamp: new Date().toISOString(),
      data
    };
    localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(snapshots));
  },

  getSnapshot: (key: string) => {
    const snapshots = JSON.parse(localStorage.getItem(STORAGE_KEY_DATA) || '{}');
    return snapshots[key]?.data || null;
  }
};
