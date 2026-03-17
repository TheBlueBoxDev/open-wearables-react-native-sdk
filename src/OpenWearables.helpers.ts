import { OWLogLevel } from "./OpenWearables.types";

export const OWLogLevelLabel: Record<OWLogLevel, string> = {
  [OWLogLevel.None]: "None",
  [OWLogLevel.Always]: "Always",
  [OWLogLevel.Debug]: "Debug",
};
