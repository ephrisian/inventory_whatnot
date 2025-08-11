"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Upload, Download, Search, Package } from "lucide-react"
import Link from "next/link"

export function QuickActions() {
  const actions = [
    {
      title: "Add New Item",
      description: "Add items to inventory",
      icon: Plus,
      href: "/inventory/new",
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      title: "Record Sale",
      description: "Log a new sale",
      icon: Package,
      href: "/sales/new",
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      title: "Import CSV",
      description: "Bulk import items",
      icon: Upload,
      href: "/inventory/import",
      color: "bg-purple-500 hover:bg-purple-600",
    },
    {
      title: "Export Data",
      description: "Download inventory",
      icon: Download,
      href: "/inventory/export",
      color: "bg-orange-500 hover:bg-orange-600",
    },
    {
      title: "eBay Scanner",
      description: "Scan seller inventory",
      icon: Search,
      href: "/ebay-scanner",
      color: "bg-indigo-500 hover:bg-indigo-600",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3">
          {actions.map((action, index) => (
            <Link key={index} href={action.href}>
              <Button
                variant="outline"
                className="w-full justify-start h-auto p-4 hover:bg-gray-50"
              >
                <div className={`p-2 rounded-lg ${action.color} mr-3`}>
                  <action.icon className="h-4 w-4 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">{action.title}</div>
                  <div className="text-sm text-gray-500">{action.description}</div>
                </div>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
