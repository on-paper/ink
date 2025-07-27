"use client";

import { 
  Apple, 
  Clock, 
  Flag, 
  Gamepad2, 
  Hash, 
  MapPin, 
  Package, 
  SearchIcon, 
  Smile, 
  TreePine, 
  User 
} from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { EMOJI_CATEGORIES, type EmojiWithGroup, getEmojisByCategory, searchEmojis } from "./emojiCategories";

interface EmojiPickerProps {
  onEmojiClick: (emoji: { emoji: string; names: string[] }) => void;
  className?: string;
}

const EMOJI_GRID_HEIGHT = 300;
const EMOJI_SIZE = 32;
const EMOJIS_PER_ROW = 8;
const ROW_HEIGHT = 40;

export function EmojiPicker({ onEmojiClick, className = "" }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState("smileys");
  const [searchQuery, setSearchQuery] = useState("");
  const [recentEmojis, setRecentEmojis] = useState<EmojiWithGroup[]>([]);
  const { theme } = useTheme();

  // Load recent emojis from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("recent-emojis");
      if (stored) {
        const parsed = JSON.parse(stored);
        setRecentEmojis(Array.isArray(parsed) ? parsed.slice(0, 16) : []);
      }
    } catch (error) {
      console.warn("Failed to load recent emojis:", error);
    }
  }, []);

  // Save recent emoji
  const addToRecent = useCallback(
    (emoji: EmojiWithGroup) => {
      const newRecent = [emoji, ...recentEmojis.filter((e) => e.emoji !== emoji.emoji)].slice(0, 16);

      setRecentEmojis(newRecent);

      try {
        localStorage.setItem("recent-emojis", JSON.stringify(newRecent));
      } catch (error) {
        console.warn("Failed to save recent emojis:", error);
      }
    },
    [recentEmojis],
  );

  // Handle emoji selection
  const handleEmojiClick = useCallback(
    (emoji: EmojiWithGroup, event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      
      addToRecent(emoji);
      onEmojiClick({
        emoji: emoji.emoji,
        names: emoji.names,
      });
    },
    [onEmojiClick, addToRecent],
  );

  // Get emojis to display based on search or category
  const displayEmojis = useMemo(() => {
    if (searchQuery.trim()) {
      return searchEmojis(searchQuery.trim());
    }

    if (activeCategory === "recent") {
      return recentEmojis;
    }

    return getEmojisByCategory(activeCategory);
  }, [searchQuery, activeCategory, recentEmojis]);

  // Clear search when changing categories
  const handleCategoryChange = useCallback((categoryId: string) => {
    setActiveCategory(categoryId);
    setSearchQuery("");
  }, []);

  // Icon mapping for categories
  const getIconComponent = (lucideIcon: string) => {
    const iconMap: Record<string, React.ComponentType<any>> = {
      Smile,
      User,
      TreePine,
      Apple,
      MapPin,
      Gamepad2,
      Package,
      Hash,
      Flag,
    };
    return iconMap[lucideIcon] || Smile;
  };

  return (
    <div className={`w-80 max-w-[90vw] ${className}`}>
      {/* Search */}
      <div className="border-b pb-1.5">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search emojis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            autoComplete="off"
          />
        </div>
      </div>

      <Tabs value={activeCategory} onValueChange={handleCategoryChange}>
        {/* Category Tabs */}
        <div className="border-b">
          <TabsList className="w-full h-auto p-1 bg-transparent grid grid-cols-10 sm:grid-cols-10 gap-0">
            {recentEmojis.length > 0 && (
              <TabsTrigger value="recent" className="flex-1 p-2 text-xs data-[state=active]:bg-accent" title="Recent">
                <Clock className="h-4 w-4" />
              </TabsTrigger>
            )}
            {EMOJI_CATEGORIES.map((category) => {
              const IconComponent = getIconComponent(category.lucideIcon);
              return (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="flex-1 p-2 text-xs data-[state=active]:bg-accent"
                  title={category.name}
                >
                  <IconComponent className="h-4 w-4" />
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {/* Emoji Grid */}
        <div className="h-[300px]">
          <ScrollArea className="h-full">
            <div className="p-2">
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-1">
                {displayEmojis.map((emoji, index) => (
                  <Button
                    key={`${emoji.emoji}-${index}`}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                    onClick={(e) => handleEmojiClick(emoji, e)}
                    title={`:${emoji.names[0]}:`}
                  >
                    <span className="text-lg">{emoji.emoji}</span>
                  </Button>
                ))}
              </div>

              {displayEmojis.length === 0 && (
                <div className="flex items-center justify-center h-40 text-muted-foreground">
                  <div className="text-center">
                    <span className="text-2xl mb-2 block">🔍</span>
                    {searchQuery.trim() ? (
                      <p className="text-sm">No emojis found for "{searchQuery}"</p>
                    ) : (
                      <p className="text-sm">No emojis in this category</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </Tabs>
    </div>
  );
}
