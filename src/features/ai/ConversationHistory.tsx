"use client";

/**
 * ConversationHistory — sidebar list of past AI conversations.
 */

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Plus } from "lucide-react";
import { aiService } from "@/services/ai.service";
import type { Conversation } from "@/types";
import { formatDate, truncate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface ConversationHistoryProps {
  activeId?: string;
  onSelect: (id: string) => void;
  onNew: () => void;
}

export function ConversationHistory({
  activeId,
  onSelect,
  onNew,
}: ConversationHistoryProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    aiService.getConversations().then((data) => {
      setConversations(data);
      setIsLoading(false);
    });
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <p className="text-sm font-semibold text-text">Conversations</p>
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={onNew}
          aria-label="New conversation"
          title="New conversation"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {isLoading ? (
          <div className="p-3 space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <MessageSquare className="h-8 w-8 text-muted mb-2" aria-hidden="true" />
            <p className="text-sm text-muted">No past conversations yet.</p>
          </div>
        ) : (
          <ul className="p-2 space-y-1" role="list">
            {conversations.map((conv) => (
              <motion.li
                key={conv.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <button
                  onClick={() => onSelect(conv.id)}
                  className={`w-full text-left p-3 rounded-xl transition-colors group ${
                    activeId === conv.id
                      ? "bg-primary-50 border border-primary-200"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold text-text line-clamp-1 flex-1">
                      {conv.title}
                    </p>
                    <span className="text-xs text-muted shrink-0">
                      {formatDate(conv.updatedAt, "MMM d")}
                    </span>
                  </div>
                  {conv.messages.length > 0 && (
                    <p className="text-xs text-muted mt-0.5 line-clamp-2">
                      {truncate(
                        conv.messages[conv.messages.length - 1]?.content ?? "",
                        60
                      )}
                    </p>
                  )}
                  {conv.tags.length > 0 && (
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {conv.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-gray-100 text-muted px-1.5 py-0.5 rounded-full capitalize"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
