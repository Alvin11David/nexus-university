import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SiteSettings {
  siteName: string;
  shortName: string;
  tagline: string;
  logoUrl: string;
  supportEmail: string;
  primaryColor: string;
  secondaryColor: string;
}

const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteName: "Nexus University",
  shortName: "UniPortal",
  tagline: "Unified academic management platform",
  logoUrl: "",
  supportEmail: "support@nexus.edu",
  primaryColor: "#7c3aed",
  secondaryColor: "#f97316",
};

interface SiteSettingsContextType {
  settings: SiteSettings;
  loading: boolean;
  canEdit: boolean;
  saveSettings: (nextSettings: SiteSettings) => Promise<void>;
}

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(
  undefined,
);

const SITE_SETTINGS_COLLECTION = "site_settings";
const SITE_SETTINGS_DOC = "branding";

function isHexColor(value: string) {
  return /^#([0-9A-F]{3}|[0-9A-F]{6})$/i.test(value.trim());
}

function sanitizeSettings(
  input: Partial<SiteSettings> | undefined,
): SiteSettings {
  const merged: SiteSettings = {
    ...DEFAULT_SITE_SETTINGS,
    ...(input || {}),
  };

  return {
    siteName: String(merged.siteName || DEFAULT_SITE_SETTINGS.siteName).trim(),
    shortName: String(
      merged.shortName || DEFAULT_SITE_SETTINGS.shortName,
    ).trim(),
    tagline: String(merged.tagline || DEFAULT_SITE_SETTINGS.tagline).trim(),
    logoUrl: String(merged.logoUrl || "").trim(),
    supportEmail: String(
      merged.supportEmail || DEFAULT_SITE_SETTINGS.supportEmail,
    ).trim(),
    primaryColor: isHexColor(merged.primaryColor)
      ? merged.primaryColor
      : DEFAULT_SITE_SETTINGS.primaryColor,
    secondaryColor: isHexColor(merged.secondaryColor)
      ? merged.secondaryColor
      : DEFAULT_SITE_SETTINGS.secondaryColor,
  };
}

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const faviconOriginalHrefRef = useRef<string | null>(null);

  useEffect(() => {
    const settingsRef = doc(db, SITE_SETTINGS_COLLECTION, SITE_SETTINGS_DOC);

    const unsubscribe = onSnapshot(
      settingsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setSettings(
            sanitizeSettings(snapshot.data() as Partial<SiteSettings>),
          );
        } else {
          setSettings(DEFAULT_SITE_SETTINGS);
        }

        setLoading(false);
      },
      (error) => {
        console.error("Failed to subscribe to site settings:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    document.title = settings.siteName;

    const descriptionMeta = document.querySelector(
      'meta[name="description"]',
    ) as HTMLMetaElement | null;
    if (descriptionMeta) {
      descriptionMeta.content = settings.tagline;
    }

    const ogTitleMeta = document.querySelector(
      'meta[property="og:title"]',
    ) as HTMLMetaElement | null;
    if (ogTitleMeta) {
      ogTitleMeta.content = settings.siteName;
    }

    const ogDescriptionMeta = document.querySelector(
      'meta[property="og:description"]',
    ) as HTMLMetaElement | null;
    if (ogDescriptionMeta) {
      ogDescriptionMeta.content = settings.tagline;
    }

    const root = document.documentElement;
    root.style.setProperty("--brand-primary", settings.primaryColor);
    root.style.setProperty("--brand-secondary", settings.secondaryColor);

    const faviconElement = document.querySelector(
      'link[rel="icon"]',
    ) as HTMLLinkElement | null;

    if (faviconElement && faviconOriginalHrefRef.current === null) {
      faviconOriginalHrefRef.current = faviconElement.href;
    }

    if (!faviconElement) {
      return;
    }

    if (settings.logoUrl) {
      faviconElement.href = settings.logoUrl;
    } else if (faviconOriginalHrefRef.current) {
      faviconElement.href = faviconOriginalHrefRef.current;
    }
  }, [settings]);

  const saveSettings = useCallback(async (nextSettings: SiteSettings) => {
    const payload = sanitizeSettings(nextSettings);
    const settingsRef = doc(db, SITE_SETTINGS_COLLECTION, SITE_SETTINGS_DOC);

    await setDoc(
      settingsRef,
      {
        ...payload,
        updated_at: serverTimestamp(),
      },
      { merge: true },
    );
  }, []);

  const canEdit = useMemo(() => {
    return profile?.role === "admin" || profile?.role === "registrar";
  }, [profile?.role]);

  const value = useMemo(
    () => ({
      settings,
      loading,
      canEdit,
      saveSettings,
    }),
    [settings, loading, canEdit, saveSettings],
  );

  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  const context = useContext(SiteSettingsContext);

  if (!context) {
    throw new Error("useSiteSettings must be used inside SiteSettingsProvider");
  }

  return context;
}

export { DEFAULT_SITE_SETTINGS };
