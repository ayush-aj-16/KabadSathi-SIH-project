export type NetworkStatusType = 'online' | 'offline' | 'syncing' | 'synced';

export type LanguageType = 'hi' | 'mr' | 'en';

export type UserRole = 'collector' | 'recycler';

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  location: string;
  badge: string;
  avatar?: string;
  totalCollectedKg: number;
  totalEarnings: number;
}

export type SyncState = 'pending' | 'syncing' | 'synced' | 'failed';

export interface DetectedEWasteItem {
  id: string;
  nameEn: string;
  nameHi: string;
  nameMr: string;
  category: string;
  icon: string;
  confidence: number;
  confidenceTier: 'high' | 'medium' | 'low';
  isConfirmedVisible: boolean;
  status: 'confirmed' | 'possible';
  estimatedRateKg?: number;
  estimatedWeightKg?: number;
  estimatedValue?: number;
  materialsEn?: string[];
  materialsHi?: string[];
  materialsMr?: string[];
  selected?: boolean;
}

export interface AIDetectionResult {
  is_e_waste: boolean;
  uncertain: boolean;
  object_type: 'complete_device' | 'component' | 'materials' | 'multiple_objects' | 'non_scrap';
  confidence: number;
  confidenceTier: 'high' | 'medium' | 'low';
  primaryLabelEn: string;
  primaryLabelHi: string;
  primaryLabelMr: string;
  titleEn: string;
  titleHi: string;
  titleMr: string;
  voiceExplanationEn: string;
  voiceExplanationHi: string;
  voiceExplanationMr: string;
  items: DetectedEWasteItem[];
  hazardTier: 'Low' | 'Medium' | 'High' | 'Critical';
  safetyGuidanceEn?: string;
  safetyGuidanceHi?: string;
  safetyGuidanceMr?: string;
  offlineRuleBased?: boolean;
}

export interface EWasteLot {
  id: string; // Temporary local ID (e.g. OFFLINE-LOT-001) or Firebase ID
  localId: string; // Unique local idempotent ID
  firebaseDocId?: string; // Set once synced to Firebase
  collectorId: string;
  collectorName: string;
  materialCategory: string;
  materialName: string;
  approxWeightKg: number;
  estimatedRatePerKg: number;
  estimatedTotalValue: number;
  photoUrl?: string;
  aiClassification?: {
    identifiedItem: string;
    confidence: number;
    recommendedHazardTier: 'Low' | 'Medium' | 'High' | 'Critical';
    recyclingGuidance: string;
    offlineRuleBased?: boolean;
    uncertain?: boolean;
    objectType?: string;
    detectedItems?: DetectedEWasteItem[];
  };
  detectedItems?: DetectedEWasteItem[];
  notes?: string;
  createdAt: number;
  syncedAt?: number;
  syncState: SyncState;
  retryCount: number;
  syncError?: string;
  recyclerAssigned?: string;
  status: 'draft' | 'submitted' | 'accepted' | 'completed';
}

export interface MaterialPrice {
  id: string;
  category: string;
  nameEn: string;
  nameHi: string;
  pricePerKg: number;
  trend: 'up' | 'down' | 'stable';
  unit: string;
  hazardLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  lastSyncedTimestamp: number;
  description: string;
  iconName: string;
}

export interface RecyclerFacility {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  address: string;
  distanceKm: number;
  acceptedMaterials: string[];
  cpcbCertified: boolean;
  rating: number;
  isOpenToday: boolean;
  lastUpdatedTimestamp: number;
  verificationBadge: string;
}

export interface SafetyGuideline {
  id: string;
  titleEn: string;
  titleHi: string;
  category: string;
  hazardLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  summaryEn: string;
  summaryHi: string;
  stepsEn: string[];
  stepsHi: string[];
  dosEn: string[];
  dosHi: string[];
  dontsEn: string[];
  dontsHi: string[];
  audioTextHi: string;
  audioTextEn: string;
  icon: string;
}

export interface TransactionRecord {
  id: string;
  localId: string;
  lotId: string;
  materialName: string;
  weightKg: number;
  ratePerKg: number;
  amount: number;
  paymentMode: 'Cash' | 'UPI' | 'Direct Transfer';
  date: number;
  syncState: SyncState;
  recyclerName: string;
}

export interface SyncAuditLog {
  id: string;
  timestamp: number;
  action: string;
  itemCount: number;
  status: 'success' | 'failed' | 'in-progress';
  details: string;
}
