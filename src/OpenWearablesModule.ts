import { NativeModule, requireNativeModule } from "expo-modules-core";
import {
  HealthDataType,
  OpenWearablesModuleEvents,
  HealthDataProvider,
  OWLogLevel,
} from "./OpenWearables.types";

declare class OpenWearablesModule extends NativeModule<OpenWearablesModuleEvents> {
  // MARK: - Configure
  configure(host: string, customSyncURL?: string): void;

  // MARK: - Auth
  signIn(
    userId: string,
    accessToken: string | null,
    refreshToken: string | null,
    apiKey: string | null
  ): Promise<void>;
  signOut(): Promise<void>;
  updateTokens(accessToken: string, refreshToken: string): void;
  restoreSession(): string;
  isSessionValid(): boolean;

  // MARK: - HealthKit Authorization
  requestAuthorization(types: HealthDataType[]): Promise<boolean>;

  // MARK: - Sync
  setSyncInterval(minutes: number): void;
  startBackgroundSync(syncDaysBack: number | null): Promise<boolean>;
  stopBackgroundSync(): Promise<void>;
  syncNow(): Promise<void>;
  isSyncActive(): boolean;
  getSyncStatus(): Record<string, any>;
  resumeSync(): Promise<boolean>;
  resetAnchors(): void;
  getStoredCredentials(): Record<string, any | null>;

  // MARK: - Providers
  getAvailableProviders(): HealthDataProvider[];
  setProvider(providerId: string): boolean;

  // MARK: - Logs
  setLogLevel(logLevel: OWLogLevel): void;
  getLogLevel(): OWLogLevel;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<OpenWearablesModule>(
  "OpenWearablesHealthSDK"
);
