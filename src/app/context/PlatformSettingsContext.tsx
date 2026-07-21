import { createContext, type ReactNode, useContext } from "react";
import { BRANDING } from "../../config/branding";

export type PlatformSettings = {
  platformName: string;
  supportContact: string;
};

const defaultSettings: PlatformSettings = {
  platformName: BRANDING.platformName,
  supportContact: "",
};

const PlatformSettingsContext = createContext<PlatformSettings>(defaultSettings);

export function PlatformSettingsProvider({ value, children }: { value: PlatformSettings; children: ReactNode }) {
  return <PlatformSettingsContext.Provider value={value}>{children}</PlatformSettingsContext.Provider>;
}

export const usePlatformSettings = () => useContext(PlatformSettingsContext);
