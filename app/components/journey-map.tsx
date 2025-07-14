"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  MapPin,
  Clock,
  DollarSign,
  Star,
  Navigation,
  Edit3,
  Save,
  Share2,
  Heart,
  Sparkles,
  Map,
  List,
  Check,
} from "lucide-react"
import { oracleSteps } from "@/lib/oracle-data"
import type { Itinerary, SoulProfile, Day, Activity, Restaurant } from "@/lib/types"

// We need a small utility to create an API client
// In a real app, this would be in its own file, e.g., lib/api.ts
const api = {
  generateItinerary: async (answers: SoulProfile) => {
    const response = await fetch('/api/generate-itinerary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ error: "Unknown API error" }));
      throw new Error(errorBody.error || 'Failed to fetch itinerary');
    }

    return response.json();
  }
}

interface JourneyMapProps {
  soulProfile: SoulProfile;
  onComplete: (blueprint: Itinerary) => void;
}

export default function JourneyMap({ soulProfile, onComplete }: JourneyMapProps) {
  const [journeyData, setJourneyData] = useState<Itinerary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState("journey")
  const [completedActivities, setCompletedActivities] = useState<Set<string>>(new Set())
  const [globalChangePrompt, setGlobalChangePrompt] = useState("")

  useEffect(() => {
    const generateJourney = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await api.generateItinerary(soulProfile)
        setJourneyData(data.itinerary) // The API returns { itinerary: { ... } }
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error("Failed to generate journey:", err)
          setError(err.message || "A cosmic disturbance occurred while weaving your journey.")
        } else {
          console.error("Failed to generate journey:", err)
          setError("A cosmic disturbance occurred while weaving your journey.")
        }
      } finally {
        setLoading(false)
      }
    }

    generateJourney()
  }, [soulProfile])

  const handleDaySelect = (dayNumber: number) => {
    setSelectedDay(selectedDay === dayNumber ? null : dayNumber)
  }

  const handleActivityComplete = (dayIndex: number, activityIndex: number) => {
    const activityId = `${dayIndex}-${activityIndex}`
    setCompletedActivities((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(activityId)) {
        newSet.delete(activityId)
      } else {
        newSet.add(activityId)
      }
      return newSet
    })
  }

  const handleSaveJourney = () => {
    if (!journeyData) return;
    
    onComplete({
      ...journeyData,
      destination: journeyData.destination || 'Unknown Destination',
      tripTitle: journeyData.tripTitle || 'My Journey',
      dailyItinerary: journeyData.dailyItinerary || [],
      soulProfile,
      createdAt: new Date().toISOString(),
    })
  }

  const getUserPreferencesDescription = () => {
    // We need to find the full archetype object to get the description
    const archetypeInfo = oracleSteps.find(step => step.id === 'archetype')?.options?.find(o => o.value === soulProfile.archetype.name);
    const moodInfo = oracleSteps.find(step => step.id === 'mood')?.options?.find(o => o.value === soulProfile.mood);

    return {
      archetype: `${archetypeInfo?.emoji || '✨'} ${archetypeInfo?.label || 'Unknown'}: ${archetypeInfo?.description || ''}`,
      mood: `${moodInfo?.emoji || '🌀'} ${moodInfo?.label || 'Unknown'}: ${moodInfo?.description || ''}`,
      philosophy: soulProfile.philosophy || 'Unknown',
      intention: soulProfile.intention || 'Unknown',
      destinations: Array.isArray(soulProfile.destinations) ? soulProfile.destinations.join(", ") : "Various experiences",
    } as const
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <Card className="w-full max-w-md border border-white/10 shadow-2xl bg-white/5 backdrop-blur-xl">
          <CardContent className="text-center py-12">
            <div className="relative mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-400 mx-auto"></div>
              <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-amber-400 animate-pulse" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-slate-100">Weaving Your Sacred Journey</h3>
            <p className="text-slate-300">The cosmic forces are aligning your perfect itinerary...</p>
            {soulProfile.archetype && <div className="mt-4 text-sm text-purple-200">✨ Channeling {soulProfile.archetype.name} energy ✨</div>}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border border-white/10 shadow-2xl bg-white/5 backdrop-blur-xl">
          <CardContent className="text-center py-12">
            <div className="mb-6">
              <Sparkles className="h-16 w-16 text-red-400 mx-auto mb-4" />
            </div>
            <h3 className="text-2xl font-semibold mb-2 text-slate-100">Journey Generation Failed</h3>
            <p className="text-slate-300 mb-6 max-w-sm mx-auto">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  if (!journeyData) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 flex items-center justify-center">
            <p className="text-white">No journey data available.</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Journey Header */}
        <Card className="mb-8 border border-white/10 shadow-2xl bg-white/5 backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-6xl">{soulProfile.archetype.emoji}</div>
                <div>
                  <CardTitle className="text-3xl font-bold mb-2 text-slate-100">{journeyData.tripTitle}</CardTitle>
                  <div className="flex items-center gap-4 text-slate-300">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {journeyData.destination}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {journeyData.dailyItinerary?.length || 0} days
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />$Budget TBD
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditMode(!editMode)}
                  className="border-white/20 text-slate-200 hover:bg-white/10 bg-white/5"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  {editMode ? "View" : "Edit"}
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveJourney}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Journey
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Preferences Sidebar */}
          <div className="lg:col-span-1">
            <Card className="border border-white/10 shadow-xl bg-white/5 backdrop-blur-xl sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-slate-100">
                  <Heart className="h-5 w-5 text-rose-400" />
                  Your Soul Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-purple-200 mb-2">Soul Archetype</h4>
                  <p className="text-sm text-slate-300">{getUserPreferencesDescription().archetype}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-purple-200 mb-2">Current Energy</h4>
                  <p className="text-sm text-slate-300">{getUserPreferencesDescription().mood}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-purple-200 mb-2">Journey Style</h4>
                  <p className="text-sm text-slate-300 capitalize">{String(getUserPreferencesDescription().philosophy)}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-purple-200 mb-2">Intention</h4>
                  <p className="text-sm text-slate-300 capitalize">{getUserPreferencesDescription().intention}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-purple-200 mb-2">Interests</h4>
                  <p className="text-sm text-slate-300">
                    {Array.isArray(soulProfile.destinations) ? soulProfile.destinations.join(", ") : "Various experiences"}
                  </p>
                </div>
                <div className="pt-4 border-t border-white/10">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-400 mb-1">$Budget TBD</div>
                    <p className="text-xs text-slate-400">Total Journey Budget</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 bg-white/5 backdrop-blur-xl border border-white/10">
                <TabsTrigger value="journey" className="data-[state=active]:bg-purple-600 text-slate-200">
                  <List className="h-4 w-4 mr-2" />
                  Journey Description
                </TabsTrigger>
                <TabsTrigger value="map" className="data-[state=active]:bg-purple-600 text-slate-200">
                  <Map className="h-4 w-4 mr-2" />
                  Map Structure
                </TabsTrigger>
              </TabsList>

              <TabsContent value="journey" className="space-y-6">
                {/* Daily Journey */}
                {journeyData.dailyItinerary?.map((day: Day) => (
                  <Card
                    key={day.day}
                    className={`border border-white/10 shadow-xl bg-white/5 backdrop-blur-xl transition-all duration-300 ${
                      selectedDay === day.day ? "ring-2 ring-purple-400" : ""
                    }`}
                  >
                    <CardHeader className="cursor-pointer" onClick={() => handleDaySelect(day.day)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                            {day.day}
                          </div>
                          <div>
                            <CardTitle className="text-xl text-slate-100">
                              Day {day.day} - {day.theme}
                            </CardTitle>
                            <p className="text-slate-300 text-sm">Day {day.day}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="border-purple-300 text-purple-200 bg-purple-900/20">
                          <Sparkles className="h-3 w-3 mr-1" />
                          {day.theme}
                        </Badge>
                      </div>
                    </CardHeader>

                    {selectedDay === day.day && (
                      <CardContent className="space-y-6">
                        {/* Activities */}
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2 text-slate-200">
                            <Navigation className="h-4 w-4" />
                            Sacred Activities
                          </h4>
                          <div className="grid md:grid-cols-2 gap-4">
                            {day.activities.map((activity: Activity, index: number) => (
                              <div
                                key={index}
                                className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors backdrop-blur-sm"
                              >
                                <div className="flex items-start gap-3">
                                  <span className="text-2xl">{activity.emoji}</span>
                                  <div className="flex-1">
                                    <h5 className="font-semibold text-slate-100">{activity.name}</h5>
                                    <p className="text-sm text-slate-300 mt-2">{activity.description}</p>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-300">
                                      <span className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {activity.address}
                                      </span>
                                    </div>
                                    <div className="flex gap-2 mt-3">
                                      <Button
                                        size="sm"
                                        variant={
                                          completedActivities.has(`${day.day - 1}-${index}`) ? "default" : "outline"
                                        }
                                        onClick={() => handleActivityComplete(day.day - 1, index)}
                                        className={
                                          completedActivities.has(`${day.day - 1}-${index}`)
                                            ? "h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                            : "h-7 text-xs border-emerald-400/30 text-emerald-300 hover:bg-emerald-400/10 bg-white/5"
                                        }
                                      >
                                        <Check className="h-3 w-3 mr-1" />
                                        {completedActivities.has(`${day.day - 1}-${index}`)
                                          ? "Completed"
                                          : "Mark Complete"}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <Separator className="bg-white/10" />

                        {/* Restaurants */}
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2 text-slate-200">
                            <Star className="h-4 w-4" />
                            Nourishment for the Soul
                          </h4>
                          <div className="grid md:grid-cols-2 gap-4">
                            {day.restaurants.map((restaurant: Restaurant, index: number) => (
                              <div
                                key={index}
                                className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors backdrop-blur-sm"
                              >
                                <div className="flex items-start gap-3">
                                  <span className="text-2xl">{restaurant.emoji}</span>
                                  <div className="flex-1">
                                    <h5 className="font-semibold text-slate-100">{restaurant.name}</h5>
                                    <p className="text-sm text-slate-300">{restaurant.description}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                      <span className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        <span className="text-sm text-slate-300">{restaurant.address}</span>
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}

                {/* Global Journey Modification */}
                <Card className="border border-white/10 shadow-xl bg-white/5 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-100">
                      <Edit3 className="h-5 w-5 text-amber-400" />
                      Modify Your Sacred Journey
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-slate-300 text-sm">
                      Describe any changes you&#39;d like to make to your entire journey. The cosmic forces will adapt your
                      plan accordingly.
                    </p>
                    <textarea
                      placeholder="Share your desires for journey modifications... (e.g., 'Add more cultural experiences', 'Include wellness activities', 'Reduce budget by focusing on free attractions')"
                      value={globalChangePrompt}
                      onChange={(e) => setGlobalChangePrompt(e.target.value)}
                      className="w-full p-4 rounded-lg bg-white/5 border border-white/20 text-slate-100 placeholder-slate-400 focus:border-purple-400 focus:outline-none resize-none backdrop-blur-sm"
                      rows={4}
                    />
                    <div className="flex gap-3">
                      <Button
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        disabled={!globalChangePrompt.trim()}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Apply Changes
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setGlobalChangePrompt("")}
                        className="border-white/20 text-slate-200 hover:bg-white/10 bg-white/5"
                      >
                        Clear
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="map" className="space-y-6">
                {/* 2D Prototype Map */}
                <Card className="border border-white/10 shadow-xl bg-white/5 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-100">
                      <Map className="h-5 w-5 text-blue-400" />
                      Journey Map Structure
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full h-96 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-white/10 relative overflow-hidden">
                      {/* 2D Map Grid */}
                      <div className="absolute inset-0 opacity-20">
                        {Array.from({ length: 20 }).map((_, i) => (
                          <div
                            key={`h-${i}`}
                            className="absolute w-full h-px bg-slate-600"
                            style={{ top: `${i * 5}%` }}
                          />
                        ))}
                        {Array.from({ length: 20 }).map((_, i) => (
                          <div
                            key={`v-${i}`}
                            className="absolute h-full w-px bg-slate-600"
                            style={{ left: `${i * 5}%` }}
                          />
                        ))}
                      </div>

                      {/* Roads/Paths */}
                      <svg className="absolute inset-0 w-full h-full">
                        <path
                          d="M 50 50 Q 150 100 250 150 T 450 200 Q 500 250 400 300"
                          stroke="rgba(147, 51, 234, 0.6)"
                          strokeWidth="3"
                          fill="none"
                          strokeDasharray="5,5"
                        />
                      </svg>

                      {/* Location Pins with Day Numbers */}
                      {journeyData.dailyItinerary?.map((day: Day, index: number) => (
                        <div
                          key={day.day}
                          className="absolute group cursor-pointer"
                          style={{
                            left: `${15 + index * 12}%`,
                            top: `${20 + (index % 4) * 15}%`,
                          }}
                        >
                          <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg hover:scale-110 transition-transform border-2 border-white/30">
                            {day.day}
                          </div>
                          <div className="absolute top-12 left-1/2 transform -translate-x-1/2 bg-slate-900/90 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity border border-white/20">
                            {day.theme}
                          </div>
                        </div>
                      ))}

                      {/* Destination Label */}
                      <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/20">
                        <h3 className="text-white font-semibold">{journeyData.destination}</h3>
                        <p className="text-slate-300 text-xs">{journeyData.dailyItinerary?.length || 0} Day Journey</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Journey Completion */}
        <Card className="mt-8 border border-white/10 shadow-2xl bg-white/5 backdrop-blur-xl">
          <CardContent className="text-center py-8">
            <div className="mb-6">
              <Sparkles className="h-12 w-12 text-amber-400 mx-auto mb-4 animate-pulse" />
              <h3 className="text-2xl font-semibold mb-2 text-slate-100">Your Sacred Journey Awaits</h3>
              <p className="text-slate-300 max-w-2xl mx-auto">
                The universe has woven a tapestry of experiences perfectly aligned with your soul&#39;s calling. Are you
                ready to embark on this transformative adventure?
              </p>
            </div>
            <div className="flex justify-center gap-4">
              <Button
                size="lg"
                onClick={handleSaveJourney}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8"
              >
                <Heart className="mr-2 h-5 w-5" />
                Save & Share Journey
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white/20 text-slate-200 hover:bg-white/10 bg-white/5"
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share with Soul Tribe
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
