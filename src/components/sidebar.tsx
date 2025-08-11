"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Package,
  DollarSign,
  Users,
  Box,
  Heart,
  Search,
  Settings,
  BarChart3,
  ShoppingCart,
  Tags,
} from "lucide-react"

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: BarChart3,
  },
  {
    name: "Inventory",
    href: "/inventory",
    icon: Package,
  },
  {
    name: "Sales",
    href: "/sales",
    icon: DollarSign,
  },
  {
    name: "Vendor Orders",
    href: "/orders",
    icon: ShoppingCart,
  },
  {
    name: "Boxes & Packs",
    href: "/packs",
    icon: Box,
  },
  {
    name: "Customer Interest",
    href: "/interests",
    icon: Heart,
  },
  {
    name: "eBay Scanner",
    href: "/ebay-scanner",
    icon: Search,
  },
  {
    name: "Categories",
    href: "/categories",
    icon: Tags,
  },
  {
    name: "Vendors",
    href: "/vendors",
    icon: Users,
  },
  {
    name: "Admin",
    href: "/admin",
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col w-64 bg-white shadow-lg">
      <div className="flex items-center justify-center h-16 px-4 border-b">
        <h1 className="text-xl font-bold text-gray-800">
          Collector Manager
        </h1>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                isActive
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
