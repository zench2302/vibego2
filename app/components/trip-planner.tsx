"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Users, DollarSign, Sparkles } from "lucide-react"

interface TripPlannerProps {
  personalityData: any
  onComplete: (data: any) => void
}

export default function TripPlanner({ personalityData, onComplete }: TripPlannerProps) {
  const [formData, setFormData] = useState({
    destination: "",
    startDate: "",
    endDate: "",
    budget: "",
    groupSize: "",
    interests: [] as string[],
    specialRequests: "",
  })

  const interestOptions = [
    "Museums & Art",
    "Food & Dining",
    "Nightlife",
    "Nature & Outdoors",
    "Shopping",
    "Architecture",
    "History",
    "Music & Entertainment",
    "Photography",
    "Adventure Sports",
    "Wellness & Spa",
    "Local Markets",
  ]

  const handleInterestToggle = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onComplete({
      ...formData,
      personalityType: personalityData.type,
    })
  }

  const isFormValid =
    formData.destination && formData.startDate && formData.endDate && formData.budget && formData.groupSize

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header with personality result */}
        <Card className="mb-8 border-0 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="text-4xl">{personalityData.emoji}</span>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-800">{personalityData.type}</CardTitle>
                <CardDescription className="text-lg">{personalityData.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Trip Planning Form */}
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-2">
              <MapPin className="h-6 w-6 text-purple-600" />
              Plan Your Perfect Trip
            </CardTitle>
            <CardDescription className="text-lg">
              Tell us about your dream destination and we'll create a personalized itinerary
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Destination and Dates */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="destination" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Destination
                  </Label>
                  <Input
                    id="destination"
                    placeholder="e.g., Tokyo, Japan"
                    value={formData.destination}
                    onChange={(e) => setFormData((prev) => ({ ...prev, destination: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Start Date
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    End Date
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* Budget and Group Size */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budget" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Budget Range
                  </Label>
                  <Select
                    value={formData.budget}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, budget: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your budget range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="budget">Budget ($50-100/day)</SelectItem>
                      <SelectItem value="moderate">Moderate ($100-200/day)</SelectItem>
                      <SelectItem value="luxury">Luxury ($200-500/day)</SelectItem>
                      <SelectItem value="ultra">Ultra Luxury ($500+/day)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="groupSize" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Group Size
                  </Label>
                  <Select
                    value={formData.groupSize}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, groupSize: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="How many travelers?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Solo Traveler</SelectItem>
                      <SelectItem value="2">Couple</SelectItem>
                      <SelectItem value="3-4">Small Group (3-4)</SelectItem>
                      <SelectItem value="5+">Large Group (5+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Interests */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">What interests you most? (Select all that apply)</Label>
                <div className="flex flex-wrap gap-2">
                  {interestOptions.map((interest) => (
                    <Badge
                      key={interest}
                      variant={formData.interests.includes(interest) ? "default" : "outline"}
                      className={`cursor-pointer px-3 py-2 text-sm transition-colors ${
                        formData.interests.includes(interest)
                          ? "bg-purple-600 hover:bg-purple-700"
                          : "hover:bg-purple-50 hover:border-purple-300"
                      }`}
                      onClick={() => handleInterestToggle(interest)}
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Special Requests */}
              <div className="space-y-2">
                <Label htmlFor="specialRequests">Special Requests or Preferences</Label>
                <Textarea
                  id="specialRequests"
                  placeholder="Any dietary restrictions, accessibility needs, must-see places, or other special requests..."
                  value={formData.specialRequests}
                  onChange={(e) => setFormData((prev) => ({ ...prev, specialRequests: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* Submit Button */}
              <div className="text-center pt-6">
                <Button
                  type="submit"
                  disabled={!isFormValid}
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate My Perfect Itinerary
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
