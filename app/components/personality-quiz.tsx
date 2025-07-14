"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react"
import type { PersonalityProfile } from "@/lib/types";

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

const archetypeOptions = [
  { key: "contemplative", emoji: "🧘", title: "The Contemplative", desc: "Calm and enjoys solitude" },
  { key: "spark", emoji: "🎇", title: "The Spark", desc: "Energetic and loves socializing" },
  { key: "seeker", emoji: "🧠", title: "The Seeker", desc: "Curious and loves exploring" },
  { key: "creator", emoji: "🎨", title: "The Creator", desc: "Creative and loves making things" },
  { key: "adventurer", emoji: "🌍", title: "The Adventurer", desc: "Bold and loves new experiences" },
  { key: "nurturer", emoji: "🤗", title: "The Nurturer", desc: "Caring and enjoys helping others" },
  { key: "organizer", emoji: "🗂️", title: "The Organizer", desc: "Practical and likes planning" },
  { key: "dreamer", emoji: "💭", title: "The Dreamer", desc: "Imaginative and loves to daydream" },
];

interface PersonalityQuizProps {
  onComplete: (data: PersonalityProfile) => void
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

  const isFirstStep = currentQuestion === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-0 shadow-xl bg-white/90 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-6 w-6 text-purple-600" />
            <CardTitle className="text-2xl font-bold text-gray-800">Soul Archetype Discovery</CardTitle>
          </div>
          <div className="flex flex-col items-center gap-2 mb-2">
            <div className="flex items-center gap-2">
              {questions.map((q, idx) => {
                const answered = typeof answers[q.id] !== 'undefined';
                const isCurrent = idx === currentQuestion;
                return (
                  <button
                    key={q.id}
                    type="button"
                    disabled={!answered && !isCurrent}
                    onClick={() => setCurrentQuestion(idx)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-200
                      ${isCurrent ? 'bg-gradient-to-br from-purple-500 to-blue-400 border-purple-600 text-white scale-110 shadow-lg' : ''}
                      ${answered && !isCurrent ? 'bg-purple-200 border-purple-400 text-purple-700 hover:scale-105' : ''}
                      ${!answered && !isCurrent ? 'bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed' : ''}
                    `}
                    aria-label={`Go to question ${idx + 1}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            <span className="text-sm text-gray-600 font-medium">Step {currentQuestion + 1} / {questions.length}</span>
          </div>
          <Progress value={progress} className="mt-2" />
        </CardHeader>

        <CardContent className="space-y-6">
          {isFirstStep ? (
            <>
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2 text-gray-800">Which archetype matches your soul&#39;s everyday rhythm?</h3>
                <p className="text-gray-500 mb-6">Feel into your deepest nature...</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {archetypeOptions.map((option) => {
                  const isSelected = answers[questions[0].id] === option.key;
                  return (
                    <div
                      key={option.key}
                      className={`flex flex-col items-start p-4 rounded-xl border transition-all duration-200 cursor-pointer w-full h-full
                        ${isSelected ? 'border-2 border-purple-500 bg-purple-100/60 shadow-lg scale-105' : 'border-gray-200 hover:bg-gray-50'}
                      `}
                      onClick={() => handleAnswer(option.key)}
                      tabIndex={0}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleAnswer(option.key); }}
                      role="button"
                      aria-pressed={isSelected}
                    >
                      <span className="text-3xl mb-2">{option.emoji}</span>
                      <span className="font-bold text-lg mb-1">{option.title}</span>
                      <span className="text-gray-600 text-sm">{option.desc}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-end pt-6">
                <Button
                  onClick={handleNext}
                  disabled={!answers[questions[0].id]}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  Continue the Ritual <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-6 text-gray-800">{currentQ.question}</h3>
              </div>
              <RadioGroup value={answers[currentQ.id] || ""} onValueChange={handleAnswer} className="space-y-3">
                {currentQ.options.map((option) => {
                  const isSelected = answers[currentQ.id] === option.value;
                  return (
                    <div
                      key={option.value}
                      className={`flex items-center space-x-3 p-4 rounded-lg border transition-all duration-200 cursor-pointer
                        ${isSelected
                          ? 'border-2 border-purple-500 bg-purple-100/60 shadow-lg scale-105'
                          : 'border-gray-200 hover:bg-gray-50'}
                      `}
                      onClick={() => handleAnswer(option.value)}
                      tabIndex={0}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleAnswer(option.value); }}
                      role="button"
                      aria-pressed={isSelected}
                    >
                      <RadioGroupItem value={option.value} id={option.value} />
                      <Label htmlFor={option.value} className="flex items-center gap-3 cursor-pointer flex-1 text-base">
                        <span className="text-2xl">{option.emoji}</span>
                        <span>{option.label}</span>
                      </Label>
                    </div>
                  );
                })}
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
