"use client"

import { useState, ChangeEvent } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Sparkles, Star, Heart, Compass, ArrowLeft } from "lucide-react"
import { oracleSteps } from "@/lib/oracle-data"

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

  const handleNext = () => {
    if (currentStep < oracleSteps.length - 1) {
      setCurrentStep((prev) => prev + 1)
    } else {
      // All steps are complete, pass the final data up
      const finalAnswers = {
        ...formData,
        // Pass practical details nested as the API expects
        practical: {
          destination: formData.destination,
          startDate: formData.startDate,
          endDate: formData.endDate,
          budget: formData.budget,
          companions: formData.companions,
          specialRequests: formData.specialRequests,
        }
      }
      onComplete(finalAnswers)
    }
  }

  const canProceed = () => {
    const id = currentStepData.id as keyof FormData
    if (currentStepData.practical) {
      return formData.destination && formData.startDate && formData.endDate
    }
    const value = formData[id]
    return Array.isArray(value) ? value.length > 0 : !!value
  }

  if (currentStepData.practical) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 ${getMoodBackground()} transition-all duration-1000`}>
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
              <Progress value={((currentStep + 1) / oracleSteps.length) * 100} className="mt-4 bg-white/10" />
            </CardHeader>

            <CardContent className="space-y-8">
              <div className="text-center">
                <h3 className="text-2xl font-semibold mb-2 text-slate-100">{currentStepData.question}</h3>
                <p className="text-slate-300">{currentStepData.subtitle}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-slate-200">Destination</label>
                  <input
                    type="text"
                    name="destination"
                    placeholder="Where does your soul wish to wander?"
                    value={formData.destination}
                    onChange={handleInputChange}
                    className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:border-purple-400 focus:outline-none backdrop-blur-sm"
                  />
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
                    onChange={handleInputChange}
                    className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-purple-400 focus:outline-none backdrop-blur-sm"
                  />
                </div>

                <div className="md:col-span-2 space-y-4">
                  <label className="block text-sm font-medium text-slate-200">Sacred Budget Range</label>
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
                  <div className="text-center text-slate-200">
                    {formData.budget === 5000 ? "$5000+" : `$${formData.budget}`}
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
                  onClick={handleNext}
                  disabled={!canProceed()}
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
            <Progress value={((currentStep + 1) / oracleSteps.length) * 100} className="mt-4 bg-white/10" />
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="text-center">
              <h3 className="text-2xl font-semibold mb-2 text-slate-100">{currentStepData.question}</h3>
              <p className="text-slate-300">{currentStepData.subtitle}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {currentStepData.options && currentStepData.options.map((option) => {
                const id = currentStepData.id as keyof FormData
                const isSelected = currentStepData.multiSelect
                  ? formData.destinations.includes(option.value)
                  : formData[id] === option.value

                return (
                  <div
                    key={option.value}
                    onClick={() => currentStepData.multiSelect ? handleMultiSelect(option.value) : handleSingleSelect(id, option.value)}
                    className={`group cursor-pointer p-6 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${
                      isSelected
                        ? `border-purple-400 bg-purple-500/20 shadow-lg shadow-purple-500/10`
                        : `border-white/20 bg-white/5 hover:border-purple-400/50`
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`text-4xl transition-transform duration-300 ${isSelected ? 'scale-110' : 'scale-100'}`}>
                        {option.emoji}
                      </div>
                      <div>
                        <h4 className={`text-lg font-bold transition-colors duration-300 ${isSelected ? 'text-purple-200' : 'text-slate-100'}`}>
                          {option.label}
                        </h4>
                        <p className={`transition-colors duration-300 ${isSelected ? 'text-purple-300' : 'text-slate-300'}`}>
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="text-center pt-6">
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
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
