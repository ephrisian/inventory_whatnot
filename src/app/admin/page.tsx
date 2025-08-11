"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Settings, Key, Shield, Database, Globe } from "lucide-react"

interface ApiConfig {
  id: string
  platform: string
  isActive: boolean
  hasApiKey: boolean
  lastUpdated: string
}

export default function AdminPage() {
  const [apiConfigs, setApiConfigs] = useState<ApiConfig[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock data for now - will connect to actual API
    setTimeout(() => {
      setApiConfigs([
        {
          id: "1",
          platform: "eBay",
          isActive: false,
          hasApiKey: false,
          lastUpdated: "Never",
        },
        {
          id: "2",
          platform: "TCGPlayer",
          isActive: false,
          hasApiKey: false,
          lastUpdated: "Never",
        },
        {
          id: "3",
          platform: "Whatnot",
          isActive: false,
          hasApiKey: false,
          lastUpdated: "Never",
        },
      ])
      setLoading(false)
    }, 500)
  }, [])

  const platformDescriptions = {
    eBay: "Browse seller inventories and sync listings",
    TCGPlayer: "Get real-time pricing for trading cards",
    Whatnot: "Export inventory and sync sales data",
  }

  const platformIcons = {
    eBay: Globe,
    TCGPlayer: Database,
    Whatnot: Shield,
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Portal</h1>
          <p className="text-gray-600">Manage API connections and system settings</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Portal</h1>
        <p className="text-gray-600">Manage API connections and system settings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {apiConfigs.map((config) => {
          const Icon = platformIcons[config.platform as keyof typeof platformIcons]
          return (
            <Card key={config.id} className="relative">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Icon className="h-5 w-5 text-gray-600" />
                  <span>{config.platform}</span>
                  <div className="ml-auto">
                    <div className={`w-3 h-3 rounded-full ${
                      config.isActive ? 'bg-green-500' : 'bg-gray-300'
                    }`}></div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  {platformDescriptions[config.platform as keyof typeof platformDescriptions]}
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">API Key:</span>
                    <span className={config.hasApiKey ? 'text-green-600' : 'text-red-600'}>
                      {config.hasApiKey ? 'Configured' : 'Not Set'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Status:</span>
                    <span className={config.isActive ? 'text-green-600' : 'text-gray-600'}>
                      {config.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Last Updated:</span>
                    <span className="text-gray-600">{config.lastUpdated}</span>
                  </div>
                </div>
                
                <div className="mt-4 space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      // TODO: Open configuration modal
                      alert(`Configure ${config.platform} API`)
                    }}
                  >
                    <Key className="h-4 w-4 mr-2" />
                    Configure API
                  </Button>
                  
                  {config.hasApiKey && (
                    <Button 
                      variant={config.isActive ? "destructive" : "default"}
                      className="w-full"
                      onClick={() => {
                        // TODO: Toggle API status
                        const newConfigs = apiConfigs.map(c => 
                          c.id === config.id 
                            ? { ...c, isActive: !c.isActive }
                            : c
                        )
                        setApiConfigs(newConfigs)
                      }}
                    >
                      {config.isActive ? 'Disable' : 'Enable'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>System Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Auto-backup Database</div>
                  <div className="text-sm text-gray-500">Daily backup to local storage</div>
                </div>
                <Button variant="outline" size="sm">
                  Configure
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Low Stock Alerts</div>
                  <div className="text-sm text-gray-500">Alert when quantity falls below threshold</div>
                </div>
                <Button variant="outline" size="sm">
                  Set Threshold
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Export Templates</div>
                  <div className="text-sm text-gray-500">Customize CSV export formats</div>
                </div>
                <Button variant="outline" size="sm">
                  Manage
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Database Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Items:</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Sales:</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Database Size:</span>
                <span className="font-medium">2.4 KB</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Last Backup:</span>
                <span className="font-medium">Never</span>
              </div>
              <Button variant="outline" className="w-full mt-4">
                Create Backup
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
