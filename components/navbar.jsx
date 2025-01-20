"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Twitter, Github, Search, LogOut, Menu, X } from "lucide-react";
import { BadgeNotification } from "@/components/BadgeNotification";
import { ThemeSwitch } from "@/components/theme-switch";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (pathname === "/login") {
    return null;
  }

  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/orders", label: "Orders" },
    { href: "/inventory", label: "Inventory" },
    { href: "/reports", label: "Reports" },
  ];

  const searchInput = (
    <div className="relative w-full max-w-[400px]">
      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
      <Input placeholder="Search..." className="pl-8 pr-4" />
      <kbd className="pointer-events-none absolute right-3 top-2 hidden h-6 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 lg:flex">
        <span className="text-xs">⌘</span>S
      </kbd>
    </div>
  );

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="h-6 w-6 bg-primary rounded-lg" />
            <span>MAPOS</span>
          </Link>
          
          <div className="hidden lg:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === item.href ? "text-primary" : "text-foreground/60"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Right Section - Desktop */}
        <div className="hidden lg:flex items-center gap-4">
          <div className="flex items-center gap-2">
            {searchInput}
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground"
              asChild
            >
              <Link href="https://twitter.com/yourhandle">
                <Twitter className="h-5 w-5" />
              </Link>
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground"
              asChild
            >
              <Link href="https://github.com/yourrepo">
                <Github className="h-5 w-5" />
              </Link>
            </Button>
            <ThemeSwitch />
            <BadgeNotification />
            
            <Button
              variant="outline"
              onClick={async () => {
                await fetch("/api/logout");
                router.push("/login");
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="lg:hidden flex items-center gap-4">
          <ThemeSwitch />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden absolute w-full bg-background border-b">
          <div className="container py-4 space-y-4">
            {searchInput}
            
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "py-2 px-4 text-sm font-medium",
                    pathname === item.href ? "text-primary" : "text-foreground/60"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-4 pt-4 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={async () => {
                  await fetch("/api/logout");
                  router.push("/login");
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};