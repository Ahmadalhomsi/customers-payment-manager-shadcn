"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeSwitch } from "@/components/theme-switch"
import { Sun, Moon, Github, LogOut, Menu, LayoutDashboard, ChartPie, Settings } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { BadgeNotification } from "@/components/BadgeNotification"
import { useState } from "react"

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const isLoginPage = pathname === "/login"
  const [notifications, setNotifications] = useState([]);

  const handleLogout = async () => {
    await fetch("/api/logout")
    router.push("/login")
  }

  if (isLoginPage) return null

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4">
        {/* Left Section */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="h-6 w-6 bg-primary rounded-lg" />
            <span className="text-primary">MAPOS</span>
          </Link>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          <BadgeNotification
            initialNotifications={notifications}
            onNotificationsChange={setNotifications}
          />
          <ThemeSwitch />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/dashboard/main">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Main Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/analytics">
                  <ChartPie className="mr-2 h-4 w-4" />
                  Analytics Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings Dashboard
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
  )
}