"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import { PeopleTab } from "./PeopleTab";
import { ConnectionRequestsCard } from "./ConnectionRequestsCard";

export function ConnectionsView() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-primary-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Connections
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Connect with people and listeners on TalkFriendly
            </p>
          </div>
        </div>

        {/* Pending Requests Card */}
        <ConnectionRequestsCard />

        {/* People List */}
        <PeopleTab />
      </div>
    </div>
  );
}
