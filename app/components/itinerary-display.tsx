"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import JourneyMapView from "./journey-map-view"
import {
  Star,
  Utensils,
  Sparkles,
  Share2,
  Heart,
  Navigation,
  Calendar,
  DollarSign,
  Users,
  LayoutList,
  MapPin,
  CheckCircle2,
  ArrowLeft,
  Plus,
  CheckCircle,
  X,
  AlertCircle,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DAY_COLOR_SCHEMES } from "./constants"
import { useAuth } from "../context/auth-context"
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"

interface ItineraryDisplayProps {
  soulProfile: any;
  completedItems: Set<string>;
  onToggleComplete: (itemId: string) => void;
  onCreateNew?: () => void;
  onBack?: () => void;
  existingItinerary?: any; // For saved journeys
}

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  isVisible: boolean;
  onClose: () => void;
}

const Toast = ({ message, type, isVisible, onClose }: ToastProps) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500 text-white border-green-600';
      case 'error':
        return 'bg-red-500 text-white border-red-600';
      case 'info':
        return 'bg-blue-500 text-white border-blue-600';
      default:
        return 'bg-gray-500 text-white border-gray-600';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <AlertCircle className="w-5 h-5" />;
      case 'info':
        return <Star className="w-5 h-5" />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
      <div className={`${getToastStyles()} px-6 py-4 rounded-lg shadow-lg border-2 backdrop-blur-sm max-w-sm`}>
        <div className="flex items-center gap-3">
          {getIcon()}
          <span className="font-medium">{message}</span>
          <button
            onClick={onClose}
            className="ml-auto hover:opacity-70 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default function ItineraryDisplay({ 
  soulProfile, 
  completedItems, 
  onToggleComplete, 
  onCreateNew, 
  onBack,
  existingItinerary 
}: ItineraryDisplayProps) {
  const [itinerary, setItinerary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Remove unused state
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  
  // Toast state
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    isVisible: boolean;
  }>({
    message: '',
    type: 'info',
    isVisible: false,
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({
      message,
      type,
      isVisible: true,
    });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  const handleSaveJourney = async () => {
    if (!user || !itinerary) {
      showToast("You must be logged in to save a journey", "error");
      return;
    }

    setIsSaving(true);
    try {
      await addDoc(collection(db, "users", user.uid, "journeys"), {
        ...itinerary,
        soulProfile,
        completedItems: Array.from(completedItems),
        createdAt: serverTimestamp(),
      });
      showToast("Journey saved successfully! ✨", "success");
    } catch (error) {
      console.error("Error saving journey: ", error);
      showToast("Failed to save journey. Please try again.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    // If we have an existing itinerary (saved journey), use it directly
    if (existingItinerary) {
      setItinerary(existingItinerary);
      setLoading(false);
      return;
    }

    // Otherwise, generate a new itinerary from soul profile
    const generateItinerary = async () => {
      if (!soulProfile) return

      setLoading(true)
      setError(null)
      console.log("Sending soul profile to API:", soulProfile)

      try {
        const response = await fetch("/api/generate-itinerary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ soulProfile }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        setItinerary(data)
      } catch (e: any) {
        console.error("Failed to generate itinerary:", e)
        setError(e.message || "An unknown error occurred.")
      } finally {
        setLoading(false)
      }
    }

    generateItinerary()
  }, [soulProfile, existingItinerary])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardContent className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-6"></div>
            <h3 className="text-xl font-semibold mb-2">
              {existingItinerary ? "Loading Your Saved Journey" : "Creating Your Perfect Itinerary"}
            </h3>
            <p className="text-gray-600">
              {existingItinerary 
                ? "Retrieving your mystical adventure..." 
                : "Our AI is analyzing your personality and preferences..."
              }
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-xl bg-white/90 backdrop-blur-sm text-center">
          <CardHeader>
            <CardTitle className="text-2xl text-red-600">Oracle's Vision is Clouded</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">There was an error generating your sacred journey.</p>
            <p className="text-sm text-red-700 bg-red-100 p-3 rounded-md">{error}</p>
            <div className="flex gap-2 mt-6">
              <Button onClick={() => window.location.reload()} className="flex-1">
                Try Again
              </Button>
              {onBack && (
                <Button variant="outline" onClick={onBack} className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!itinerary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-12">
            <p className="text-gray-600 mb-4">No itinerary could be generated. Please try again.</p>
            {onBack && (
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Quiz
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />

      <div className="space-y-6">
        {/* Header Card */}
        <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="text-4xl">{soulProfile.archetype.emoji}</span>
                <div>
                  <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2">
                    {itinerary.tripTitle}
                    {existingItinerary && (
                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                        Saved Journey
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-base sm:text-lg flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {itinerary.dailyItinerary.length} days
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {soulProfile.practical.budget}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {soulProfile.practical.companions}
                    </span>
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="itinerary" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="itinerary" className="flex items-center gap-2">
              <LayoutList className="w-4 h-4" /> 
              Itinerary
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" /> 
              Map View
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="itinerary" className="space-y-8">
            {itinerary.dailyItinerary.map((day: any) => {
              const colorScheme = DAY_COLOR_SCHEMES[(day.day - 1) % DAY_COLOR_SCHEMES.length];
              return (
                <Card 
                  key={day.day} 
                  className={`border-0 shadow-xl ${colorScheme.cardBg} ${colorScheme.cardBorder} ${colorScheme.shadow} overflow-hidden transform transition-all duration-500 hover:scale-[1.01] hover:${colorScheme.glow} group`}
                >
                  {/* Mystical Header with Animated Background */}
                  <CardHeader className={`relative bg-gradient-to-r ${colorScheme.gradient} text-white overflow-hidden`}>
                    {/* Animated Background Pattern */}
                    <div className="absolute inset-0 opacity-20">
                      <div className={`absolute top-2 left-4 w-2 h-2 bg-white rounded-full ${colorScheme.mystical}`}></div>
                      <div className={`absolute top-6 right-8 w-1 h-1 bg-white rounded-full animate-pulse delay-300`}></div>
                      <div className={`absolute bottom-4 left-1/3 w-1.5 h-1.5 bg-white rounded-full animate-ping delay-700`}></div>
                      <div className={`absolute bottom-2 right-1/4 w-1 h-1 bg-white rounded-full ${colorScheme.mystical} delay-500`}></div>
                    </div>
                    
                    <CardTitle className="flex items-center gap-4 relative z-10">
                      <div className={`w-12 h-12 ${colorScheme.circle} rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg transform transition-transform group-hover:scale-110 group-hover:rotate-12`}>
                        {day.day}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl font-bold">Day {day.day}</span>
                          <span className="text-xs bg-white/20 px-2 py-1 rounded-full backdrop-blur-sm">
                            {colorScheme.theme}
                          </span>
                        </div>
                        <p className="text-sm text-white/90 font-medium">{day.theme}</p>
                      </div>
                      
                      {/* Progress Indicator */}
                      <div className="hidden sm:flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-xs text-white/80">Progress</div>
                          <div className="text-sm font-bold">
                            {Math.round(((day.activities.filter((_: any, index: number) => 
                              completedItems.has(`item-${day.day}-${index}`)
                            ).length + day.restaurants.filter((_: any, index: number) => 
                              completedItems.has(`item-${day.day}-${day.activities.length + index}`)
                            ).length) / (day.activities.length + day.restaurants.length)) * 100)}%
                          </div>
                        </div>
                        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                          <Sparkles className="w-5 h-5 text-white animate-spin" />
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="p-6 space-y-8 relative">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-20"></div>
                    
                    {/* Activities Section */}
                    <div className="transform transition-all duration-300 hover:translate-x-1">
                      <h4 className="font-bold mb-4 flex items-center gap-3 text-gray-800">
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${colorScheme.gradient} text-white shadow-md`}>
                          <Navigation className="h-4 w-4" />
                        </div>
                        <span className="text-lg">Quest Activities</span>
                        <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
                        <span className="text-sm text-gray-500">
                          {day.activities.filter((_: any, index: number) => 
                            completedItems.has(`item-${day.day}-${index}`)
                          ).length} / {day.activities.length} completed
                        </span>
                      </h4>
                      
                      {/* Grid Layout for Activities */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {day.activities.map((activity: any, index: number) => {
                           const itemId = `item-${day.day}-${index}`;
                           const isCompleted = completedItems.has(itemId);
                            return (
                             <div 
                               key={itemId} 
                               className={`group/item p-4 border-2 rounded-xl transition-all duration-300 bg-white/70 backdrop-blur-sm relative overflow-hidden
                                 ${isCompleted 
                                   ? 'border-green-300 bg-green-50/70 shadow-green-200/50 ring-2 ring-green-200/30' 
                                   : `border-gray-200 hover:border-${colorScheme.cardBorder.split('-')[1]}-300 hover:shadow-lg`
                                 } 
                                 transform hover:scale-[1.02] hover:-translate-y-1 cursor-pointer`}
                               onClick={() => onToggleComplete(itemId)}
                             >
                               {/* Completion Glow Effect */}
                               {isCompleted && (
                                 <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-emerald-400/10 animate-pulse"></div>
                               )}
                               
                               <div className={`transition-all duration-300 relative z-10 ${isCompleted ? 'opacity-75' : 'opacity-100'}`}>
                                 <div className="flex items-start gap-3">
                                   <div className="relative flex-shrink-0">
                                     <span className={`text-2xl sm:text-3xl block transform transition-transform group-hover/item:scale-110 ${isCompleted ? 'grayscale' : ''}`}>
                                       {activity.emoji}
                                     </span>
                                     {isCompleted && (
                                       <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                                         <CheckCircle2 className="w-3 h-3 text-white" />
                                       </div>
                                     )}
                                   </div>
                                   <div className="flex-1 min-w-0">
                                     <h5 className={`font-bold text-sm sm:text-base mb-2 transition-all ${
                                       isCompleted 
                                         ? 'text-green-700 line-through' 
                                         : 'text-gray-800 group-hover/item:text-gray-900'
                                     }`}>
                                       {activity.name}
                                     </h5>
                                     <p className={`text-xs sm:text-sm leading-relaxed transition-all ${
                                       isCompleted ? 'text-green-600' : 'text-gray-600'
                                     }`}>
                                       {activity.description}
                                     </p>
                                   </div>
                                 </div>
                                </div>
                                
                                {/* Animated Check Button */}
                                <div className="absolute top-3 right-3">
                                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                                    isCompleted 
                                      ? 'bg-green-500 border-green-500 scale-110' 
                                      : 'border-gray-300 hover:border-gray-400 hover:scale-110 bg-white'
                                  }`}>
                                    {isCompleted && <CheckCircle2 className="w-4 h-4 text-white" />}
                                  </div>
                                </div>
                               </div>
                              )
                        })}
                      </div>
                    </div>

                    {/* Mystical Divider */}
                    <div className="flex items-center justify-center py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-12 h-px bg-gradient-to-r ${colorScheme.gradient}`}></div>
                        <Star className={`w-4 h-4 text-gray-400 ${colorScheme.mystical}`} />
                        <div className={`w-12 h-px bg-gradient-to-l ${colorScheme.gradient}`}></div>
                      </div>
                    </div>

                    {/* Dining Section */}
                    <div className="transform transition-all duration-300 hover:translate-x-1">
                      <h4 className="font-bold mb-4 flex items-center gap-3 text-gray-800">
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${colorScheme.gradient} text-white shadow-md`}>
                          <Utensils className="h-4 w-4" />
                        </div>
                        <span className="text-lg">Culinary Discoveries</span>
                        <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
                        <span className="text-sm text-gray-500">
                          {day.restaurants.filter((_: any, index: number) => 
                            completedItems.has(`item-${day.day}-${day.activities.length + index}`)
                          ).length} / {day.restaurants.length} completed
                        </span>
                      </h4>
                      
                      {/* Grid Layout for Restaurants */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {day.restaurants.map((restaurant: any, index: number) => {
                           const activityCount = day.activities.length;
                           const itemId = `item-${day.day}-${activityCount + index}`;
                           const isCompleted = completedItems.has(itemId);
                            return (
                             <div 
                               key={itemId} 
                               className={`group/item p-4 border-2 rounded-xl transition-all duration-300 bg-white/70 backdrop-blur-sm relative overflow-hidden
                                 ${isCompleted 
                                   ? 'border-green-300 bg-green-50/70 shadow-green-200/50 ring-2 ring-green-200/30' 
                                   : `border-gray-200 hover:border-${colorScheme.cardBorder.split('-')[1]}-300 hover:shadow-lg`
                                 } 
                                 transform hover:scale-[1.02] hover:-translate-y-1 cursor-pointer`}
                               onClick={() => onToggleComplete(itemId)}
                             >
                               {/* Completion Glow Effect */}
                               {isCompleted && (
                                 <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-emerald-400/10 animate-pulse"></div>
                               )}
                               
                               <div className={`transition-all duration-300 relative z-10 ${isCompleted ? 'opacity-75' : 'opacity-100'}`}>
                                 <div className="flex items-start gap-3">
                                   <div className="relative flex-shrink-0">
                                     <span className={`text-2xl sm:text-3xl block transform transition-transform group-hover/item:scale-110 ${isCompleted ? 'grayscale' : ''}`}>
                                       {restaurant.emoji}
                                     </span>
                                     {isCompleted && (
                                       <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                                         <CheckCircle2 className="w-3 h-3 text-white" />
                                       </div>
                                     )}
                                   </div>
                                   <div className="flex-1 min-w-0">
                                     <h5 className={`font-bold text-sm sm:text-base mb-2 transition-all ${
                                       isCompleted 
                                         ? 'text-green-700 line-through' 
                                         : 'text-gray-800 group-hover/item:text-gray-900'
                                     }`}>
                                       {restaurant.name}
                                     </h5>
                                     <p className={`text-xs sm:text-sm leading-relaxed transition-all ${
                                       isCompleted ? 'text-green-600' : 'text-gray-600'
                                     }`}>
                                       {restaurant.description}
                                     </p>
                                   </div>
                                 </div>
                                </div>
                                
                                {/* Animated Check Button */}
                                <div className="absolute top-3 right-3">
                                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                                    isCompleted 
                                      ? 'bg-green-500 border-green-500 scale-110' 
                                      : 'border-gray-300 hover:border-gray-400 hover:scale-110 bg-white'
                                  }`}>
                                    {isCompleted && <CheckCircle2 className="w-4 h-4 text-white" />}
                                  </div>
                                </div>
                               </div>
                              )
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </TabsContent>
          
          <TabsContent value="map">
            <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-blue-600" />
                      Journey Map View
                    </CardTitle>
                    <CardDescription>Discover your remaining adventures on the map.</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-1 px-3 py-1 bg-blue-100 rounded-full">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span>Remaining</span>
                    </div>
                    <div className="flex items-center gap-1 px-3 py-1 bg-green-100 rounded-full">
                      <CheckCircle2 className="w-3 h-3 text-green-600" />
                      <span>Completed</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Navigation className="w-4 h-4" />
                    <span className="font-medium">
                      {(() => {
                        const totalItems = itinerary.dailyItinerary.reduce((total: number, day: any) => 
                          total + day.activities.length + day.restaurants.length, 0
                        );
                        const remainingItems = totalItems - completedItems.size;
                        return remainingItems === 0 
                          ? "🎉 All adventures completed! Your journey is complete!"
                          : `${remainingItems} adventure${remainingItems === 1 ? '' : 's'} remaining on your quest`;
                      })()}
                    </span>
                  </div>
                </div>
                <JourneyMapView itinerary={itinerary} completedItems={completedItems} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quote */}
        {itinerary.soulQuote && (
          <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
            <CardContent className="text-center py-8">
              <p className="text-base sm:text-lg italic text-gray-700">&quot;{itinerary.soulQuote}&quot;</p>
            </CardContent>
          </Card>
        )}

        {/* Footer Actions */}
        <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardContent className="text-center py-6 sm:py-8">
            <h3 className="text-lg sm:text-xl font-semibold mb-4">
              {existingItinerary ? "Continue Your Adventure" : "Ready for Your Adventure?"}
            </h3>
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
              {user && !existingItinerary && (
                <Button
                  size="lg"
                  onClick={handleSaveJourney}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                >
                  <Heart className="mr-2 h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Journey"}
                </Button>
              )}
              <Button variant="outline" size="lg">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
            
            {/* Navigation Actions */}
            <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3 mt-6 pt-6 border-t border-gray-200">
              {onCreateNew && (
                <Button
                  variant="outline"
                  onClick={onCreateNew}
                  className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Journey
                </Button>
              )}
              {onBack && (
                <Button
                  variant="outline"
                  onClick={onBack}
                  className="hover:bg-gray-50 hover:border-gray-300"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {existingItinerary ? "Back to My Journeys" : "Back to Quiz"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
