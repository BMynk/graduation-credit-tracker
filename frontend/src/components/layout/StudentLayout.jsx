import { useEffect, useState } from "react";
import StudentSidebar from "./StudentSidebar";
import StudentHeader from "./StudentHeader";
import MobileNavigation from "./MobileNavigation";

export default function StudentLayout({
  activeTab,
  onTabChange,
  student,
  onLogout,
  children,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  // ============================================================
  // THEME
  // ============================================================

  const [darkMode, setDarkMode] = useState(() => {
    try {
      const savedTheme = localStorage.getItem(
        "student-theme"
      );

      if (savedTheme === "dark") {
        return true;
      }

      if (savedTheme === "light") {
        return false;
      }

      return document.documentElement.classList.contains(
        "dark"
      );
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;

    if (darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    try {
      localStorage.setItem(
        "student-theme",
        darkMode ? "dark" : "light"
      );
    } catch {
      // Ignore storage errors.
    }
  }, [darkMode]);

  // ============================================================
  // SIDEBAR
  // ============================================================

  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(() => {
      try {
        return (
          localStorage.getItem(
            "student-sidebar-collapsed"
          ) === "true"
        );
      } catch {
        return false;
      }
    });

  useEffect(() => {
    try {
      localStorage.setItem(
        "student-sidebar-collapsed",
        String(sidebarCollapsed)
      );
    } catch {
      // Ignore storage errors.
    }
  }, [sidebarCollapsed]);

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen bg-[#f7f8fa] transition-colors duration-200 dark:bg-zinc-950">
      <StudentSidebar
        activeTab={activeTab}
        onTabChange={onTabChange}
        student={student}
        onLogout={onLogout}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() =>
          setSidebarCollapsed(
            (current) => !current
          )
        }
      />

      <MobileNavigation
        open={mobileMenuOpen}
        onClose={() =>
          setMobileMenuOpen(false)
        }
        activeTab={activeTab}
        onTabChange={onTabChange}
        onLogout={onLogout}
      />

      <div
        className={`min-h-screen transition-[padding] duration-300 ease-in-out ${
          sidebarCollapsed
            ? "lg:pl-[80px]"
            : "lg:pl-[260px]"
        }`}
      >
        <StudentHeader
          student={student}
          darkMode={darkMode}
          onToggleDarkMode={() =>
            setDarkMode(
              (current) => !current
            )
          }
          onOpenCommunity={(notification) => {
            if (notification) {
              sessionStorage.setItem(
                "community-notification-target",
                JSON.stringify(notification)
              );
            }
            onTabChange("community");
          }}
          onOpenMobileMenu={() =>
            setMobileMenuOpen(true)
          }
        />

        <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}