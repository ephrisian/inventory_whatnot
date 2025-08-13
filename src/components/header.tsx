"use client"

import { Bell, Search, User } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export function Header() {
  return (
    <header className="bg-background border-b h-16 flex items-center justify-between px-6">
      <div className="flex items-center space-x-4">
        <h2 className="text-lg font-semibold text-foreground">
          Welcome back!
        </h2>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <input
            type="text"
            placeholder="Search inventory..."
            className="pl-10 pr-4 py-2 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
          />
        </div>
        
        <button className="relative p-2 text-muted-foreground hover:text-foreground">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive rounded-full text-xs text-destructive-foreground flex items-center justify-center">
            3
          </span>
        </button>
        
        <ThemeToggle />
        
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-sm font-medium text-foreground">Admin</span>
        </div>
      </div>
    </header>
  )
}
