"use client"

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeSwitch } from "@/components/theme-switch";
import { Menu, Home, Briefcase, LogOut, User, FileText } from "lucide-react";
import { BadgeNotification } from "@/components/BadgeNotification";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  const [notifications, setNotifications] = useState([]);
  const [adminName, setAdminName] = useState("");
  const [permissions, setPermissions] = useState(null);
  const [error, setError] = useState(null);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/logout");
      if (res.ok) {
        router.push("/login");
      } else {
        console.error("Logout failed:", await res.text());
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setError(null);
        const res = await fetch("/api/auth/me");
        
        // Check if we got a valid JSON response
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await res.text();
          console.error("Non-JSON response:", text);
          setError("Received non-JSON response");
          return;
        }

        if (res.ok) {
          const data = await res.json();
          console.log("Admin data fetched:", data);
          setAdminName(data.name || "");
          setPermissions(data.permissions || null);
        } else {
          const errorData = await res.json();
          console.error("Failed to fetch admin data:", errorData);
          setError(errorData.error || "Failed to fetch admin data");
        }
      } catch (error) {
        console.error("Error fetching admin data:", error);
        setError(error.message || "Failed to fetch admin data");
      }
    };

    if (!isLoginPage) {
      fetchAdminData();
    }
  }, [pathname, isLoginPage]);

  if (isLoginPage) return null;

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4 w-full">
        {/* Left Section */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="h-6 w-6 bg-primary rounded-lg" />
            <span className="text-primary">MAPOS</span>
          </Link>
          {error && <div className="ml-4 text-xs text-destructive">{error}</div>}
        </div>

        {/* Middle Section (Links for Desktop) */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className={`flex items-center text-sm font-medium ${pathname === "/" ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
          >
            <Home className="mr-2 h-4 w-4" />
            Ana Sayfa
          </Link>

          {permissions?.canViewServices && (
            <Link
              href="/services"
              className={`flex items-center text-sm font-medium ${pathname.startsWith("/services") ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
            >
              <Briefcase className="mr-2 h-4 w-4" />
              Hizmetler
            </Link>
          )}

          <Link
            href="/log"
            className={`flex items-center text-sm font-medium ${pathname.startsWith("/log") ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
          >
            <FileText className="mr-2 h-4 w-4" />
            Müşteri Hareketleri
          </Link>

          {permissions?.canViewAdmins && (
            <Link
              href="/admins"
              className={`flex items-center text-sm font-medium ${pathname.startsWith("/admins") ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
            >
              <User className="mr-2 h-4 w-4" />
              Users
            </Link>
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          <BadgeNotification
            initialNotifications={notifications}
            onNotificationsChange={setNotifications}
          />
          <ThemeSwitch />

          {/* Show Admin Name */}
          {adminName && (
            <span className="text-sm font-medium text-primary">{adminName}</span>
          )}

          {/* Dropdown for Mobile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild className={pathname === "/" ? "text-primary" : ""}>
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Ana Sayfa
                </Link>
              </DropdownMenuItem>

              {permissions?.canViewServices && (
                <DropdownMenuItem asChild className={pathname.startsWith("/services") ? "text-primary" : ""}>
                  <Link href="/services">
                    <Briefcase className="mr-2 h-4 w-4" />
                    Hizmetler
                  </Link>
                </DropdownMenuItem>
              )}

              <DropdownMenuItem asChild className={pathname.startsWith("/log") ? "text-primary" : ""}>
                <Link href="/log">
                  <FileText className="mr-2 h-4 w-4" />
                  Müşteri Hareketleri
                </Link>
              </DropdownMenuItem>

              {permissions?.canViewAdmins && (
                <DropdownMenuItem asChild className={pathname.startsWith("/admins") ? "text-primary" : ""}>
                  <Link href="/admins">
                    <User className="mr-2 h-4 w-4" />
                    Admin
                  </Link>
                </DropdownMenuItem>
              )}

              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Logout Button for Desktop */}
          <Button variant="destructive" size="sm" className="hidden md:flex" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
}