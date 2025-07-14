import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"

export const maxDuration = 30

// Define the schema for the generated itinerary to match itinerary-display.tsx
const ItinerarySchema = z.object({
  destination: z.string().describe("The primary destination city and country. e.g., 'Paris, France'."),
  tripTitle: z.string().describe("A creative and exciting title for the trip, like 'Parisian Dreams' or 'Alpine Adventures'."),
  dailyItinerary: z.array(z.object({
    day: z.number().describe("The day number, e.g., 1, 2, 3."),
    theme: z.string().describe("A theme for the day, like 'Cultural Immersion' or 'Relaxation & Rejuvenation'."),
    activities: z.array(z.object({
      name: z.string().describe("The descriptive name of the activity, e.g., 'Morning Visit to the Louvre Museum'."),
      description: z.string().describe("A brief, engaging description of the activity."),
      emoji: z.string().describe("An emoji that represents the activity."),
      address: z.string().describe("The full, verifiable street address of the location. This is critical for mapping and must be accurate."),
    })),
    restaurants: z.array(z.object({
      name: z.string().describe("The name of the restaurant."),
      description: z.string().describe("A brief, engaging description of the restaurant's atmosphere and cuisine."),
      emoji: z.string().describe("An emoji that represents the restaurant."),
      address: z.string().describe("The full, verifiable street address of the restaurant. This is critical for mapping and must be accurate."),
    }))
  })).describe("An array of daily plans."),
  soulQuote: z.string().optional().describe("An inspirational quote that matches the trip's vibe.")
})

export async function POST(req: Request) {
  try {
    const { soulProfile } = await req.json()

    if (!soulProfile) {
      return new Response(JSON.stringify({ error: "Soul profile is required." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Construct the prompt
    const prompt = `
      You are a world-class, creative, and thoughtful travel agent AI.
      Your mission is to generate a structured JSON itinerary based on a user's "soul profile".
      This itinerary must be not only practical but also deeply resonant with the user's stated personality, mood, and intentions.

      **CRITICAL INSTRUCTIONS:**
      1. Your ENTIRE response MUST be a single, valid JSON object. Do not include any text, comments, or any characters outside of the JSON object.
      2. Pay close attention to escaping characters within strings. For example, a quote inside a description should be escaped as \\".
      3. For every single 'activity' and 'restaurant', you MUST provide a real, verifiable street address.
      4. The name and address MUST correspond to a real-world location. Do not invent places.
      5. The ENTIRE itinerary must take place within the user's specified 'destination'. Do not suggest locations in other cities.
      6. The number of days in 'dailyItinerary' MUST exactly match the number of days between 'startDate' and 'endDate' (inclusive) in the user's profile (practical.startDate and practical.endDate). For example, if startDate is 2025-06-01 and endDate is 2025-06-05, you MUST generate 5 days, one for each date in the range.

      Here is the user's soul profile, which includes the destination and date range:
      \`\`\`json
      ${JSON.stringify(soulProfile, null, 2)}
    `
    
    // Generate the structured object
    const { object: itinerary } = await generateObject({
      model: openai("gpt-4o"),
      schema: ItinerarySchema,
      prompt,
    })

    return new Response(JSON.stringify(itinerary), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Error generating itinerary:", error)
    return new Response(JSON.stringify({ error: "Failed to generate itinerary." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
