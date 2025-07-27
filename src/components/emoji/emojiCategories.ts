import data from "emojibase-data/en/data.json";
import { type EmojiData, emojiList } from "../composer/emojiList";

// Emojibase group constants (manually defined based on analysis)
export const EMOJI_GROUPS = {
  SMILEYS_EMOTION: 0,
  PEOPLE_BODY: 1,
  COMPONENT: 2,
  ANIMALS_NATURE: 3,
  FOOD_DRINK: 4,
  TRAVEL_PLACES: 5,
  ACTIVITIES: 6,
  OBJECTS: 7,
  SYMBOLS: 8,
  FLAGS: 9,
} as const;

export interface EmojiCategory {
  id: string;
  name: string;
  icon: string;
  lucideIcon: string;
  group: number;
}

export const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: "smileys",
    name: "Smileys & Emotion",
    icon: "😀",
    lucideIcon: "Smile",
    group: EMOJI_GROUPS.SMILEYS_EMOTION,
  },
  {
    id: "people",
    name: "People & Body",
    icon: "👋",
    lucideIcon: "User",
    group: EMOJI_GROUPS.PEOPLE_BODY,
  },
  {
    id: "animals",
    name: "Animals & Nature",
    icon: "🐵",
    lucideIcon: "TreePine",
    group: EMOJI_GROUPS.ANIMALS_NATURE,
  },
  {
    id: "food",
    name: "Food & Drink",
    icon: "🍇",
    lucideIcon: "Apple",
    group: EMOJI_GROUPS.FOOD_DRINK,
  },
  {
    id: "travel",
    name: "Travel & Places",
    icon: "🌍",
    lucideIcon: "MapPin",
    group: EMOJI_GROUPS.TRAVEL_PLACES,
  },
  {
    id: "activities",
    name: "Activities",
    icon: "🎃",
    lucideIcon: "Gamepad2",
    group: EMOJI_GROUPS.ACTIVITIES,
  },
  {
    id: "objects",
    name: "Objects",
    icon: "👓",
    lucideIcon: "Package",
    group: EMOJI_GROUPS.OBJECTS,
  },
  {
    id: "symbols",
    name: "Symbols",
    icon: "🏧",
    lucideIcon: "Hash",
    group: EMOJI_GROUPS.SYMBOLS,
  },
  {
    id: "flags",
    name: "Flags",
    icon: "🏁",
    lucideIcon: "Flag",
    group: EMOJI_GROUPS.FLAGS,
  },
];

// Enhanced emoji data with group information
export interface EmojiWithGroup extends EmojiData {
  group: number;
  subgroup: number;
}

// Create emoji data with group information by cross-referencing with original data
const createEmojiMap = () => {
  const emojiMap = new Map<string, (typeof data)[0]>();
  data.forEach((item) => {
    if (item.emoji) {
      emojiMap.set(item.emoji, item);
    }
  });
  return emojiMap;
};

const emojiMap = createEmojiMap();

export const emojiListWithGroups: EmojiWithGroup[] = emojiList
  .map((emoji) => {
    const originalData = emojiMap.get(emoji.emoji);
    return {
      ...emoji,
      group: originalData?.group ?? EMOJI_GROUPS.SYMBOLS, // Default to symbols if no group found
      subgroup: originalData?.subgroup ?? 0,
    };
  })
  .filter((emoji) => emoji.group !== EMOJI_GROUPS.COMPONENT); // Filter out component group (skin tones, etc.)

// Group emojis by category
export const getEmojisByCategory = (categoryId: string): EmojiWithGroup[] => {
  const category = EMOJI_CATEGORIES.find((cat) => cat.id === categoryId);
  if (!category) return [];

  return emojiListWithGroups.filter((emoji) => emoji.group === category.group);
};

// Get all emojis organized by category
export const getEmojisByCategories = (): Record<string, EmojiWithGroup[]> => {
  const result: Record<string, EmojiWithGroup[]> = {};

  EMOJI_CATEGORIES.forEach((category) => {
    result[category.id] = getEmojisByCategory(category.id);
  });

  return result;
};

// Search emojis (reuse logic from typeahead)
export const searchEmojis = (query: string, limit = 50): EmojiWithGroup[] => {
  if (!query.trim()) return [];

  const searchQuery = query.toLowerCase();

  return emojiListWithGroups
    .filter((emoji) => {
      return (
        emoji.names.some((name) => name.toLowerCase().includes(searchQuery)) ||
        emoji.keywords.some((keyword) => keyword.toLowerCase().includes(searchQuery))
      );
    })
    .slice(0, limit);
};
