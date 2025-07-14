"use client"

import { useState, useEffect, useRef } from "react"
import PreDepartureOracle from "./components/pre-departure-oracle"
import ItineraryDisplay from "./components/itinerary-display"
import SharingRealm from "./components/sharing-realm"
import { useAuth } from "./context/auth-context"
import AuthScreen from "./components/auth-screen"
import Header from "./components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, Compass, Star, Map, ArrowRight, ArrowLeft, Plus } from "lucide-react"
import type { Itinerary, SoulProfile } from "@/lib/types"

type AppState = "intro" | "auth" | "oracle" | "journey" | "sharing"

const defaultSoulProfile: SoulProfile = {
  archetype: { name: 'Traveler', emoji: '🧭' },
  mood: 'curious',
  intention: 'discover',
  practical: {
    budget: 'Unknown',
    companions: 'Solo',
    destination: 'Unknown',
    startDate: '',
    endDate: ''
  }
};

const defaultItinerary: Itinerary = {
  destination: 'Unknown',
  tripTitle: 'Untitled Journey',
  dailyItinerary: [],
};

export default function MysticalTripOracle() {
  const { user, loading } = useAuth();
  const prevUserRef = useRef(user);
  
  // App-specific state
  const [currentState, setCurrentState] = useState<AppState>("intro")
  const [soulProfile, setSoulProfile] = useState<SoulProfile | null>(null)
  const [journeyBlueprint, setJourneyBlueprint] = useState<Itinerary | null>(null)
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set())

  // Auto-transition to oracle when user logs in
  useEffect(() => {
    if (user && (currentState === "intro" || currentState === "auth")) {
      setCurrentState("oracle")
    }
  }, [user, currentState])

  useEffect(() => {
    if (
      !loading &&
      prevUserRef.current &&
      user === null &&
      currentState !== "auth"
    ) {
      setCurrentState("auth");
      setSoulProfile(null);
      setJourneyBlueprint(null);
      setCompletedItems(new Set());
    }
    prevUserRef.current = user;
  }, [user, loading, currentState]);

  const handleToggleComplete = (itemId: string) => {
    setCompletedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  const handleOracleComplete = (profile: SoulProfile) => {
    console.log('handleOracleComplete called with:', profile);
    setSoulProfile(profile)
    setCurrentState("journey")
  }


  const handleCreateNewJourney = () => {
    setSoulProfile(null)
    setJourneyBlueprint(null)
    setCompletedItems(new Set())
    setCurrentState("oracle")
  }

  const handleBackToOracle = () => {
    setCurrentState("oracle")
  }
  
  const renderContent = () => {
    if (loading) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-300"></div>
        </div>
      );
    }

    // If user is not authenticated, show intro or auth
    if (!user) {
      if (currentState === "intro") {
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-20 left-10 animate-pulse">
                <Star className="h-6 w-6 text-amber-300 opacity-70" />
              </div>
              <div className="absolute top-40 right-20 animate-bounce">
                <Sparkles className="h-8 w-8 text-blue-300 opacity-60" />
              </div>
              <div className="absolute bottom-32 left-1/4 animate-pulse">
                <Compass className="h-5 w-5 text-orange-300 opacity-50" />
              </div>
              <div className="absolute top-1/3 right-1/3 animate-ping">
                <div className="h-2 w-2 bg-pink-400 rounded-full opacity-40"></div>
              </div>
            </div>

            <div className="relative z-10 container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
              <Card className="w-full max-w-2xl border border-white/10 shadow-2xl bg-white/5 backdrop-blur-xl text-center">
                <CardHeader className="pb-6">
                  <div className="flex items-center justify-center mb-6">
                    <div className="relative">
                      <Map className="h-16 w-16 text-purple-400 animate-pulse" />
                      <Sparkles className="h-8 w-8 text-amber-400 absolute -top-2 -right-2 animate-spin" />
                    </div>
                  </div>
                  <CardTitle className="text-4xl font-bold bg-gradient-to-r from-amber-300 via-purple-300 to-blue-300 bg-clip-text text-transparent mb-4">
                    Welcome to Vibego
                  </CardTitle>
                  <CardDescription className="text-lg text-slate-300">
                    Your mystical journey planner that understands your soul
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4 text-slate-200">
                    <p className="text-lg">
                      Discover personalized travel experiences crafted by our AI oracle, 
                      tailored to your unique personality and desires.
                    </p>
                    <div className="grid md:grid-cols-3 gap-4 mt-8">
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <Star className="h-8 w-8 text-amber-400 mx-auto mb-2" />
                        <h3 className="font-semibold text-white">Personality Quiz</h3>
                        <p className="text-sm text-slate-300">Discover your travel archetype</p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <Compass className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                        <h3 className="font-semibold text-white">AI Planning</h3>
                        <p className="text-sm text-slate-300">Personalized itineraries</p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <Map className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                        <h3 className="font-semibold text-white">Save & Share</h3>
                        <p className="text-sm text-slate-300">Keep your journeys forever</p>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => setCurrentState("oracle")}
                    size="lg"
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Begin Your Journey
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )
      }
      if (currentState === "oracle") {
        return <PreDepartureOracle onComplete={handleOracleComplete} onBack={handleCreateNewJourney} />
      }
      return <AuthScreen onBack={() => setCurrentState("intro")} />
    }

    // User is authenticated - show app content
    if (currentState === "oracle") {
      return <PreDepartureOracle onComplete={handleOracleComplete} onBack={handleCreateNewJourney} />
    }
  
    if (currentState === "journey") {
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
          {/* Navigation Bar */}
          <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
            <div className="container mx-auto max-w-6xl px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" onClick={handleBackToOracle} className="text-gray-600 hover:text-gray-900">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Quiz
                  </Button>
                  <h1 className="text-xl font-semibold text-gray-900">Your Journey</h1>
                </div>
                <Button onClick={handleCreateNewJourney} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  <Plus className="mr-2 h-4 w-4" />
                  New Journey
                </Button>
              </div>
            </div>
          </div>

          <div className="container mx-auto max-w-6xl p-4">
            <ItineraryDisplay 
              soulProfile={soulProfile || defaultSoulProfile} 
              existingItinerary={journeyBlueprint || defaultItinerary}
              completedItems={completedItems} 
              onToggleComplete={handleToggleComplete}
            />
          </div>
        </div>
      )
    }
  
    if (currentState === "sharing") {
      return (
        <SharingRealm 
          journeyBlueprint={journeyBlueprint || defaultItinerary} 
          soulProfile={soulProfile || defaultSoulProfile}
          onCreateNew={handleCreateNewJourney}
        />
      )
    }

    // Fallback - if somehow we get here, show the oracle
    return <PreDepartureOracle onComplete={handleOracleComplete} onBack={handleCreateNewJourney} />
  }

  return (
    <div className="flex flex-col min-h-screen">
      {user && <Header user={user} />}
      <main className="flex-grow">
        {renderContent()}
      </main>
    </div>
  )
}
