'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function NotificationShowcase() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-green-600">
              🎨 Notification System Test
            </CardTitle>
            <p className="text-gray-600">
              Test notification system components
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg text-gray-800">Basic Tests</h3>
                <Button 
                  onClick={() => alert('Test notification!')}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  Test Button
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
