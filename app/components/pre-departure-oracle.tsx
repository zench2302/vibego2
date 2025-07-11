"use client"

import { useState, ChangeEvent, useMemo, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Sparkles, Star, Heart, Compass, ArrowLeft } from "lucide-react"
import { oracleSteps } from "@/lib/oracle-data"
import { useAuth } from "../context/auth-context"
import AuthScreen from "./auth-screen"

type FormData = {
  archetype: string
  mood: string
  philosophy: string
  intention: string
  destinations: string[]
  destination: string
  companions: string
  startDate: string
  endDate: string
  budget: number
  specialRequests: string
}

interface PreDepartureOracleProps {
  onComplete: (answers: any) => void
  onBack?: () => void
}

// 静态城市/国家列表
const DESTINATION_LIST = [
  "London", "Istanbul", "Vienna", "Paris", "New York", "Tokyo", "Sydney", "Berlin", "Rome", "Barcelona", "Beijing", "Shanghai", "Moscow", "Dubai", "Bangkok", "Singapore", "Los Angeles", "San Francisco", "Toronto", "Seoul", "Hong Kong"
];

const COUNTRY_API = "https://restcountries.com/v3.1/all";
const CITIES_API = "https://wft-geo-db.p.rapidapi.com/v1/geo/cities";

// 顶层定义 transformFormData
function transformFormData(formData: FormData) {
  const transformed: any = {};
  oracleSteps.forEach(step => {
    if (step.id === 'practical') return;
    const value = formData[step.id as keyof FormData];
    if (step.multiSelect) {
      transformed[step.id] = Array.isArray(value) ? value : [];
    } else {
      const option = step.options?.find(opt => opt.value === value);
      if (option) transformed[step.id] = option;
    }
  });
  transformed.practical = {
    destination: formData.destination,
    startDate: formData.startDate,
    endDate: formData.endDate,
    budget: formData.budget,
    companions: formData.companions,
    specialRequests: formData.specialRequests,
  };
  return transformed;
}

export default function PreDepartureOracle({ onComplete, onBack }: PreDepartureOracleProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<FormData>({
    archetype: "",
    mood: "",
    philosophy: "",
    intention: "",
    destinations: [],
    destination: "",
    companions: "solo",
    startDate: "",
    endDate: "",
    budget: 2000,
    specialRequests: "",
  })
  const [destinationQuery, setDestinationQuery] = useState("");
  const [destinationDropdown, setDestinationDropdown] = useState(false);
  const [cityOptions, setCityOptions] = useState<{label: string, value: string, key: string}[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [pendingItinerary, setPendingItinerary] = useState<any>(null);
  // 1. 增加搜索历史 state
  const [destinationHistory, setDestinationHistory] = useState<string[]>([]);

  // 只允许选择下拉项
  const validOptions = useMemo(() => [
    ...cityOptions.map(opt => opt.value)
  ], [cityOptions]);

  // 动态获取城市
  const fetchOptions = async (query: string) => {
    setLoadingOptions(true);
    // GeoDB Cities
    let cities: {label: string, value: string, key: string}[] = [];
    try {
      const res = await fetch(`${CITIES_API}?namePrefix=${encodeURIComponent(query)}&limit=8&sort=-population`, {
        headers: {
          'X-RapidAPI-Key': process.env.NEXT_PUBLIC_GEODB_API_KEY!,
          'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com'
        }
      });
      const data = await res.json();
      if (data.data) {
        cities = data.data.map((c: any, idx: number) => ({
          label: `${c.city}, ${c.country}`,
          value: `${c.city}, ${c.country}`,
          key: c.id ? `${c.id}` : `${c.city},${c.country},${idx}`
        }));
      }
    } catch {}
    setCityOptions(cities);
    setLoadingOptions(false);
  };

  // 输入时debounce并请求
  const handleDestinationInput = (e: ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setDestinationQuery(q);
    setDestinationDropdown(true);
    setFormData(prev => ({ ...prev, destination: q }));
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      if (q.trim()) fetchOptions(q.trim());
      else {
        setCityOptions([]);
      }
    }, 300);
  };

  // 在 handleDestinationSelect 里保存历史
  const handleDestinationSelect = (val: string) => {
    setFormData(prev => ({ ...prev, destination: val }));
    setDestinationQuery(val);
    setDestinationDropdown(false);
    setDestinationHistory(prev => {
      const newHistory = [val, ...prev.filter(item => item !== val)].slice(0, 3);
      localStorage.setItem('destinationHistory', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  // 初始化时从 localStorage 读取历史
  useEffect(() => {
    const history = localStorage.getItem('destinationHistory');
    if (history) setDestinationHistory(JSON.parse(history));
  }, []);

  const currentStepData = oracleSteps[currentStep]

  const getMoodBackground = () => {
    const moodStep = oracleSteps.find(step => step.id === 'mood');
    if (formData.mood && moodStep && moodStep.options) {
      const moodOption = moodStep.options.find((opt) => opt.value === formData.mood)
      return moodOption?.bgColor || "bg-slate-900/20"
    }
    return "bg-slate-900/20"
  }

  const handleSingleSelect = (name: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleMultiSelect = (value: string) => {
    setFormData((prev) => {
      const currentValues = prev.destinations
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value]
      return { ...prev, destinations: newValues }
    })
  }
  
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({...prev, [name]: name === 'budget' ? Number(value) : value }))
  }

  // 登录弹窗的 onAuthStart
  function handleAuthStart() {
    setShowAuthModal(false);
    setIsGenerating(true);
  }

  // 登录后自动进入 loading 并生成 itinerary
  useEffect(() => {
    if (user && isGenerating && !pendingItinerary) {
      const finalAnswers = transformFormData(formData);
      fetch("/api/generate-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ soulProfile: finalAnswers })
      })
        .then(res => {
          if (!res.ok) throw new Error("Failed to generate itinerary");
          return res.json();
        })
        .then(data => {
          setIsGenerating(false);
          setPendingItinerary(data);
        })
        .catch(() => {
          setGenerationError("Failed to generate itinerary. Please try again later.");
          setIsGenerating(false);
        });
    }
    // eslint-disable-next-line
  }, [user, isGenerating]);

  // itinerary 生成完毕后，onComplete
  useEffect(() => {
    if (pendingItinerary) {
      onComplete(pendingItinerary);
      setPendingItinerary(null);
    }
  }, [pendingItinerary, onComplete]);

  const handleComplete = async () => {
    console.log('handleComplete called');
    const finalAnswers = transformFormData(formData);
    console.log('finalAnswers:', finalAnswers);
    setIsGenerating(true);
    setGenerationError(null);
    try {
      const res = await fetch("/api/generate-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ soulProfile: finalAnswers })
      });
      if (!res.ok) throw new Error("Failed to generate itinerary");
      const data = await res.json();
      setIsGenerating(false);
      // 合并 practical 字段，确保 itinerary 页面能拿到 quiz 输入
      const merged = { ...data, practical: finalAnswers.practical };
      console.log('onComplete will be called with:', merged);
      onComplete(merged);
    } catch (e) {
      setGenerationError("Failed to generate itinerary. Please try again later.");
      setIsGenerating(false);
      console.error(e);
    }
  }

  const handleNextStep = () => {
    if (currentStep < oracleSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  }

  const canProceed = () => {
    const id = currentStepData.id as keyof FormData
    if (currentStepData.practical) {
      // destination 必须是下拉项之一
      return validOptions.includes(formData.destination) && formData.startDate && formData.endDate
    }
    const value = formData[id]
    return Array.isArray(value) ? value.length > 0 : !!value
  }

  if (currentStepData.practical) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 ${getMoodBackground()} transition-all duration-1000`}>
        {/* 登录弹窗 */}
        {showAuthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="relative w-full max-w-lg mx-auto">
              <AuthScreen onBack={() => setShowAuthModal(false)} onAuthStart={handleAuthStart} />
              {isGenerating && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <div className="bg-white/90 rounded-lg px-6 py-4 text-center shadow-xl">
                    <span className="text-lg font-semibold text-purple-700">Preparing your mystical journey...</span>
                  </div>
                </div>
              )}
              {generationError && (
                <div className="absolute bottom-0 left-0 right-0 bg-red-100 text-red-700 text-center py-2 rounded-b-lg">
                  {generationError}
                </div>
              )}
            </div>
          </div>
        )}
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
          {onBack && (
            <Button
              onClick={onBack}
              variant="ghost"
              className="absolute top-8 left-8 text-purple-300 hover:text-white hover:bg-white/10 z-20"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}
          
          <Card className="w-full max-w-3xl border border-white/10 shadow-2xl bg-white/5 backdrop-blur-xl">
            <CardHeader className="text-center pb-6">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Compass className="h-8 w-8 text-amber-400 animate-pulse" />
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-amber-300 to-purple-300 bg-clip-text text-transparent">
                  {currentStepData.title}
                </CardTitle>
              </div>
              <div className="w-full flex flex-col items-center gap-2 mb-2">
                <div className="relative w-full max-w-xl h-4 flex items-center">
                  {oracleSteps.map((step, idx) => {
                    const total = oracleSteps.length;
                    const width = 100 / total;
                    return (
                      <div
                        key={step.id}
                        style={{ left: `calc(${(idx / total) * 100}% - 2px)`, width: `calc(${width}% + 2px)`, zIndex: 2, height: '100%' }}
                        className={
                          'absolute rounded-full transition-all duration-200 h-4 bg-gradient-to-r from-purple-500 to-blue-400 shadow-lg border-2 border-white/40 scale-110'
                        }
                      />
                    );
                  })}
                  <div className="absolute left-0 top-0 w-full h-4 bg-gray-400/30 rounded-full -z-10" />
                </div>
                <span className="text-sm text-gray-300 font-medium">Step {oracleSteps.length} / {oracleSteps.length}</span>
              </div>
            </CardHeader>

            <CardContent className="space-y-8">
              <div className="text-center">
                <h3 className="text-2xl font-semibold mb-2 text-slate-100">{currentStepData.question}</h3>
                <p className="text-slate-300">{currentStepData.subtitle}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4 relative">
                  <label className="block text-sm font-medium text-slate-200">Destination</label>
                  <input
                    type="text"
                    name="destination"
                    autoComplete="off"
                    placeholder="Type to search for a city"
                    value={destinationQuery}
                    onChange={handleDestinationInput}
                    onFocus={() => setDestinationDropdown(true)}
                    onBlur={() => setTimeout(() => setDestinationDropdown(false), 150)}
                    className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:border-purple-400 focus:outline-none backdrop-blur-sm"
                  />
                  {/* 下拉选择框，仅城市 */}
                  {destinationDropdown && cityOptions.length > 0 && (
                    <div className="absolute z-20 mt-1 w-full bg-white/90 rounded-lg shadow-lg max-h-64 overflow-auto">
                      {cityOptions.map(opt => (
                        <div
                          key={opt.key}
                          onMouseDown={() => handleDestinationSelect(opt.value)}
                          className={`px-4 py-2 cursor-pointer hover:bg-purple-100 text-gray-800 ${opt.value === formData.destination ? 'bg-purple-200 font-bold' : ''}`}
                        >
                          {opt.label}
                        </div>
                      ))}
                      {loadingOptions && <div className="px-4 py-2 text-gray-400 text-sm">Loading...</div>}
                      {!loadingOptions && cityOptions.length === 0 && (
                        <div className="px-4 py-2 text-gray-400 text-sm">No results</div>
                      )}
                    </div>
                  )}
                  {destinationDropdown && destinationHistory.length > 0 && (
                    <div className="absolute z-20 mt-1 w-full bg-white rounded-lg shadow-lg max-h-32 overflow-auto top-full left-0">
                      <div className="px-4 py-2 text-xs text-gray-500">Recent Searches</div>
                      {destinationHistory.map((item, idx) => (
                        <div
                          key={item + idx}
                          onMouseDown={() => handleDestinationSelect(item)}
                          className="px-4 py-2 cursor-pointer hover:bg-purple-100 text-gray-800"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-medium text-slate-200">Travel Companions</label>
                  <select
                    name="companions"
                    value={formData.companions}
                    onChange={handleInputChange}
                    className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-purple-400 focus:outline-none backdrop-blur-sm"
                  >
                    <option value="solo" className="bg-slate-800">Solo Journey</option>
                    <option value="partner" className="bg-slate-800">With Partner</option>
                    <option value="friends" className="bg-slate-800">With Friends</option>
                    <option value="family" className="bg-slate-800">With Family</option>
                  </select>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-medium text-slate-200">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-purple-400 focus:outline-none backdrop-blur-sm"
                  />
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-medium text-slate-200">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    min={formData.startDate || undefined}
                    onChange={handleInputChange}
                    className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-purple-400 focus:outline-none backdrop-blur-sm"
                  />
                </div>

                <div className="md:col-span-2 space-y-4">
                  <label className="block text-sm font-medium text-slate-200">Sacred Budget ($)</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      name="budget"
                      min="0"
                      max="5000"
                      step="100"
                      value={formData.budget}
                      onChange={handleInputChange}
                      className="w-full accent-purple-500"
                    />
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      name="budget"
                      min="0"
                      value={formData.budget}
                      onChange={handleInputChange}
                      className="w-28 p-2 rounded-lg bg-white/10 border border-white/20 text-white focus:border-purple-400 focus:outline-none backdrop-blur-sm text-right"
                      placeholder="Custom"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-4">
                  <label className="block text-sm font-medium text-slate-200">Additional Preferences</label>
                  <textarea
                    name="specialRequests"
                    placeholder="Share any additional preferences, requirements, or dreams for your journey..."
                    value={formData.specialRequests}
                    onChange={handleInputChange}
                    className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:border-purple-400 focus:outline-none backdrop-blur-sm"
                    rows={3}
                  />
                </div>
              </div>

              <div className="text-center pt-6">
                <Button
                  onClick={handleComplete}
                  disabled={isGenerating}
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                >
                  Complete the Oracle Ritual
                  <Sparkles className="ml-2 h-5 w-5 animate-spin" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }
  
  // loading页渲染
  if (isGenerating && !showAuthModal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mb-6"></div>
        <div className="text-xl font-semibold text-purple-200 mt-6">Preparing your mystical journey...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 ${getMoodBackground()} transition-all duration-1000`}>
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        {onBack && currentStep === 0 && (
          <Button
            onClick={onBack}
            variant="ghost"
            className="absolute top-8 left-8 text-purple-300 hover:text-white hover:bg-white/10 z-20"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        )}
        
        {currentStep > 0 && (
          <Button
            onClick={() => setCurrentStep(prev => prev - 1)}
            variant="ghost"
            className="absolute top-8 left-8 text-purple-300 hover:text-white hover:bg-white/10 z-20"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
        )}
        
        <Card className="w-full max-w-4xl border border-white/10 shadow-2xl bg-white/5 backdrop-blur-xl">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Star className="h-8 w-8 text-amber-400 animate-pulse" />
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-amber-300 to-purple-300 bg-clip-text text-transparent">
                {currentStepData.title}
              </CardTitle>
            </div>
            <div className="w-full flex flex-col items-center gap-2 mb-2">
              <div className="relative w-full max-w-xl h-4 flex items-center">
                {oracleSteps.map((step, idx) => {
                  const total = oracleSteps.length;
                  const width = 100 / total;
                  const answered = (() => {
                    const id = step.id as keyof FormData;
                    const value = formData[id];
                    return Array.isArray(value) ? value.length > 0 : !!value;
                  })();
                  const isCurrent = idx === currentStep;
                  const isActive = isCurrent || answered;
                  return (
                    <button
                      key={step.id}
                      type="button"
                      disabled={!answered && !isCurrent}
                      onClick={() => setCurrentStep(idx)}
                      style={{ left: `calc(${(idx / total) * 100}% - 2px)`, width: `calc(${width}% + 2px)`, zIndex: isCurrent ? 2 : 1, height: '100%' }}
                      className={`absolute rounded-full transition-all duration-200 h-4
                        ${isActive ? 'bg-gradient-to-r from-purple-500 to-blue-400 shadow-lg' : 'bg-gray-200'}
                        border-2 border-white/40
                        ${isCurrent ? 'scale-110' : ''}
                        ${answered && !isCurrent ? 'hover:scale-105' : ''}
                        ${!answered && !isCurrent ? 'cursor-not-allowed' : ''}
                      `}
                      aria-label={`Go to step ${idx + 1}`}
                    />
                  );
                })}
                <div className="absolute left-0 top-0 w-full h-4 bg-gray-400/30 rounded-full -z-10" />
              </div>
              <span className="text-sm text-gray-300 font-medium">Step {currentStep + 1} / {oracleSteps.length}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="text-center">
              <h3 className="text-2xl font-semibold mb-2 text-slate-100">{currentStepData.question}</h3>
              <p className="text-slate-300">{currentStepData.subtitle}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-2">
              {currentStepData.options && currentStepData.options.map((option) => {
                const id = currentStepData.id as keyof FormData
                const isSelected = currentStepData.multiSelect
                  ? formData.destinations.includes(option.value)
                  : formData[id] === option.value

                return (
                  <div
                    key={option.value}
                    onClick={() => currentStepData.multiSelect ? handleMultiSelect(option.value) : handleSingleSelect(id, option.value)}
                    className={`group cursor-pointer p-2 rounded-lg border transition-all duration-200
                      ${isSelected
                        ? `border-purple-500 bg-purple-100/60 shadow-md scale-105`
                        : `border-white/20 bg-white/5 hover:border-purple-400/50`
                    }`}
                    tabIndex={0}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') currentStepData.multiSelect ? handleMultiSelect(option.value) : handleSingleSelect(id, option.value); }}
                    role="button"
                    aria-pressed={isSelected}
                  >
                    <div className="flex items-start gap-2">
                      <div className="text-2xl">{option.emoji}</div>
                      <div>
                        <h4 className={`text-base font-semibold ${isSelected ? 'text-purple-700' : 'text-slate-100'}`}>{option.label}</h4>
                        <p className={`text-sm ${isSelected ? 'text-purple-500' : 'text-slate-300'}`}>{option.description}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="text-center pt-6">
              <Button
                onClick={handleNextStep}
                disabled={!canProceed() || isGenerating}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
              >
                {currentStep < oracleSteps.length - 1 ? "Continue the Ritual" : "Complete the Oracle Ritual"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
