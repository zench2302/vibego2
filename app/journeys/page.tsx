"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../context/auth-context';
import { getDbClient } from '@/lib/firebase';
import { collection, query, getDocs, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dna, Calendar, MapPin, ArrowLeft, Plus, Eye, Trash2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import type { Day, Activity, Restaurant, SoulProfile } from '@/lib/types';

type JourneyData = {
  soulProfile?: SoulProfile;
  destination?: string;
  tripTitle?: string;
  createdAt?: { seconds?: number };
  dailyItinerary?: Day[];
  completedItems?: string[];
  id?: string;
};

// Country to flag emoji mapping
const getCountryFlag = (destination: string): string => {
  const countryFlags: { [key: string]: string } = {
    // Europe
    'france': '🇫🇷',
    'paris': '🇫🇷',
    'italy': '🇮🇹',
    'florence': '🇮🇹',
    'rome': '🇮🇹',
    'venice': '🇮🇹',
    'milan': '🇮🇹',
    'spain': '🇪🇸',
    'madrid': '🇪🇸',
    'barcelona': '🇪🇸',
    'seville': '🇪🇸',
    'germany': '🇩🇪',
    'berlin': '🇩🇪',
    'munich': '🇩🇪',
    'cologne': '🇩🇪',
    'uk': '🇬🇧',
    'england': '🇬🇧',
    'london': '🇬🇧',
    'scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    'edinburgh': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    'netherlands': '🇳🇱',
    'amsterdam': '🇳🇱',
    'portugal': '🇵🇹',
    'lisbon': '🇵🇹',
    'porto': '🇵🇹',
    'greece': '🇬🇷',
    'athens': '🇬🇷',
    'santorini': '🇬🇷',
    'norway': '🇳🇴',
    'oslo': '🇳🇴',
    'bergen': '🇳🇴',
    'sweden': '🇸🇪',
    'stockholm': '🇸🇪',
    'denmark': '🇩🇰',
    'copenhagen': '🇩🇰',
    'switzerland': '🇨🇭',
    'zurich': '🇨🇭',
    'geneva': '🇨🇭',
    'austria': '🇦🇹',
    'vienna': '🇦🇹',
    'salzburg': '🇦🇹',
    
    // Asia
    'japan': '🇯🇵',
    'tokyo': '🇯🇵',
    'kyoto': '🇯🇵',
    'osaka': '🇯🇵',
    'china': '🇨🇳',
    'beijing': '🇨🇳',
    'shanghai': '🇨🇳',
    'thailand': '🇹🇭',
    'bangkok': '🇹🇭',
    'india': '🇮🇳',
    'delhi': '🇮🇳',
    'mumbai': '🇮🇳',
    'singapore': '🇸🇬',
    'south korea': '🇰🇷',
    'seoul': '🇰🇷',
    'busan': '🇰🇷',
    
    // Americas
    'usa': '🇺🇸',
    'united states': '🇺🇸',
    'new york': '🇺🇸',
    'los angeles': '🇺🇸',
    'san francisco': '🇺🇸',
    'chicago': '🇺🇸',
    'miami': '🇺🇸',
    'las vegas': '🇺🇸',
    'canada': '🇨🇦',
    'toronto': '🇨🇦',
    'vancouver': '🇨🇦',
    'montreal': '🇨🇦',
    'mexico': '🇲🇽',
    'mexico city': '🇲🇽',
    'cancun': '🇲🇽',
    'brazil': '🇧🇷',
    'rio de janeiro': '🇧🇷',
    'sao paulo': '🇧🇷',
    'argentina': '🇦🇷',
    'buenos aires': '🇦🇷',
    
    // Africa & Middle East
    'egypt': '🇪🇬',
    'cairo': '🇪🇬',
    'south africa': '🇿🇦',
    'cape town': '🇿🇦',
    'morocco': '🇲🇦',
    'marrakech': '🇲🇦',
    'uae': '🇦🇪',
    'dubai': '🇦🇪',
    'abu dhabi': '🇦🇪',
    
    // Oceania
    'australia': '🇦🇺',
    'sydney': '🇦🇺',
    'melbourne': '🇦🇺',
    'new zealand': '🇳🇿',
    'auckland': '🇳🇿',
  };

  const destination_lower = destination.toLowerCase();
  for (const [key, flag] of Object.entries(countryFlags)) {
    if (destination_lower.includes(key)) {
      return flag;
    }
  }
  return '🌍'; // Default world emoji
};

// Generate journey summary based on archetype and itinerary
const generateJourneySummary = (journey: unknown): string => {
  // 类型守卫
  const hasSoulProfile = typeof journey === 'object' && journey !== null && 'soulProfile' in journey;
  const soulProfile = hasSoulProfile ? (journey as JourneyData).soulProfile : undefined;
  const archetype = soulProfile?.archetype?.name?.toLowerCase?.() || '';

  const destination = (typeof journey === 'object' && journey !== null && 'destination' in journey)
    ? (journey as JourneyData).destination || ''
    : '';

  const dailyItinerary = (typeof journey === 'object' && journey !== null && 'dailyItinerary' in journey)
    ? (journey as JourneyData).dailyItinerary || []
    : [];

  const days = dailyItinerary.length || 0;
  const totalActivities = dailyItinerary.reduce(
    (total: number, day: Day) =>
      total + (Array.isArray(day.activities) ? (day.activities as Activity[]).length : 0) +
      (Array.isArray(day.restaurants) ? (day.restaurants as Restaurant[]).length : 0),
    0
  );

  // Get some sample activities for context
  const sampleActivities = dailyItinerary
    .slice(0, 2)
    .flatMap((day: Day) => Array.isArray(day.activities) ? (day.activities as Activity[]).slice(0, 2) : [])
    .map((activity: Activity) => activity?.name)
    .filter(Boolean) || [];

  // Archetype-based summary templates
  const summaryTemplates: { [key: string]: string[] } = {
    'explorer': [
      `An adventurous ${days}-day exploration of ${destination} with ${totalActivities} unique experiences`,
      `Discover hidden gems and off-the-beaten-path adventures in ${destination}`,
      `A thrilling journey through ${destination}'s most exciting locations`
    ],
    'seeker': [
      `A spiritual ${days}-day journey of self-discovery in ${destination}`,
      `Find inner peace and enlightenment through ${destination}'s sacred spaces`,
      `A transformative experience combining mindfulness with ${destination}'s beauty`
    ],
    'artist': [
      `An inspiring ${days}-day creative retreat in ${destination}`,
      `Immerse yourself in ${destination}'s art, culture, and creative energy`,
      `A journey through ${destination}'s most beautiful and artistic locations`
    ],
    'historian': [
      `A fascinating ${days}-day historical journey through ${destination}`,
      `Explore ${destination}'s rich heritage and ancient stories`,
      `Uncover the historical treasures and cultural legacy of ${destination}`
    ],
    'foodie': [
      `A delicious ${days}-day culinary adventure in ${destination}`,
      `Savor the authentic flavors and local cuisine of ${destination}`,
      `A gastronomic journey through ${destination}'s best dining experiences`
    ],
    'nature lover': [
      `A serene ${days}-day nature escape in ${destination}`,
      `Connect with ${destination}'s natural beauty and outdoor wonders`,
      `An eco-friendly journey through ${destination}'s pristine landscapes`
    ],
    'luxury': [
      `An elegant ${days}-day luxury experience in ${destination}`,
      `Indulge in ${destination}'s finest accommodations and premium experiences`,
      `A sophisticated journey through ${destination}'s most exclusive venues`
    ],
    'budget': [
      `A smart ${days}-day budget-friendly adventure in ${destination}`,
      `Experience ${destination}'s best without breaking the bank`,
      `An affordable yet memorable journey through ${destination}`
    ]
  };

  // Find matching archetype or use generic
  let templates = summaryTemplates['explorer']; // default
  for (const [key, value] of Object.entries(summaryTemplates)) {
    if (archetype.includes(key)) {
      templates = value;
      break;
    }
  }

  // Add activity-specific context if available
  if (sampleActivities.length > 0) {
    const activityContext = sampleActivities.slice(0, 2).join(' and ');
    templates.push(`Experience ${activityContext} and ${totalActivities - 2} more curated activities in ${destination}`);
  }

  // Return a random template or the first one
  return templates[Math.floor(Math.random() * templates.length)];
};

// Delete Confirmation Modal Component
interface DeleteConfirmationProps {
  isOpen: boolean;
  journeyTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

const DeleteConfirmation = ({ isOpen, journeyTitle, onConfirm, onCancel, isDeleting }: DeleteConfirmationProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md bg-white border-red-200">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-xl text-gray-900">Delete Journey</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete <span className="font-semibold">&quot;{journeyTitle}&quot;</span>?
          </p>
          <p className="text-sm text-red-600">
            This action cannot be undone.
          </p>
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isDeleting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default function MyJourneys() {
  const { user, loading: authLoading } = useAuth();
  const [journeys, setJourneys] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    journeyId: string;
    journeyTitle: string;
  }>({
    isOpen: false,
    journeyId: '',
    journeyTitle: '',
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/');
      return;
    }

    const fetchJourneys = async () => {
      try {
        const db = await getDbClient();
        const q = query(collection(db, "users", user.uid, "journeys"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const journeysData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setJourneys(journeysData);
      } catch (error) {
        console.error("Error fetching journeys: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJourneys();
  }, [user, authLoading, router]);

  const handleDeleteClick = (journeyId: string, journeyTitle: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    setDeleteModal({
      isOpen: true,
      journeyId,
      journeyTitle,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!user || !deleteModal.journeyId) return;

    setIsDeleting(true);
    try {
      const db = await getDbClient();
      await deleteDoc(doc(db, "users", user.uid, "journeys", deleteModal.journeyId));
      
      // Remove from local state
      setJourneys(prev => prev.filter(journey => (journey as JourneyData).id !== deleteModal.journeyId));
      
      // Close modal
      setDeleteModal({ isOpen: false, journeyId: '', journeyTitle: '' });
    } catch (error) {
      console.error("Error deleting journey: ", error);
      // You could add a toast notification here for error handling
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, journeyId: '', journeyTitle: '' });
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-300"></div>
      </div>
    );
  }

  return (
    <>
      <DeleteConfirmation
        isOpen={deleteModal.isOpen}
        journeyTitle={deleteModal.journeyTitle}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isDeleting={isDeleting}
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
        {/* Header */}
        <div className="bg-black/20 backdrop-blur-sm border-b border-white/10 p-4">
          <div className="container mx-auto max-w-4xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" className="text-purple-300 hover:text-white hover:bg-white/10">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              </Link>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">My Saved Journeys</h1>
            </div>
            <Link href="/">
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <Plus className="mr-2 h-4 w-4" />
                New Journey
              </Button>
            </Link>
          </div>
        </div>

        <div className="container mx-auto max-w-4xl p-4 sm:p-8">
          {journeys.length === 0 ? (
            <Card className="text-center p-8 bg-white/10 border-white/20">
              <CardContent className="py-12">
                <div className="mb-6">
                  <MapPin className="h-16 w-16 text-purple-400 mx-auto mb-4 opacity-50" />
                  <CardTitle className="text-white text-xl mb-2">No Saved Journeys Yet</CardTitle>
                  <p className="text-purple-300">Your mystical adventures await! Create your first journey to get started.</p>
                </div>
                <Link href="/">
                  <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Journey
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {journeys.map(journey => {
                const hasSoulProfile = typeof journey === 'object' && journey !== null && 'soulProfile' in journey;
                const j = journey as JourneyData;
                const soulProfile = hasSoulProfile ? j.soulProfile : undefined;
                const archetypeName = soulProfile?.archetype?.name || 'Traveler';
                const archetypeEmoji = soulProfile?.archetype?.emoji;
                const destination = j.destination || '';
                const tripTitle = j.tripTitle || '';
                const createdAt = j.createdAt;
                const dailyItinerary = j.dailyItinerary || [];
                const completedItems = j.completedItems || [];

                return (
                  <Card 
                    key={j.id}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 transition-all duration-300 cursor-pointer group"
                    onClick={() => router.push(`/journeys/${j.id}`)}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="text-4xl">{getCountryFlag(destination || '')}</span>
                          <div>
                            <CardTitle className="text-xl sm:text-2xl group-hover:text-purple-300 transition-colors">
                              {tripTitle}
                            </CardTitle>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm mt-2">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" /> 
                                {destination}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" /> 
                                {createdAt?.seconds ? new Date(createdAt.seconds * 1000).toLocaleDateString() : 'Unknown date'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Dna className="h-4 w-4" /> 
                                {archetypeName}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-purple-300 hover:text-white hover:bg-white/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/journeys/${j.id}`);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-300 hover:text-red-200 hover:bg-red-500/20"
                            onClick={(e) => handleDeleteClick(j.id || '', tripTitle, e)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-purple-100 text-sm sm:text-base mb-4">
                        {generateJourneySummary(journey)}
                      </p>
                      {/* Progress Bar */}
                      {Array.isArray(dailyItinerary) && dailyItinerary.length > 0 && (
                        <div className="mb-4">
                          {(() => {
                            const totalItems = dailyItinerary.reduce((total: number, day: Day) => 
                              total + (Array.isArray(day.activities) ? (day.activities as Activity[]).length : 0) + (Array.isArray(day.restaurants) ? (day.restaurants as Restaurant[]).length : 0), 0);
                            const completed = Array.isArray(completedItems) ? completedItems.length : 0;
                            const percentage = totalItems > 0 ? Math.round((completed / totalItems) * 100) : 0;
                            return (
                              <div className="space-y-2">
                                <div className="flex justify-between items-center text-xs text-purple-200">
                                  <span>Journey Progress</span>
                                  <span>{percentage}% Complete</span>
                                </div>
                                <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500 ease-out rounded-full"
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                                <div className="text-xs text-purple-300">
                                  {completed} of {totalItems} activities completed
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                      {Array.isArray(dailyItinerary) && dailyItinerary.length > 0 && (
                        <div className="flex items-center gap-4 text-sm text-slate-300">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {dailyItinerary.length} days
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {dailyItinerary.reduce((total: number, day: Day) => total + (Array.isArray(day.activities) ? (day.activities as Activity[]).length : 0) + (Array.isArray(day.restaurants) ? (day.restaurants as Restaurant[]).length : 0), 0)} activities
                          </span>
                          {archetypeEmoji && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                {archetypeEmoji} {archetypeName}
                              </span>
                            </>
                          )}
                          {/* Completion Progress */}
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-green-500 flex items-center justify-center">
                              <span className="text-[8px] text-white font-bold">✓</span>
                            </div>
                            {(() => {
                              const totalItems = dailyItinerary.reduce((total: number, day: Day) => 
                                total + (Array.isArray(day.activities) ? (day.activities as Activity[]).length : 0) + (Array.isArray(day.restaurants) ? (day.restaurants as Restaurant[]).length : 0), 0);
                              const completed = Array.isArray(completedItems) ? completedItems.length : 0;
                              const percentage = totalItems > 0 ? Math.round((completed / totalItems) * 100) : 0;
                              return `${percentage}% complete`;
                            })()}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
} 