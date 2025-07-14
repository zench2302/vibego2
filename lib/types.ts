// 行程活动类型
export interface Activity {
  name: string;
  description: string;
  emoji: string;
  address: string;
}

// 餐厅类型
export interface Restaurant {
  name: string;
  description: string;
  emoji: string;
  address: string;
}

// 每一天的行程
export interface Day {
  day: number;
  theme: string;
  activities: Activity[];
  restaurants: Restaurant[];
}

// 行程主类型
export interface Itinerary {
  destination: string;
  tripTitle: string;
  dailyItinerary: Day[];
  soulQuote?: string;
  soulProfile?: SoulProfile;
  createdAt?: string;
  // 新增字段
  budget?: number | string;
  companions?: string;
  startDate?: string;
  endDate?: string;
}

// SoulProfile 类型
export interface SoulProfile {
  archetype: {
    name: string;
    emoji: string;
  };
  mood: string;
  intention: string;
  practical: {
    startDate: string;
    endDate: string;
    budget: number | string;
    companions: string;
    destination: string;
  };
  [key: string]: unknown; // 兼容扩展
}

export interface Location {
  id: string;
  name: string;
  day: number; // 新增
  description?: string;
  address?: string;
  lat?: number;
  lng?: number;
  [key: string]: unknown; // 兼容扩展
}

// PersonalityProfile 类型
export interface PersonalityProfile {
  type: string;
  emoji: string;
  description: string;
  traits: {
    adventurous: number;
    cultural: number;
    relaxed: number;
    social: number;
    foodie: number;
    photographer: number;
  };
  answers: Record<number, string>;
}