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
  LayoutList,
  MapPin,
  CheckCircle2,
  ArrowLeft,
  Plus,
  CheckCircle,
  X,
  AlertCircle,
  User,
  Users,
  Download,
  Printer,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DAY_COLOR_SCHEMES } from "./constants"
import { useAuth } from "../context/auth-context"
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { QRCodeSVG } from 'qrcode.react'
import type { Itinerary, SoulProfile, Activity, Restaurant, Day } from "@/lib/types"

interface ItineraryDisplayProps {
  soulProfile: SoulProfile;
  completedItems: Set<string>;
  onToggleComplete: (itemId: string) => void;
  onCreateNew?: () => void;
  onBack?: () => void;
  existingItinerary?: Itinerary; // For saved journeys
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

// Helper: Simple calendar grid for a month
function CalendarPanel({ selectedDate, onSelect }: { selectedDate: Date; onSelect: (date: Date) => void }) {
  const [viewDate, setViewDate] = useState(new Date(selectedDate));
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (Date | null)[] = Array(firstDay).fill(null).concat(
    Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1))
  );
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center justify-between w-full mb-2">
        <button onClick={() => setViewDate(new Date(year, month - 1, 1))} className="px-2 text-gray-400 hover:text-purple-600">&#8592;</button>
        <span className="font-semibold text-gray-700">{viewDate.toLocaleString('default', { month: 'short', year: 'numeric' })}</span>
        <button onClick={() => setViewDate(new Date(year, month + 1, 1))} className="px-2 text-gray-400 hover:text-purple-600">&#8594;</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-xs text-gray-400 mb-1">
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, i) => date ? (
          <button
            key={i}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
              ${date.toDateString() === selectedDate.toDateString() ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white' : 'hover:bg-purple-100 text-gray-700'}`}
            onClick={() => onSelect(date)}
          >
            {date.getDate()}
          </button>
        ) : <div key={i} />)}
      </div>
    </div>
  );
}

export default function ItineraryDisplay({ 
  soulProfile, 
  completedItems, 
  onToggleComplete, 
  onCreateNew, 
  onBack,
  existingItinerary 
}: ItineraryDisplayProps) {
  const [itinerary, setItinerary] = useState<Itinerary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Remove unused state
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<ToastProps>({
    message: '',
    type: 'success',
    isVisible: false,
    onClose: () => setToast(prev => ({ ...prev, isVisible: false })),
  });

  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  // Add state for editing
  const [openPopover, setOpenPopover] = useState<'dates' | 'budget' | 'companions' | null>(null);
  const [tempStartDate, setTempStartDate] = useState(
    soulProfile?.practical?.startDate ? new Date(soulProfile.practical.startDate) : new Date()
  );
  const [tempEndDate, setTempEndDate] = useState(
    soulProfile?.practical?.endDate ? new Date(soulProfile.practical.endDate) : new Date()
  );
  const [tempBudget, setTempBudget] = useState(Number(soulProfile?.practical?.budget) || 0);
  const [tempCompanions, setTempCompanions] = useState(soulProfile?.practical?.companions || 'solo');
  const [displayStartDate, setDisplayStartDate] = useState(tempStartDate);
  const [displayEndDate, setDisplayEndDate] = useState(tempEndDate);
  const [displayBudget, setDisplayBudget] = useState(tempBudget);
  const [displayCompanions, setDisplayCompanions] = useState(tempCompanions);
  const [showQr, setShowQr] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  // 删除 practical 变量
  // const practical = soulProfile && soulProfile.practical ? soulProfile.practical : {};
  // 修改 editForm 初始化
  const [editForm, setEditForm] = useState({
    startDate: soulProfile?.practical?.startDate || '',
    endDate: soulProfile?.practical?.endDate || '',
    budget: Number(String(soulProfile?.practical?.budget ?? '').replace(/[^\d.]/g, '')) || 0,
    companions: soulProfile?.practical?.companions || 'solo',
    destination: soulProfile?.practical?.destination || '',
  });

  // Add at the top of the component (inside ItineraryDisplay)
  const companionOptions: { value: string; label: string; icon: React.ReactNode }[] = [
    { value: 'solo', label: 'Solo Journey', icon: <User className="inline w-5 h-5 mr-1" /> },
    { value: 'partner', label: 'With Partner', icon: <><Users className="inline w-5 h-5 mr-1" /><Heart className="inline w-4 h-4 ml-0.5 text-rose-400" /></> },
    { value: 'friends', label: 'With Friends', icon: <Users className="inline w-5 h-5 mr-1" /> },
    { value: 'family', label: 'With Family', icon: (
      <svg className="inline w-7 h-5 mr-1" viewBox="0 0 28 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* 两个大人 */}
        <circle cx="7" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="17" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
        {/* 小孩 */}
        <circle cx="12" cy="13" r="1.3" stroke="currentColor" strokeWidth="1.2" />
        {/* 大人身体 */}
        <path d="M5 15c0-1.66 1.34-3 3-3s3 1.34 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M15 15c0-1.66 1.34-3 3-3s3 1.34 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        {/* 小孩身体 */}
        <path d="M11 17c0-1 0.9-2 2-2s2 1 2 2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      </svg>
    ) },
  ];

  // 格式化companions显示
  const formatCompanions = (companions: string) => {
    const companionsMap: { [key: string]: string } = {
      'solo': 'Solo Journey',
      'partner': 'With Partner', 
      'friends': 'With Friends',
      'family': 'With Family'
    };
    return companionsMap[companions] || companions;
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({
      message,
      type,
      isVisible: true,
      onClose: () => setToast(prev => ({ ...prev, isVisible: false })),
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
    } catch (error: unknown) {
      console.error("Error saving journey: ", error);
      showToast(`Failed to save journey. ${error instanceof Error ? error.message : "Please try again."}`, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('User Feedback:', feedbackText, 'Email:', feedbackEmail);
    setFeedbackSent(true);
    setTimeout(() => {
      setFeedbackOpen(false);
      setFeedbackSent(false);
      setFeedbackText('');
      setFeedbackEmail('');
    }, 2000);
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
      } catch (e: unknown) {
        console.error("Failed to generate itinerary:", e);
        setError(e instanceof Error ? e.message : "An unknown error occurred.");
      } finally {
        setLoading(false)
      }
    }

    generateItinerary()
  }, [soulProfile, existingItinerary])

  // Add click outside to close for date popover
  useEffect(() => {
    if (openPopover === 'dates' || openPopover === 'budget' || openPopover === 'companions') {
      const handleClick = (e: MouseEvent) => {
        const popover = document.getElementById(`${openPopover}-popover`);
        if (popover && !popover.contains(e.target as Node)) {
          setOpenPopover(null);
        }
      };
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [openPopover]);

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
            <CardTitle className="text-2xl text-red-600">Oracle&#39;s Vision is Clouded</CardTitle>
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

  const p = soulProfile?.practical;
  console.log('practical for check:', p);
  if (
    !p ||
    typeof p.destination !== 'string' || !p.destination.trim() ||
    typeof p.startDate !== 'string' || !p.startDate.trim() ||
    typeof p.endDate !== 'string' || !p.endDate.trim() ||
    (typeof p.budget !== 'number' && typeof p.budget !== 'string') || p.budget === '' || p.budget === null || p.budget === undefined ||
    typeof p.companions !== 'string' || !p.companions.trim()
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-100 p-4">
        <Card className="w-full max-w-md border-0 shadow-xl bg-white/90 backdrop-blur-sm text-center">
          <CardHeader>
            <CardTitle className="text-2xl text-red-600">Missing Required Info</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">Please complete the quiz before generating your itinerary. Don&#39;t forget to check all required fields.</p>
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

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md flex flex-col items-center relative">
            <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-700" onClick={() => setShowEditModal(false)} title="Close">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold mb-4 text-purple-700">Edit Journey Details</h2>
            <form className="w-full space-y-4" onSubmit={async (e) => {
              e.preventDefault();
              setShowEditModal(false);
              // 重新生成 itinerary
              setLoading(true);
              setError(null);
              try {
                const response = await fetch("/api/generate-itinerary", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    soulProfile: {
                      ...soulProfile,
                      practical: {
                        ...soulProfile.practical,
                        ...editForm,
                        budget: Number(editForm.budget),
                      },
                    },
                  }),
                });
                if (!response.ok) {
                  const errorData = await response.json();
                  throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setItinerary(data);
                // 同步 practical 字段
                soulProfile.practical = { ...soulProfile.practical, ...editForm, budget: Number(editForm.budget) };
              } catch (e: unknown) {
                setError(e instanceof Error ? e.message : "An unknown error occurred.");
              } finally {
                setLoading(false);
              }
            }}>
              <div className="flex flex-col gap-2">
                <label className="font-semibold text-gray-700">Start Date</label>
                <input type="date" className="border rounded px-3 py-2" value={editForm.startDate} onChange={e => setEditForm(f => ({ ...f, startDate: e.target.value }))} required />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-semibold text-gray-700">End Date</label>
                <input type="date" className="border rounded px-3 py-2" value={editForm.endDate} onChange={e => setEditForm(f => ({ ...f, endDate: e.target.value }))} required />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-semibold text-gray-700">Budget</label>
                <input type="number" min="0" className="border rounded px-3 py-2" value={editForm.budget} onChange={e => setEditForm(f => ({ ...f, budget: Number(e.target.value) }))} required />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-semibold text-gray-700">Companions</label>
                <select className="border rounded px-3 py-2" value={editForm.companions} onChange={e => setEditForm(f => ({ ...f, companions: e.target.value }))} required>
                  <option value="solo">Solo Journey</option>
                  <option value="partner">With Partner</option>
                  <option value="friends">With Friends</option>
                  <option value="family">With Family</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-semibold text-gray-700">Destination</label>
                <input type="text" className="border rounded px-3 py-2" value={editForm.destination} onChange={e => setEditForm(f => ({ ...f, destination: e.target.value }))} required />
              </div>
              <div className="flex flex-row gap-4 mt-6 justify-end">
                <button type="button" className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 font-semibold" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-bold">Confirm</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Header Card */}
        <Card className="border-0 shadow-2xl bg-gradient-to-br from-purple-800 via-fuchsia-700 to-indigo-900/95 text-white/95 backdrop-blur-xl ring-2 ring-purple-400/30">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="text-4xl">{soulProfile?.archetype?.emoji || '🌟'}</span>
                <div>
                  <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-100 flex items-center gap-2">
                    {itinerary?.tripTitle || 'Your Journey'}
                    {existingItinerary && (
                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                        Saved Journey
                      </Badge>
                    )}
                  </CardTitle>
                  {itinerary?.soulQuote && (
                    <div className="text-center italic text-gray-200 text-base font-medium mt-1">
                      {`"${itinerary.soulQuote}"`}
                    </div>
                  )}
                  <CardDescription className="text-base sm:text-lg flex flex-wrap items-center gap-4 sm:gap-6 mt-2 text-gray-300 relative">
                    {/* Days (not editable) */}
                    <div className="relative flex items-center gap-1 font-semibold">
                      <Calendar className="h-5 w-5" />
                      {(() => {
                        const start = displayStartDate
                        const end = displayEndDate
                        const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
                        return `${diff} days (${start.toLocaleDateString('en-GB')} - ${end.toLocaleDateString('en-GB')})`
                      })()}
                    </div>
                    {/* Budget (not editable) */}
                    <div className="relative flex items-center font-semibold">
                      ${displayBudget}
                    </div>
                    {/* Companions (not editable) */}
                    <div className="relative flex items-center gap-1 font-semibold">
                      <Users className="h-5 w-5" />
                      {formatCompanions(displayCompanions)}
                    </div>
                    {/* Destination (not editable) */}
                    <div className="relative flex items-center gap-1 font-semibold">
                      <MapPin className="h-5 w-5" />
                      {soulProfile.practical.destination}
                    </div>
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Edit 按钮 */}
                <Button
                  onClick={() => setShowEditModal(true)}
                  className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-bold rounded-xl px-5 py-2 shadow-lg hover:from-purple-700 hover:to-fuchsia-700 transition-all flex items-center gap-2 text-base"
                >
                  Edit
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="itinerary" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-white/10 rounded-xl p-1">
            <TabsTrigger value="itinerary" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:shadow-lg data-[state=active]:scale-105 transition-all text-gray-400">
              <LayoutList className="w-4 h-4" /> 
              Itinerary
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:shadow-lg data-[state=active]:scale-105 transition-all text-gray-400">
              <MapPin className="w-4 h-4" /> 
              Map View
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="itinerary" className="space-y-4">
            {itinerary?.dailyItinerary?.map((day: Day) => {
              const colorScheme = DAY_COLOR_SCHEMES[(day.day - 1) % DAY_COLOR_SCHEMES.length];
              return (
                <Card 
                  key={day.day} 
                  className={`border-0 shadow-xl ${colorScheme.cardBg} ${colorScheme.cardBorder} ${colorScheme.shadow} overflow-hidden transform transition-all duration-500 hover:scale-[1.01] hover:${colorScheme.glow} group`}
                >
                  {/* Mystical Header with Animated Background */}
                  <CardHeader className={`bg-gradient-to-r ${colorScheme.gradient} text-white overflow-hidden`}>
                    <CardTitle className="flex items-center gap-4">
                      <div className={`w-12 h-12 ${colorScheme.circle} rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg transform transition-transform`}>
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
                            {Math.round(((day.activities?.filter((_: Activity, index: number) => 
                              completedItems.has(`item-${day.day}-${index}`)
                            ).length + day.restaurants?.filter((_: Restaurant, index: number) => 
                              completedItems.has(`item-${day.day}-${day.activities?.length + index}`)
                            ).length) / (day.activities?.length + day.restaurants?.length)) * 100)}%
                          </div>
                        </div>
                        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                          <Sparkles className="w-5 h-5 text-white animate-spin" />
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="p-4 space-y-4 relative">
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
                          {day.activities?.filter((_: Activity, index: number) => 
                            completedItems.has(`item-${day.day}-${index}`)
                          ).length || 0} / {day.activities?.length || 0} completed
                        </span>
                      </h4>
                      
                      {/* Grid Layout for Activities */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {day.activities?.map((activity: Activity, index: number) => {
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

                    {/* Dining Section */}
                    <div className="transform transition-all duration-300 hover:translate-x-1">
                      <h4 className="font-bold mb-4 flex items-center gap-3 text-gray-800">
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${colorScheme.gradient} text-white shadow-md`}>
                          <Utensils className="h-4 w-4" />
                        </div>
                        <span className="text-lg">Culinary Discoveries</span>
                        <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
                        <span className="text-sm text-gray-500">
                          {day.restaurants?.filter((_: Restaurant, index: number) => 
                            completedItems.has(`item-${day.day}-${day.activities?.length + index}`)
                          ).length || 0} / {day.restaurants?.length || 0} completed
                        </span>
                      </h4>
                      
                      {/* Grid Layout for Restaurants */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {day.restaurants?.map((restaurant: Restaurant, index: number) => {
                           const activityCount = day.activities?.length || 0;
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
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Navigation className="w-4 h-4" />
                    <span className="font-medium">
                      {(() => {
                        const totalItems = itinerary?.dailyItinerary?.reduce((total: number, day: Day) => 
                          total + (day.activities?.length || 0) + (day.restaurants?.length || 0), 0
                        ) || 0;
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

        {/* Footer Actions */}
        <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardContent className="py-4 sm:py-6">
            <h3 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-purple-600 via-fuchsia-500 to-indigo-600 bg-clip-text text-transparent mb-6 text-center">
              Continue Your Adventure
            </h3>
            <div className="flex flex-col lg:flex-row items-stretch lg:items-start gap-8">
              {/* 左侧：主内容区 */}
              <div className="flex-1 flex flex-col items-center justify-center">
                {/* Action Buttons 居中一行，宽度一致，大屏一行，小屏自动换行 */}
                <div className="flex flex-wrap justify-center gap-4 mb-8">
                  {onCreateNew && (
                    <Button
                      className="min-w-[160px] bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-bold rounded-xl px-6 py-3 shadow-lg hover:from-purple-700 hover:to-fuchsia-700 transition-all flex items-center gap-2 text-base"
                      onClick={onCreateNew}
                    >
                      <Plus className="h-5 w-5" />
                      Create New Journey
                    </Button>
                  )}
                  {onBack && (
                    <Button
                      className="min-w-[160px] bg-white border border-gray-300 text-gray-800 font-bold rounded-xl px-6 py-3 shadow hover:bg-gray-100 transition-all flex items-center gap-2 text-base"
                      onClick={onBack}
                      variant="outline"
                    >
                      <ArrowLeft className="h-5 w-5" />
                      {existingItinerary ? "Back to My Journeys" : "Back to Quiz"}
                    </Button>
                  )}
                  <Button
                    className="min-w-[160px] bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl px-6 py-3 shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center gap-2 text-base"
                    onClick={handleSaveJourney}
                    disabled={isSaving}
                  >
                    <CheckCircle className="h-5 w-5" />
                    {isSaving ? 'Saving...' : 'Save Journey'}
                  </Button>
                  <Button
                    className="min-w-[160px] bg-gradient-to-r from-fuchsia-500 to-purple-700 text-white font-bold rounded-xl px-6 py-3 shadow-lg hover:from-fuchsia-600 hover:to-purple-800 transition-all flex items-center gap-2 text-base"
                    onClick={() => setShowQr(true)}
                  >
                    <Share2 className="h-5 w-5" />
                    Show QR Code
                  </Button>
                </div>
                {/* 社交icon单独一行居中，增加与按钮的间距 */}
                <div className="flex flex-row justify-center gap-10 mb-8 flex-wrap">
                  <div className="flex flex-col items-center">
                    <button onClick={() => window.open(`https://www.instagram.com/?url=${encodeURIComponent(window.location.href)}`, '_blank')} title="Share to Instagram" className="focus:outline-none">
                      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <linearGradient id="ig-glyph-gradient" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#f58529"/>
                            <stop offset="50%" stopColor="#dd2a7b"/>
                            <stop offset="100%" stopColor="#515bd4"/>
                          </linearGradient>
                        </defs>
                        <rect x="8" y="8" width="32" height="32" rx="8" stroke="url(#ig-glyph-gradient)" strokeWidth="3" fill="none"/>
                        <circle cx="24" cy="24" r="7" stroke="url(#ig-glyph-gradient)" strokeWidth="3" fill="none"/>
                        <circle cx="32.5" cy="15.5" r="2.5" fill="url(#ig-glyph-gradient)"/>
                      </svg>
                    </button>
                    <span className="mt-2 text-sm text-gray-800 font-medium">Instagram</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(window.location.href)}`, '_blank')} title="Share to WhatsApp" className="focus:outline-none">
                      <svg width="48" height="48" fill="none" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="12" fill="#25D366"/>
                        <path d="M17.13 14.1c-.23-.12-1.36-.67-1.57-.75-.21-.08-.36-.12-.5.12-.15.23-.57.75-.7.9-.13.15-.26.17-.48.06-.23-.12-.97-.36-1.85-1.13-.68-.6-1.14-1.34-1.28-1.56-.13-.23-.01-.35.1-.47.1-.1.23-.26.34-.4.12-.15.15-.25.23-.4.08-.15.04-.3-.02-.42-.06-.12-.5-1.2-.68-1.65-.18-.43-.36-.37-.5-.38-.13-.01-.29-.01-.45-.01-.16 0-.42.06-.64.3-.22.23-.85.83-.85 2.02 0 1.19.87 2.34.99 2.5.12.15 1.7 2.6 4.13 3.54.58.2 1.03.32 1.38.41.58.15 1.1.13 1.51.08.46-.06 1.36-.56 1.55-1.1.19-.54.19-1 .13-1.1-.06-.1-.21-.15-.44-.27Z" fill="#fff"/>
                      </svg>
                    </button>
                    <span className="mt-2 text-sm text-gray-800 font-medium">WhatsApp</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <button onClick={() => window.open(`https://x.com/intent/tweet?url=${encodeURIComponent(window.location.href)}`, '_blank')} title="Share to X" className="focus:outline-none">
                      <svg width="48" height="48" fill="none" viewBox="0 0 24 24">
                        <rect width="24" height="24" rx="6" fill="#000"/>
                        <path d="M17.53 2H21.5l-7.44 8.48L22.5 22h-7.5l-5.9-7.1L2.47 22H2.5l7.97-9.08L1.5 2h7.5l5.36 6.45L17.53 2Zm-1.06 17h2.19L7.62 4H5.31l10.16 15Z" fill="#fff"/>
                      </svg>
                    </button>
                    <span className="mt-2 text-sm text-gray-800 font-medium">X</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <button onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')} title="Share to Facebook" className="focus:outline-none">
                      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="24" cy="24" r="24" fill="#1877F3"/>
                        <path d="M29.5 24H26V36H21V24H18V20H21V17.5C21 15.57 22.57 14 24.5 14H29V18H26.5C26.22 18 26 18.22 26 18.5V20H29.5L29 24Z" fill="white"/>
                      </svg>
                    </button>
                    <span className="mt-2 text-sm text-gray-800 font-medium">Facebook</span>
                  </div>
                </div>
                {/* 二维码单独一行居中 */}
                {showQr && (
                  <div className="flex flex-col items-center mt-8">
                    <QRCodeSVG value={window.location.href} size={120} bgColor="#fff" fgColor="#7c3aed" />
                    <div className="text-xs text-gray-400 mt-2">Scan to view this journey</div>
                  </div>
                )}
              </div>
              {/* 右侧：实用功能区，按钮更紧凑，圆角加大，字体 text-base */}
              <div className="w-full max-w-xs mx-auto lg:mx-0 lg:w-80 bg-white/80 rounded-2xl shadow-lg p-6 flex flex-col gap-6">
                <div className="flex flex-col gap-2 mb-2 w-full">
                  <Button variant="outline" className="rounded-xl py-2 text-base flex items-center gap-2 w-full justify-start" onClick={() => window.print()}><Download className="h-4 w-4" />Download PDF</Button>
                  <Button variant="outline" className="rounded-xl py-2 text-base flex items-center gap-2 w-full justify-start"><Calendar className="h-4 w-4" />Export Calendar</Button>
                  <Button variant="outline" className="rounded-xl py-2 text-base flex items-center gap-2 w-full justify-start" onClick={() => window.print()}><Printer className="h-4 w-4" />Print</Button>
                </div>
                {/* 旅程进度/成就 */}
                <div className="mb-2 w-full">
                  <h4 className="text-base font-bold mb-2 text-purple-700">Progress</h4>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div className="bg-gradient-to-r from-purple-500 to-fuchsia-500 h-2 rounded-full" style={{ width: `${Math.round(((completedItems.size || 0) / (itinerary?.dailyItinerary?.reduce((t: number, d: Day) => t + (d.activities?.length || 0) + (d.restaurants?.length || 0), 0) || 1)) * 100)}%` }}></div>
                  </div>
                  <div className="text-xs text-gray-600">{completedItems.size} / {itinerary?.dailyItinerary?.reduce((t: number, d: Day) => t + (d.activities?.length || 0) + (d.restaurants?.length || 0), 0) || 0} activities completed</div>
                </div>
                {/* AI Suggestion */}
                <div className="w-full">
                  <h4 className="text-base font-bold mb-2 text-fuchsia-700">AI Suggestion</h4>
                  <div className="bg-fuchsia-50 text-fuchsia-800 rounded-lg p-3 text-sm font-medium shadow-sm">
                    Don&#39;t miss: {itinerary?.dailyItinerary?.[0]?.activities?.[0]?.name || 'Morning Stroll in Tiergarten'}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feedback Floating Button */}
      <div>
        <button
          className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-full shadow-lg p-2 hover:scale-105 transition-all flex items-center gap-1"
          onClick={() => setFeedbackOpen(true)}
          title="Send Feedback"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M2 21l21-9-21-9v7l15 2-15 2v7z" fill="currentColor"/></svg>
          <span className="font-semibold hidden sm:inline text-xs">Feedback</span>
        </button>
        {/* Feedback Modal */}
        {feedbackOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md relative">
              <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-700" onClick={() => setFeedbackOpen(false)} title="Close">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
              <h2 className="text-xl font-bold mb-4 text-gray-800">Send Feedback</h2>
              {feedbackSent ? (
                <div className="text-green-600 text-center font-semibold py-8">Thank you for your feedback!</div>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                  <textarea
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                    rows={4}
                    placeholder="Let us know your suggestions, issues, or anything you'd like to share..."
                    value={feedbackText}
                    onChange={e => setFeedbackText(e.target.value)}
                    required
                  />
                  <input
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    type="email"
                    placeholder="(Optional) Leave your email if you'd like us to follow up"
                    value={feedbackEmail}
                    onChange={e => setFeedbackEmail(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-bold py-2 rounded-lg hover:from-purple-700 hover:to-fuchsia-700 transition-all"
                  >
                    Submit Feedback
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Date Popover */}
      {openPopover === 'dates' && (
        <div
          id="date-popover"
          className="fixed z-[9999] bg-white rounded-xl shadow-xl p-4 w-auto border border-gray-100 flex flex-col items-center"
          style={{
            left: '50vw',
            top: 120,
            transform: 'translateX(-50%)'
          }}
        >
          <h2 className="text-base font-bold mb-2 text-gray-800">Edit Trip Dates</h2>
          <div className="flex flex-row gap-6">
            <div className="flex flex-col items-center">
              <label className="font-medium text-gray-700 mb-2">Start Date</label>
              <CalendarPanel selectedDate={tempStartDate} onSelect={setTempStartDate} />
            </div>
            <div className="flex flex-col items-center">
              <label className="font-medium text-gray-700 mb-2">End Date</label>
              <CalendarPanel selectedDate={tempEndDate} onSelect={setTempEndDate} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4 w-full">
            <button className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200" onClick={() => setOpenPopover(null)}>Cancel</button>
            <button className="px-3 py-1 rounded bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-bold" onClick={() => { setDisplayStartDate(tempStartDate); setDisplayEndDate(tempEndDate); setOpenPopover(null); }}>Save</button>
          </div>
        </div>
      )}
      {openPopover === 'budget' && (
        <div
          id="budget-popover"
          className="fixed z-[9999] bg-white rounded-xl shadow-xl p-4 w-auto border border-gray-100 flex flex-col items-center"
          style={{
            left: '50vw',
            top: 120,
            transform: 'translateX(-50%)'
          }}
        >
          <h2 className="text-base font-bold mb-2 text-gray-800">Edit Budget</h2>
          <div className="flex flex-col gap-2 items-center">
            <input type="range" min="0" max="10000" step="1" value={tempBudget} onChange={e => setTempBudget(Number(e.target.value))} className="w-full" />
            <div className="text-xl font-bold text-purple-600">$ {tempBudget}</div>
          </div>
          <div className="flex justify-end gap-2 mt-4 w-full">
            <button className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200" onClick={() => setOpenPopover(null)}>Cancel</button>
            <button className="px-3 py-1 rounded bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-bold" onClick={() => { setDisplayBudget(tempBudget); setOpenPopover(null); }}>Save</button>
          </div>
        </div>
      )}
      {openPopover === 'companions' && (
        <div
          id="companions-popover"
          className="fixed z-[9999] bg-white rounded-xl shadow-xl p-4 w-auto border border-gray-100 flex flex-col items-center"
          style={{
            left: '50vw',
            top: 120,
            transform: 'translateX(-50%)'
          }}
        >
          <h2 className="text-base font-bold mb-2 text-gray-800">Select Companions</h2>
          <div className="flex flex-col gap-2">
            {companionOptions.map((opt: { value: string; label: string; icon: React.ReactNode }) => (
              <button
                key={opt.value}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all w-full text-left ${tempCompanions === opt.value ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white border-purple-500' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-purple-50'}`}
                onClick={() => setTempCompanions(opt.value)}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>
          <div className="flex justify-end gap-2 mt-4 w-full">
            <button className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200" onClick={() => setOpenPopover(null)}>Cancel</button>
            <button className="px-3 py-1 rounded bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-bold" onClick={() => { setDisplayCompanions(tempCompanions); setOpenPopover(null); }}>Save</button>
          </div>
        </div>
      )}

      {/* 新增：二维码弹窗 */}
      {showQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-xs flex flex-col items-center relative">
            <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-700" onClick={() => setShowQr(false)} title="Close">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold mb-4 text-purple-700">Journey QR Code</h2>
            <QRCodeSVG value={window.location.href} size={180} bgColor="#fff" fgColor="#7c3aed" />
            <div className="text-xs text-gray-500 mt-2">Scan to view this journey</div>
          </div>
        </div>
      )}
    </>
  )
}
