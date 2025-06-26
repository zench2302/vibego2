"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';
import ItineraryDisplay from '../../components/itinerary-display';

export default function JourneyView() {
  const { user, loading: authLoading } = useAuth();
  const [journey, setJourney] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const router = useRouter();
  const params = useParams();
  const journeyId = params.id as string;

  const handleToggleComplete = async (itemId: string) => {
    const newCompletedItems = new Set(completedItems);
    
    if (newCompletedItems.has(itemId)) {
      newCompletedItems.delete(itemId);
    } else {
      newCompletedItems.add(itemId);
    }
    
    setCompletedItems(newCompletedItems);

    // Save to Firebase
    if (user && journey) {
      try {
        await updateDoc(doc(db, "users", user.uid, "journeys", journeyId), {
          completedItems: Array.from(newCompletedItems),
          lastUpdated: new Date()
        });
      } catch (error) {
        console.error("Error saving completion state: ", error);
      }
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/');
      return;
    }

    const fetchJourney = async () => {
      try {
        const journeyDoc = await getDoc(doc(db, "users", user.uid, "journeys", journeyId));
        if (journeyDoc.exists()) {
          const journeyData = { id: journeyDoc.id, ...journeyDoc.data() } as any;
          setJourney(journeyData);
          
          // Load completion state
          if (journeyData.completedItems) {
            setCompletedItems(new Set(journeyData.completedItems));
          }
        } else {
          setError("Journey not found");
        }
      } catch (error) {
        console.error("Error fetching journey: ", error);
        setError("Failed to load journey");
      } finally {
        setLoading(false);
      }
    };

    fetchJourney();
  }, [user, authLoading, router, journeyId]);

  const handleCreateNew = () => {
    router.push('/');
  };

  const handleBack = () => {
    router.push('/journeys');
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardContent className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-6"></div>
            <h3 className="text-xl font-semibold mb-2">Loading Your Saved Journey</h3>
            <p className="text-gray-600">Retrieving your mystical adventure...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !journey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center border-0 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-red-600">Journey Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-6">{error || "The requested journey could not be found."}</p>
            <div className="flex gap-2">
              <Link href="/journeys" className="flex-1">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Journeys
                </Button>
              </Link>
              <Link href="/" className="flex-1">
                <Button className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  New Journey
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
      {/* Navigation Bar */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="container mx-auto max-w-6xl px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/journeys">
                <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  My Journeys
                </Button>
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Saved Journey</h1>
            </div>
            <Link href="/">
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <Plus className="mr-2 h-4 w-4" />
                New Journey
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl p-4">
        <ItineraryDisplay
          soulProfile={journey.soulProfile || {
            archetype: { name: 'Traveler', emoji: '🧭' },
            practical: {
              budget: 'Unknown',
              companions: 'Solo'
            }
          }}
          completedItems={completedItems}
          onToggleComplete={handleToggleComplete}
          onCreateNew={handleCreateNew}
          onBack={handleBack}
          existingItinerary={journey} // Pass the saved journey data directly
        />
      </div>
    </div>
  );
} 