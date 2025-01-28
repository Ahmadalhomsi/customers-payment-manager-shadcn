"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeSwitch } from "@/components/theme-switch";
import { Menu, Home, Briefcase, LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { BadgeNotification } from "@/components/BadgeNotification";
import { useState } from "react";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  const [notifications, setNotifications] = useState([]);

  const handleLogout = async () => {
    await fetch("/api/logout");
    router.push("/login");
  };

  if (isLoginPage) return null;

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4">
        {/* Left Section */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="h-6 w-6 bg-primary rounded-lg" />
            <span className="text-primary">MAPOS</span>
          </Link>
        </div>

        {/* Middle Section (Links for Desktop) */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className={`flex items-center text-sm font-medium ${pathname === "/"
              ? "text-primary"
              : "text-muted-foreground hover:text-primary"
              }`}
          >
            <Home className="mr-2 h-4 w-4" />
            Ana Sayfa
          </Link>
          <Link
            href="/services"
            className={`flex items-center text-sm font-medium ${pathname.startsWith("/services")
              ? "text-primary"
              : "text-muted-foreground hover:text-primary"
              }`}
          >
            <Briefcase className="mr-2 h-4 w-4" />
            Hizmetler
          </Link>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          <BadgeNotification
            initialNotifications={notifications}
            onNotificationsChange={setNotifications}
          />
          <ThemeSwitch />

          {/* Dropdown for Mobile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                asChild
                className={pathname === "/" ? "text-primary" : ""}
              >
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Ana Sayfa
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                asChild
                className={
                  pathname.startsWith("/services") ? "text-primary" : ""
                }
              >
                <Link href="/services">
                  <Briefcase className="mr-2 h-4 w-4" />
                  Hizmetler
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Logout Button for Desktop */}
          <Button
            variant="destructive"
            size="sm"
            className="hidden md:flex"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
}