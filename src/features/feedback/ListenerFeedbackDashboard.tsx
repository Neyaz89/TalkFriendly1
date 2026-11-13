"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListenerFeedbackDisplay } from "./ListenerFeedbackDisplay";
import { Star, TrendingUp, Users, Eye, EyeOff, Search } from "lucide-react";

interface ListenerFeedbackDashboardProps {
  listenerId: string;
}

export function ListenerFeedbackDashboard({ listenerId }: ListenerFeedbackDashboardProps) {
  const [showPrivate, setShowPrivate] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Feedback & Ratings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View and manage client feedback
          </p>
        </div>
      </div>

      {/* Controls */}
      <Card className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search feedback..."
              className="pl-10"
            />
          </div>

          <Button
            variant={showPrivate ? "default" : "outline"}
            size="sm"
            onClick={() => setShowPrivate(!showPrivate)}
          >
            {showPrivate ? (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Showing All
              </>
            ) : (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Public Only
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">
            <Users className="h-4 w-4 mr-2" />
            All Feedback
          </TabsTrigger>
          <TabsTrigger value="public">
            <Eye className="h-4 w-4 mr-2" />
            Public
          </TabsTrigger>
          <TabsTrigger value="private">
            <EyeOff className="h-4 w-4 mr-2" />
            Private
          </TabsTrigger>
          <TabsTrigger value="anonymous">
            <Users className="h-4 w-4 mr-2" />
            Anonymous
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <ListenerFeedbackDisplay listenerId={listenerId} showPrivate={showPrivate} />
        </TabsContent>

        <TabsContent value="public" className="mt-6">
          <ListenerFeedbackDisplay listenerId={listenerId} showPrivate={false} />
        </TabsContent>

        <TabsContent value="private" className="mt-6">
          <Card className="p-12 text-center">
            <EyeOff className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2">Private Feedback</h3>
            <p className="text-gray-600 dark:text-gray-400">
              This view shows only feedback marked as private
            </p>
          </Card>
        </TabsContent>

        <TabsContent value="anonymous" className="mt-6">
          <Card className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2">Anonymous Feedback</h3>
            <p className="text-gray-600 dark:text-gray-400">
              This view shows only anonymous feedback
            </p>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Stats Summary */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <TrendingUp className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Rating</p>
              <p className="text-2xl font-bold">4.8/5</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Users className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Reviews</p>
              <p className="text-2xl font-bold">127</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <Star className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">5-Star Reviews</p>
              <p className="text-2xl font-bold">98</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
