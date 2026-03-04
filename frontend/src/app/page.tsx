'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { VoiceRecorder } from '@/components/voice-recorder'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Mic, BarChart3, Users, BookOpen, Settings, RefreshCw, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface CropProblem {
  hindi_name: string
  symptoms: string
  symptoms_hi: string
}

interface CropInfo {
  hindi_name: string
  aliases: string[]
  problems: Record<string, CropProblem>
}

interface KnowledgeSummary {
  crops: Record<string, CropInfo>
  total_crops: number
  total_problems: number
  banned_substances: string[]
}

interface Analytics {
  total_queries: number
  queries_today: number
  queries_this_week: number
  resolution_rate: number
  avg_response_time: number
  outcomes: { resolved: number; no_crop: number; no_problem: number; emergency: number; error: number }
  top_crops: Record<string, number>
  top_problems: Record<string, number>
  language_split: { hindi: number; english: number }
  recent_queries: Array<{ timestamp: string; transcript: string; crop: string; problem: string; outcome: string; language: string; response_time_s: number }>
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('voice')
  const [knowledge, setKnowledge] = useState<KnowledgeSummary | null>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loadingKB, setLoadingKB] = useState(false)
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)

  const fetchKnowledge = async () => {
    setLoadingKB(true)
    try {
      const res = await fetch(`${API_URL}/knowledge/summary`)
      setKnowledge(await res.json())
    } catch (e) { console.error('Failed to fetch knowledge:', e) }
    finally { setLoadingKB(false) }
  }

  const fetchAnalytics = async () => {
    setLoadingAnalytics(true)
    try {
      const res = await fetch(`${API_URL}/analytics`)
      setAnalytics(await res.json())
    } catch (e) { console.error('Failed to fetch analytics:', e) }
    finally { setLoadingAnalytics(false) }
  }

  useEffect(() => {
    if (activeTab === 'knowledge' && !knowledge) fetchKnowledge()
    if (activeTab === 'analytics') fetchAnalytics()
  }, [activeTab])

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">V</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-green-800">VillageAI</h1>
                <p className="text-xs text-gray-600">कृषि मित्र</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Voice-First Agricultural Assistant
            </h2>
            <p className="text-lg text-gray-600">
              घर बैठे, अपनी भाषा में, मुफ्त कृषि सलाह
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="voice" className="flex items-center gap-2">
                <Mic className="w-4 h-4" />
                Voice Assistant
              </TabsTrigger>
              <TabsTrigger value="knowledge" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Crops & Diseases
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Analytics
              </TabsTrigger>
            </TabsList>

            {/* Voice Tab */}
            <TabsContent value="voice" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Voice Query Interface</CardTitle>
                  <CardDescription>
                    Ask about crop problems in Hindi or English
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <VoiceRecorder />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Knowledge Base Tab */}
            <TabsContent value="knowledge" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Supported Crops & Diseases</CardTitle>
                      <CardDescription>
                        {knowledge
                          ? `${knowledge.total_crops} crops, ${knowledge.total_problems} diseases/pests covered`
                          : 'Loading knowledge base...'}
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchKnowledge} disabled={loadingKB}>
                      <RefreshCw className={`w-4 h-4 mr-1 ${loadingKB ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {knowledge ? (
                    <div className="space-y-4">
                      {Object.entries(knowledge.crops).map(([cropKey, crop]) => (
                        <div key={cropKey} className="p-4 border rounded-lg">
                          <h3 className="font-semibold text-lg mb-1 capitalize">
                            {cropKey} ({crop.hindi_name})
                          </h3>
                          <p className="text-xs text-gray-500 mb-3">
                            Aliases: {crop.aliases.join(', ')}
                          </p>
                          <div className="grid gap-2 md:grid-cols-2">
                            {Object.entries(crop.problems).map(([probKey, prob]) => (
                              <div key={probKey} className="p-3 bg-gray-50 rounded border-l-4 border-orange-400">
                                <p className="font-medium text-sm capitalize">
                                  {probKey.replace(/_/g, ' ')} - {prob.hindi_name}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">{prob.symptoms}</p>
                                {prob.symptoms_hi && (
                                  <p className="text-xs text-gray-500 mt-1">{prob.symptoms_hi}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}

                      {knowledge.banned_substances.length > 0 && (
                        <div className="p-4 border rounded-lg border-red-200 bg-red-50">
                          <h3 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Banned Substances
                          </h3>
                          <p className="text-sm text-red-600">
                            {knowledge.banned_substances.join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">Loading...</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="flex justify-end mb-2">
                <Button variant="outline" size="sm" onClick={fetchAnalytics} disabled={loadingAnalytics}>
                  <RefreshCw className={`w-4 h-4 mr-1 ${loadingAnalytics ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
                    <Mic className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics?.total_queries ?? 0}</div>
                    <p className="text-xs text-muted-foreground">Today: {analytics?.queries_today ?? 0} | This week: {analytics?.queries_this_week ?? 0}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics?.resolution_rate ?? 0}%</div>
                    <p className="text-xs text-muted-foreground">Resolved: {analytics?.outcomes?.resolved ?? 0}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics?.avg_response_time ?? 0}s</div>
                    <p className="text-xs text-muted-foreground">End-to-end processing</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Language Split</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {analytics?.language_split ? `${analytics.language_split.hindi}H / ${analytics.language_split.english}E` : '0/0'}
                    </div>
                    <p className="text-xs text-muted-foreground">Hindi / English queries</p>
                  </CardContent>
                </Card>
              </div>

              {/* Outcome Breakdown + Top Crops */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Query Outcomes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analytics?.outcomes ? (
                      <div className="space-y-2">
                        {[
                          { label: 'Resolved', value: analytics.outcomes.resolved, color: 'bg-green-500' },
                          { label: 'Crop Not Found', value: analytics.outcomes.no_crop, color: 'bg-yellow-500' },
                          { label: 'Problem Not Found', value: analytics.outcomes.no_problem, color: 'bg-orange-500' },
                          { label: 'Emergency', value: analytics.outcomes.emergency, color: 'bg-red-500' },
                          { label: 'Error', value: analytics.outcomes.error, color: 'bg-gray-500' },
                        ].map(item => {
                          const total = analytics.total_queries || 1
                          const pct = Math.round((item.value / total) * 100)
                          return (
                            <div key={item.label} className="flex items-center gap-2">
                              <span className="text-xs w-32 text-gray-600">{item.label}</span>
                              <div className="flex-1 bg-gray-100 rounded-full h-3">
                                <div className={`${item.color} h-3 rounded-full`} style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-xs font-medium w-12 text-right">{item.value}</span>
                            </div>
                          )
                        })}
                      </div>
                    ) : <p className="text-gray-500 text-sm">No data yet</p>}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Most Asked Crops</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analytics?.top_crops && Object.keys(analytics.top_crops).length > 0 ? (
                      <div className="space-y-2">
                        {Object.entries(analytics.top_crops).map(([crop, count]) => (
                          <div key={crop} className="flex items-center justify-between">
                            <span className="text-sm capitalize">{crop}</span>
                            <span className="text-sm font-bold text-green-700">{count}</span>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-gray-500 text-sm">No data yet</p>}
                  </CardContent>
                </Card>
              </div>

              {/* Recent Queries */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Recent Queries</CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics?.recent_queries && analytics.recent_queries.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-gray-500">
                            <th className="pb-2 pr-4">Time</th>
                            <th className="pb-2 pr-4">Transcript</th>
                            <th className="pb-2 pr-4">Crop</th>
                            <th className="pb-2 pr-4">Problem</th>
                            <th className="pb-2 pr-4">Outcome</th>
                            <th className="pb-2">Speed</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.recent_queries.map((q, i) => (
                            <tr key={i} className="border-b last:border-0">
                              <td className="py-2 pr-4 text-xs text-gray-500 whitespace-nowrap">
                                {new Date(q.timestamp + 'Z').toLocaleTimeString()}
                              </td>
                              <td className="py-2 pr-4 max-w-[200px] truncate">{q.transcript || '-'}</td>
                              <td className="py-2 pr-4 capitalize">{q.crop || '-'}</td>
                              <td className="py-2 pr-4 capitalize">{q.problem?.replace(/_/g, ' ') || '-'}</td>
                              <td className="py-2 pr-4">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  q.outcome === 'resolved' ? 'bg-green-100 text-green-700' :
                                  q.outcome === 'emergency' ? 'bg-red-100 text-red-700' :
                                  q.outcome === 'no_crop' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {q.outcome}
                                </span>
                              </td>
                              <td className="py-2 text-xs">{q.response_time_s}s</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : <p className="text-gray-500 text-sm text-center py-4">No queries recorded yet. Try the Voice Assistant!</p>}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}