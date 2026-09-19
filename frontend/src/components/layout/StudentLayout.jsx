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

  return (
    <div className="min-h-screen bg-[#f7f8fa] dark:bg-zinc-950">
      <StudentSidebar
        activeTab={activeTab}
        onTabChange={onTabChange}
        student={student}
        onLogout={onLogout}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() =>
          setSidebarCollapsed((current) => !current)
        }
      />

      <MobileNavigation
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
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