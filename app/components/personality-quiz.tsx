"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react"

const questions = [
  {
    id: 1,
    question: "What's your ideal vacation pace?",
    options: [
      { value: "fast", label: "Packed schedule - see everything!", emoji: "⚡" },
      { value: "moderate", label: "Balanced mix of activities and rest", emoji: "⚖️" },
      { value: "slow", label: "Relaxed and spontaneous", emoji: "🌸" },
      { value: "flexible", label: "Depends on my mood", emoji: "🎭" },
    ],
  },
  {
    id: 2,
    question: "How do you prefer to explore new places?",
    options: [
      { value: "guided", label: "Guided tours and planned activities", emoji: "👥" },
      { value: "research", label: "Self-guided with thorough research", emoji: "📚" },
      { value: "wander", label: "Wander and discover organically", emoji: "🚶" },
      { value: "local", label: "Ask locals for recommendations", emoji: "🗣️" },
    ],
  },
  {
    id: 3,
    question: "What type of accommodations appeal to you most?",
    options: [
      { value: "luxury", label: "Luxury hotels with full amenities", emoji: "🏨" },
      { value: "boutique", label: "Unique boutique properties", emoji: "🏛️" },
      { value: "local", label: "Local B&Bs or homestays", emoji: "🏠" },
      { value: "budget", label: "Budget-friendly but clean options", emoji: "💰" },
    ],
  },
  {
    id: 4,
    question: "What's your relationship with food while traveling?",
    options: [
      { value: "adventurous", label: "Try everything - the weirder, the better!", emoji: "🦑" },
      { value: "local", label: "Focus on authentic local cuisine", emoji: "🍜" },
      { value: "familiar", label: "Mix of local and familiar foods", emoji: "🍕" },
      { value: "careful", label: "Stick to what I know I'll like", emoji: "🥗" },
    ],
  },
  {
    id: 5,
    question: "How important is Instagram-worthy content to you?",
    options: [
      { value: "essential", label: "Very important - I love sharing my travels", emoji: "📸" },
      { value: "nice", label: "Nice to have but not essential", emoji: "📱" },
      { value: "minimal", label: "I prefer to live in the moment", emoji: "👁️" },
      { value: "private", label: "I keep my travels mostly private", emoji: "🤫" },
    ],
  },
  {
    id: 6,
    question: "What's your ideal group size for traveling?",
    options: [
      { value: "solo", label: "Solo - complete freedom", emoji: "🧘" },
      { value: "couple", label: "Just me and my partner/friend", emoji: "👫" },
      { value: "small", label: "Small group (3-5 people)", emoji: "👥" },
      { value: "large", label: "The more the merrier!", emoji: "🎉" },
    ],
  },
]

interface PersonalityQuizProps {
  onComplete: (data: any) => void
}

export default function PersonalityQuiz({ onComplete }: PersonalityQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})

  const handleAnswer = (value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questions[currentQuestion].id]: value,
    }))
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1)
    } else {
      // Calculate personality type and complete quiz
      const personalityProfile = calculatePersonality(answers)
      onComplete(personalityProfile)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1)
    }
  }

  const calculatePersonality = (answers: Record<number, string>) => {
    // Simple personality calculation logic
    const traits = {
      adventurous: 0,
      cultural: 0,
      relaxed: 0,
      social: 0,
      foodie: 0,
      photographer: 0,
    }

    // Analyze answers and assign personality traits
    Object.values(answers).forEach((answer) => {
      switch (answer) {
        case "fast":
        case "adventurous":
          traits.adventurous += 2
          break
        case "guided":
        case "research":
          traits.cultural += 2
          break
        case "slow":
        case "flexible":
          traits.relaxed += 2
          break
        case "large":
        case "local":
          traits.social += 2
          break
        case "essential":
          traits.photographer += 3
          break
      }
    })

    // Determine primary personality type
    const maxTrait = Object.entries(traits).reduce((a, b) =>
      traits[a[0] as keyof typeof traits] > traits[b[0] as keyof typeof traits] ? a : b,
    )

    const personalityTypes = {
      adventurous: { type: "Adventure Seeker", emoji: "🌟", description: "You crave excitement and new experiences!" },
      cultural: {
        type: "Culture Enthusiast",
        emoji: "🎨",
        description: "You love diving deep into local culture and history!",
      },
      relaxed: {
        type: "Mindful Explorer",
        emoji: "🧘",
        description: "You prefer a balanced, mindful approach to travel!",
      },
      social: {
        type: "Social Butterfly",
        emoji: "🦋",
        description: "You love meeting people and sharing experiences!",
      },
      foodie: {
        type: "Foodie Wanderer",
        emoji: "🍽️",
        description: "Your travels revolve around amazing food experiences!",
      },
      photographer: {
        type: "Visual Storyteller",
        emoji: "📸",
        description: "You see the world through a creative lens!",
      },
    }

    return {
      ...personalityTypes[maxTrait[0] as keyof typeof personalityTypes],
      traits,
      answers,
    }
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100
  const currentQ = questions[currentQuestion]
  const hasAnswer = answers[currentQ.id]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-0 shadow-xl bg-white/90 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-6 w-6 text-purple-600" />
            <CardTitle className="text-2xl font-bold text-gray-800">Discover Your Travel Vibe</CardTitle>
          </div>
          <CardDescription className="text-lg">
            Question {currentQuestion + 1} of {questions.length}
          </CardDescription>
          <Progress value={progress} className="mt-4" />
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-6 text-gray-800">{currentQ.question}</h3>
          </div>

          <RadioGroup value={answers[currentQ.id] || ""} onValueChange={handleAnswer} className="space-y-3">
            {currentQ.options.map((option) => (
              <div
                key={option.value}
                className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <RadioGroupItem value={option.value} id={option.value} />
                <Label htmlFor={option.value} className="flex items-center gap-3 cursor-pointer flex-1 text-base">
                  <span className="text-2xl">{option.emoji}</span>
                  <span>{option.label}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>

          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>

            <Button
              onClick={handleNext}
              disabled={!hasAnswer}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {currentQuestion === questions.length - 1 ? "Complete" : "Next"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
