import { lazy, Suspense, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { BRANDING } from "../config/branding";
import { PlatformSettingsProvider } from "./context/PlatformSettingsContext";

const PublicView = lazy(() => import("./pages/PublicView").then((module) => ({ default: module.PublicView })));
const LoginPage = lazy(() => import("./features/auth/LoginPage").then((module) => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import("./features/auth/RegisterPage").then((module) => ({ default: module.RegisterPage })));
const UmkmDashboard = lazy(() => import("./features/umkm/UmkmDashboard").then((module) => ({ default: module.UmkmDashboard })));
const PemerintahDashboard = lazy(() => import("./features/government/PemerintahDashboard").then((module) => ({ default: module.PemerintahDashboard })));
const AdminDashboard = lazy(() => import("./features/admin/AdminDashboard").then((module) => ({ default: module.AdminDashboard })));

type View = "public" | "login" | "register" | "umkm" | "pemerintah" | "admin";
const paths: Record<View, string> = { public: "/", login: "/login", register: "/register", umkm: "/dashboard/umkm", pemerintah: "/dashboard/pemerintah", admin: "/admin" };
const viewFromPath = (): View => (Object.entries(paths).find(([, path]) => path === window.location.pathname)?.[0] as View | undefined) ?? "public";
const roleFromUser = (user: { app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> } | null | undefined) => {
  const trustedRole = user?.app_metadata?.role;
  if (trustedRole === "admin" || trustedRole === "government") return trustedRole;
  return user?.user_metadata?.role === "umkm" ? "umkm" : null;
};

function LoadingScreen({ label = "Memuat aplikasi..." }: { label?: string }) {
  return <div className="flex h-[100dvh] items-center justify-center bg-[#F7F4EF] text-sm text-[#6B6558]">{label}</div>;
}

function MaintenanceScreen({ supportContact }: { supportContact: string }) {
  return <main className="flex min-h-[100dvh] items-center justify-center bg-[#F7F4EF] p-6 text-center"><div className="max-w-md rounded-3xl border bg-white p-8"><h1 className="text-xl font-extrabold">Sedang dalam pemeliharaan</h1><p className="mt-2 text-sm text-[#6B6558]">Layanan akan kembali tersedia setelah proses pemeliharaan selesai.</p>{supportContact && <p className="mt-4 text-xs font-semibold text-[#1B6B4E]">Bantuan: {supportContact}</p>}<a href="/login" className="mt-5 inline-block text-xs font-bold text-[#6B3FA0]">Masuk sebagai administrator</a></div></main>;
}

export default function App() {
  const [view, setView] = useState<View>(viewFromPath);
  const [authRole, setAuthRole] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [platformSettings, setPlatformSettings] = useState<{ maintenanceMode: boolean; platformName: string; supportContact: string }>({ maintenanceMode: false, platformName: BRANDING.platformName, supportContact: "" });

  useEffect(() => {
    document.title = platformSettings.platformName;
  }, [platformSettings.platformName]);

  useEffect(() => {
    const onPopState = () => setView(viewFromPath());
    window.addEventListener("popstate", onPopState);
    if (!supabase) { setReady(true); return () => window.removeEventListener("popstate", onPopState); }

    Promise.all([
      supabase.auth.getSession(),
      supabase.from("platform_settings").select("maintenance_mode,platform_name,support_contact").eq("id", true).maybeSingle(),
    ]).then(([sessionResult, settingsResult]) => {
      setAuthRole(roleFromUser(sessionResult.data.session?.user));
      setPlatformSettings({ maintenanceMode: settingsResult.data?.maintenance_mode ?? false, platformName: settingsResult.data?.platform_name || BRANDING.platformName, supportContact: settingsResult.data?.support_contact ?? "" });
      setReady(true);
    }).catch(() => setReady(true));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthRole(roleFromUser(session?.user));
      setReady(true);
    });
    const onSettingsUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ platform_name: string; maintenance_mode: boolean; support_contact: string }>).detail;
      setPlatformSettings({ maintenanceMode: detail.maintenance_mode, platformName: detail.platform_name || BRANDING.platformName, supportContact: detail.support_contact || "" });
    };
    window.addEventListener("platform-settings-updated", onSettingsUpdated);
    return () => { listener.subscription.unsubscribe(); window.removeEventListener("popstate", onPopState); window.removeEventListener("platform-settings-updated", onSettingsUpdated); };
  }, []);

  const navigate = (next: View) => { window.history.pushState({}, "", paths[next]); setView(next); };
  const logout = async () => { await supabase?.auth.signOut(); setAuthRole(null); navigate("public"); };

  if (!ready) return <LoadingScreen label="Memeriksa sesi..." />;
  if (platformSettings.maintenanceMode && authRole !== "admin" && view !== "login") return <MaintenanceScreen supportContact={platformSettings.supportContact} />;

  let page;
  if (view === "public") page = <PublicView onLogin={() => navigate("login")} />;
  else if (view === "login") page = <LoginPage onBack={() => navigate("public")} onSuccess={(role) => navigate(role)} onRegister={() => navigate("register")} />;
  else if (view === "register") page = <RegisterPage onBack={() => navigate("login")} onSuccess={() => navigate("login")} />;
  else if (view === "umkm" && authRole === "umkm") page = <UmkmDashboard onLogout={logout} />;
  else if (view === "pemerintah" && authRole === "government") page = <PemerintahDashboard onLogout={logout} />;
  else if (view === "admin" && authRole === "admin") page = <AdminDashboard onLogout={logout} />;
  else page = <LoginPage onBack={() => navigate("public")} onSuccess={(role) => navigate(role)} onRegister={() => navigate("register")} />;

  return <PlatformSettingsProvider value={{ platformName: platformSettings.platformName, supportContact: platformSettings.supportContact }}><Suspense fallback={<LoadingScreen />}>{page}</Suspense></PlatformSettingsProvider>;
}
