"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Share2,
  QrCode,
  Link,
  Copy,
  Download,
  Eye,
  EyeOff,
  Heart,
  Sparkles,
  MapPin,
  Calendar,
  Users,
  Star,
  Plus,
} from "lucide-react"
import type { Itinerary, SoulProfile, Activity } from "@/lib/types"
import Image from 'next/image';

interface SharingRealmProps {
  journeyBlueprint: Itinerary;
  soulProfile: SoulProfile;
  onCreateNew?: () => void;
}

export default function SharingRealm({ journeyBlueprint, soulProfile, onCreateNew }: SharingRealmProps) {
  const [showQR, setShowQR] = useState(false)
  const [privacySettings, setPrivacySettings] = useState({
    hidePrivateLocations: false,
    obscureSensitiveDetails: false,
    controlNoteVisibility: true,
  })
  const [shareLink] = useState(`https://journeyoracle.app/shared/${Math.random().toString(36).substr(2, 9)}`)
  const [copied, setCopied] = useState(false)

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy link:", err)
    }
  }

  const generateQRCode = () => {
    // In a real app, this would generate an actual QR code
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareLink)}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <Card className="mb-8 border border-white/10 shadow-2xl bg-white/5 backdrop-blur-xl">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Share2 className="h-8 w-8 text-rose-400 animate-pulse" />
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-rose-300 to-purple-300 bg-clip-text text-transparent">
                Share Your Sacred Journey
              </CardTitle>
            </div>
            <p className="text-slate-300 text-lg">Invite kindred spirits to witness your soul&#39;s adventure</p>
          </CardHeader>
        </Card>

        {/* Journey Preview */}
        <Card className="mb-8 border border-white/10 shadow-xl bg-white/5 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-100">
              <Eye className="h-5 w-5 text-purple-400" />
              Journey Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Journey Header */}
              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="text-4xl">{soulProfile.archetype.emoji}</div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-100">{journeyBlueprint.tripTitle}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-300">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {journeyBlueprint.destination}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {journeyBlueprint.dailyItinerary?.length || 0} days
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {soulProfile.practical.companions}
                    </span>
                  </div>
                </div>
                <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                  <Star className="h-3 w-3 mr-1" />$Budget TBD
                </Badge>
              </div>

              {/* Sample Day Preview */}
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <h4 className="font-semibold mb-3 text-slate-200">Day 1 Preview - Day of Wonder</h4>
                <div className="grid md:grid-cols-2 gap-3">
                  {journeyBlueprint.dailyItinerary?.[0]?.activities.slice(0, 2).map((activity: Activity, index: number) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-white/5 rounded border border-white/10">
                      <span className="text-lg">{activity.emoji}</span>
                      <span className="text-sm text-slate-300">{activity.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mystical Quote */}
              <div className="text-center p-4 bg-gradient-to-r from-purple-900/40 to-pink-900/40 rounded-lg border border-purple-400/20">
                <p className="text-lg italic text-purple-100 mb-2">&quot;{String(soulProfile.soulQuote || 'Your journey awaits...')}&quot;</p>
                <p className="text-sm text-slate-400">— Your Soul&#39;s Wisdom</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Controls */}
        <Card className="mb-8 border border-white/10 shadow-xl bg-white/5 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-100">
              <EyeOff className="h-5 w-5 text-emerald-400" />
              Sacred Privacy Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="hide-private" className="text-slate-200">
                  Hide Private Locations
                </Label>
                <p className="text-sm text-slate-400">Conceal personal or sensitive destinations</p>
              </div>
              <Switch
                id="hide-private"
                checked={privacySettings.hidePrivateLocations}
                onCheckedChange={(checked) =>
                  setPrivacySettings((prev) => ({ ...prev, hidePrivateLocations: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="obscure-details" className="text-slate-200">
                  Obscure Sensitive Details
                </Label>
                <p className="text-sm text-slate-400">Hide specific times, costs, and personal notes</p>
              </div>
              <Switch
                id="obscure-details"
                checked={privacySettings.obscureSensitiveDetails}
                onCheckedChange={(checked) =>
                  setPrivacySettings((prev) => ({ ...prev, obscureSensitiveDetails: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="control-notes" className="text-slate-200">
                  Control Note Visibility
                </Label>
                <p className="text-sm text-slate-400">Choose which personal notes to share</p>
              </div>
              <Switch
                id="control-notes"
                checked={privacySettings.controlNoteVisibility}
                onCheckedChange={(checked) =>
                  setPrivacySettings((prev) => ({ ...prev, controlNoteVisibility: checked }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Sharing Options */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* QR Code Sharing */}
          <Card className="border border-white/10 shadow-xl bg-white/5 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-100">
                <QrCode className="h-5 w-5 text-purple-400" />
                Mystical QR Portal
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              {showQR ? (
                <div className="space-y-4">
                  <div className="p-4 bg-white rounded-lg inline-block">
                    <Image
                      src={generateQRCode() || "/placeholder.svg"}
                      alt="Journey QR Code"
                      width={192}
                      height={192}
                    />
                  </div>
                  <p className="text-sm text-slate-300">Scan to enter the journey realm</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/20 text-slate-200 hover:bg-white/10 bg-white/5"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download QR
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-48 h-48 mx-auto bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center shadow-lg">
                    <QrCode className="h-24 w-24 text-white opacity-50" />
                  </div>
                  <Button
                    onClick={() => setShowQR(true)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Sacred QR
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Link Sharing */}
          <Card className="border border-white/10 shadow-xl bg-white/5 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-100">
                <Link className="h-5 w-5 text-blue-400" />
                Soul Connection Link
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                <p className="text-sm text-slate-300 break-all">{shareLink}</p>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={handleCopyLink}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {copied ? "Copied to Cosmos!" : "Copy Sacred Link"}
                </Button>

                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-emerald-400/30 text-emerald-300 hover:bg-emerald-400/10 bg-white/5"
                  >
                    WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-blue-400/30 text-blue-300 hover:bg-blue-400/10 bg-white/5"
                  >
                    iMessage
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-purple-400/30 text-purple-300 hover:bg-purple-400/10 bg-white/5"
                  >
                    Telegram
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Journey Completion Ritual */}
        <Card className="border border-white/10 shadow-2xl bg-white/5 backdrop-blur-xl">
          <CardContent className="text-center py-12">
            <div className="mb-8">
              <div className="relative inline-block">
                <Heart className="h-16 w-16 text-rose-400 mx-auto animate-pulse" />
                <div className="absolute inset-0 h-16 w-16 text-rose-400 animate-ping opacity-30">
                  <Heart className="h-16 w-16" />
                </div>
              </div>
              <h3 className="text-3xl font-bold mt-6 mb-4 bg-gradient-to-r from-rose-300 to-purple-300 bg-clip-text text-transparent">
                Your Sacred Journey is Complete
              </h3>
              <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
                The universe has blessed you with a path of wonder and transformation. May your travels awaken the
                deepest magic within your soul.
              </p>
            </div>

            <div className="space-y-6">
              <Badge className="px-6 py-2 text-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                <Sparkles className="h-4 w-4 mr-2" />
                Journey Oracle Complete
              </Badge>

              <p className="text-sm text-purple-200">✨ Your soul&#39;s adventure begins now ✨</p>

              {onCreateNew && (
                <div className="pt-4">
                  <Button
                    onClick={onCreateNew}
                    size="lg"
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    Create Another Journey
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
