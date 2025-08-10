'use client'

import React, { useState, useEffect } from 'react'
import { Search, TrendingUp, MessageCircle, Filter, X, Send, Star, Command } from 'lucide-react'
import axios from 'axios'
import { ConnectButton } from "@rainbow-me/rainbowkit"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Event {
  id: string
  title: string
  description: string
  category: string
  endDate: string
  markets: Market[],
  image: string
}

interface Market {
  id: string
  question: string
  outcomePrices: number
  volume: number | string
}

interface TrendingEvent {
  id: string
  title: string
  volume24hr: string
  endDate: number
  image: string
  category: string
}

export default function Home() {
  const [events, setEvents] = useState<Event[]>([])
  const [trendingEvents, setTrendingEvents] = useState<TrendingEvent[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showChat, setShowChat] = useState(false)
  const [chatMessages, setChatMessages] = useState<Array<{role: string, content: string}>>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set())
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set())
  const [showPalette, setShowPalette] = useState(false)
  const [paletteQuery, setPaletteQuery] = useState('')

  useEffect(() => {
    fetchData()
  }, [searchQuery, selectedCategory])

  // load watchlist from localStorage once
  useEffect(() => {
    try {
      const raw = localStorage.getItem('watchlist')
      if (raw) setWatchlist(new Set(JSON.parse(raw)))
    } catch {}
  }, [])

  // persist watchlist
  useEffect(() => {
    try { localStorage.setItem('watchlist', JSON.stringify(Array.from(watchlist))) } catch {}
  }, [watchlist])

  // command palette hotkey
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setShowPalette((s) => !s)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const toggleWatchlist = (eventId: string) => {
    setWatchlist(prev => {
      const next = new Set(prev)
      if (next.has(eventId)) next.delete(eventId)
      else next.add(eventId)
      return next
    })
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch events
      const eventsParams = new URLSearchParams({
        limit: '50'
      })
      if (selectedCategory) eventsParams.append('category', selectedCategory)
      if (searchQuery) eventsParams.append('search', searchQuery)
      
      const eventsResponse = await axios.get(`http://localhost:8002/api/events?${eventsParams}`)
      setEvents(eventsResponse.data)

      // Fetch trending events
      const trendingResponse = await axios.get('http://localhost:8002/api/trending')
      setTrendingEvents(trendingResponse.data)

      // Fetch categories
      const categoriesResponse = await axios.get('http://localhost:8002/api/categories')
      setCategories(categoriesResponse.data)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAnalyzeEvent = async (event: Event) => {
    setSelectedEvent(event)
    setShowChat(true)
    setChatMessages([{
      role: 'assistant',
      content: `I'm ready to analyze "${event.title}". What would you like to know about this event?`
    }])
  }

  const toggleEventExpansion = (eventId: string) => {
    setExpandedEvents(prev => {
      const newSet = new Set(prev)
      if (newSet.has(eventId)) {
        newSet.delete(eventId)
      } else {
        newSet.add(eventId)
      }
      return newSet
    })
  }

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !selectedEvent) return

    const userMessage = { role: 'user', content: chatInput }
    setChatMessages(prev => [...prev, userMessage])
    setChatInput('')
    setChatLoading(true)

    try {
      const response = await axios.post('http://localhost:8002/api/chat', {
        event_id: selectedEvent.id,
        messages: [...chatMessages, userMessage]
      })
      console.log(response.data)

      const reply = typeof response.data === 'string' ? response.data : (response.data?.response ?? JSON.stringify(response.data))
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: reply
      }])
    } catch (error) {
      console.error('Error sending chat message:', error)
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }])
    } finally {
      setChatLoading(false)
    }
  }

  const formatVolume = (volume: number | string) => {
    const numVolume = typeof volume === 'string' ? parseFloat(volume) : volume
    if (numVolume >= 1000000) return `$${(numVolume / 1000000).toFixed(1)}M`
    if (numVolume >= 1000) return `$${(numVolume / 1000).toFixed(1)}K`
    return `$${numVolume.toFixed(0)}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Polymarket Terminal
              </h1>
              <p className="text-gray-700 mt-1 font-medium">Search and analyze prediction markets</p>
            </div>
            <div className="flex items-center space-x-6">
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600 bg-blue-50 px-4 py-2 rounded-full">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span className="font-medium">{trendingEvents.length} trending events</span>
              </div>
              <button
                onClick={() => setShowPalette(true)}
                className="hidden md:flex items-center space-x-2 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50"
                title="Command Palette (⌘/Ctrl+K)"
              >
                <Command className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-700">Command</span>
                <span className="ml-2 hidden lg:inline text-xs text-gray-500 border border-gray-200 rounded px-1">⌘K</span>
              </button>
              <ConnectButton chainStatus="icon" showBalance={false} accountStatus="address" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 bg-gray-50 focus:bg-white transition-all duration-200 shadow-sm"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Filter className="h-5 w-5 text-gray-500" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="border border-gray-200 rounded-xl px-4 py-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-gray-50 focus:bg-white shadow-sm transition-all duration-200 min-w-[160px]"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
              <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <h2 className="text-xl font-bold text-gray-900">
                  Events ({events.length})
                </h2>
              </div>
              
              {loading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {events.map((event) => (
                    <div key={event.id} className="p-8 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-start space-x-4">
                            {event.image && (
                              <img 
                                src={event.image} 
                                alt={event.title}
                                className="w-16 h-16 object-cover rounded-xl flex-shrink-0 shadow-md"
                              />
                            )}
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-gray-900 mb-2">
                                {event.title}
                              </h3>
                              <p className="text-sm text-gray-700 mb-4 line-clamp-2 leading-relaxed">
                                {event.description}
                              </p>
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <span className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                                  {event.category}
                                </span>
                                <span className="flex items-center space-x-1">
                                  <span>Ends: {formatDate(event.endDate)}</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <span>{event.markets.length} markets</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => toggleWatchlist(event.id)}
                            className={`p-2 rounded-lg border ${watchlist.has(event.id) ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200 hover:bg-gray-50'}`}
                            title={watchlist.has(event.id) ? 'Remove from Watchlist' : 'Add to Watchlist'}
                          >
                            <Star className={`h-5 w-5 ${watchlist.has(event.id) ? 'text-yellow-500 fill-yellow-400' : 'text-gray-500'}`} />
                          </button>
                          <button
                            onClick={() => handleAnalyzeEvent(event)}
                            className="ml-2 flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                          >
                            <MessageCircle className="h-4 w-4" />
                            <span className="font-medium">Analyze</span>
                          </button>
                        </div>
                      </div>
                      
                      {event.markets.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {(expandedEvents.has(event.id) ? event.markets : event.markets.slice(0, 3)).map((market) => (
                            <div key={market.id} className="flex justify-between items-center text-sm">
                              <span className="text-gray-700">{market.question}</span>
                              <div className="flex items-center space-x-4">
                                <span className="text-green-600 font-medium">
                                  {/* {(market.outcomePrices * 100).toFixed(1)}% */}
                                  {market.outcomePrices}
                                </span>
                                <span className="text-gray-500">
                                  {formatVolume(market.volume)}
                                </span>
                              </div>
                            </div>
                          ))}
                          {event.markets.length > 3 && (
                            <button
                              onClick={() => toggleEventExpansion(event.id)}
                              className="text-sm text-gray-500 hover:text-blue-600 transition-colors cursor-pointer hover:bg-blue-50 px-2 py-1 rounded-lg"
                            >
                              {expandedEvents.has(event.id) 
                                ? 'Show less markets' 
                                : `+${event.markets.length - 3} more markets`
                              }
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Watchlist */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <span>Watchlist</span>
                </h3>
                <span className="text-sm text-gray-500">{watchlist.size}</span>
              </div>
              <div className="divide-y divide-gray-100">
                {Array.from(watchlist).length === 0 && (
                  <div className="p-4 text-sm text-gray-500">No items yet. Star events to add them here.</div>
                )}
                {events.filter(e => watchlist.has(e.id)).map((e) => (
                  <div key={e.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="mr-3 min-w-0">
                        <div className="font-medium text-gray-900 line-clamp-2 text-sm">{e.title}</div>
                        <div className="text-xs text-gray-500 mt-1">Ends {formatDate(e.endDate)}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button onClick={() => handleAnalyzeEvent(e)} className="text-blue-600 text-sm hover:underline">Analyze</button>
                        <button onClick={() => toggleWatchlist(e.id)} className="text-gray-400 hover:text-gray-600" title="Remove">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trending Events */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
              <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-red-50">
                <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                  <span>Trending Events</span>
                </h3>
              </div>
              <div className="divide-y divide-gray-100">
                {trendingEvents.map((event) => (
                  <div key={event.id} className="p-5 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 transition-all duration-200">
                    <div className="flex items-start space-x-4">
                      {/* Event Image */}
                      {event.image && (
                        <img 
                          src={event.image} 
                          alt={event.title}
                          className="w-14 h-14 object-cover rounded-xl flex-shrink-0 shadow-md"
                        />
                      )}
                      
                      {/* Event Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 mb-2 line-clamp-2 text-sm">
                          {event.title}
                        </h4>
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                          <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full font-medium">
                            {event.category || 'General'}
                          </span>
                          <span className="font-bold text-green-600">
                            {formatVolume(event.volume24hr)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Ends: {formatDate(String(event.endDate))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Command Palette */}
      {showPalette && (
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm" onClick={() => setShowPalette(false)}>
          <div className="max-w-2xl mx-auto mt-24" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
              <div className="p-3 border-b border-gray-100 flex items-center space-x-2">
                <Search className="h-4 w-4 text-gray-500" />
                <input
                  autoFocus
                  value={paletteQuery}
                  onChange={(e) => setPaletteQuery(e.target.value)}
                  placeholder="Search events or type 'analyze'..."
                  className="w-full outline-none text-sm text-gray-900 placeholder-gray-500"
                />
                <button onClick={() => setShowPalette(false)} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {events
                  .filter(e => e.title.toLowerCase().includes(paletteQuery.toLowerCase()))
                  .slice(0, 12)
                  .map(e => (
                    <button
                      key={e.id}
                      onClick={() => { setShowPalette(false); handleAnalyzeEvent(e) }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between"
                    >
                      <span className="text-sm text-gray-900 line-clamp-1">{e.title}</span>
                      <span className="text-xs text-gray-500">Ends {formatDate(e.endDate)}</span>
                    </button>
                  ))}
                {events.length === 0 && (
                  <div className="px-4 py-6 text-sm text-gray-500">No events loaded.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {showChat && selectedEvent && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[750px] flex flex-col overflow-hidden border border-gray-200">
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-5">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <MessageCircle className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      Event Analysis
                    </h3>
                    <p className="text-gray-700 mt-1 font-medium">{selectedEvent.title}</p>
                    <div className="flex items-center space-x-4 mt-3">
                      <span className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        {selectedEvent.category}
                      </span>
                      <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                        Ends: {formatDate(selectedEvent.endDate)}
                      </span>
                      {selectedEvent.markets && (
                        <span className="text-sm text-gray-600 bg-green-100 text-green-800 px-3 py-1 rounded-full">
                          {selectedEvent.markets.length} markets
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowChat(false)}
                  className="text-gray-400 hover:text-gray-600 hover:bg-white/80 p-3 rounded-2xl transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white">
              {chatMessages.length === 0 && (
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <MessageCircle className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-3">How can I help you analyze this event?</h4>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Ask me anything about the markets, probabilities, or trading strategies for this prediction market.
                  </p>
                </div>
              )}
              
              {chatMessages.map((message, index) => (
                <div
                  key={index}
                  className={`flex items-start space-x-3 ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === 'user' 
                      ? 'bg-blue-600' 
                      : 'bg-gray-100'
                  }`}>
                    {message.role === 'user' ? (
                      <span className="text-white text-xs font-semibold">You</span>
                    ) : (
                      <MessageCircle className="h-4 w-4 text-gray-600" />
                    )}
                  </div>
                  
                  {/* Message Content */}
                  <div className="flex-1 max-w-none">
                    <div className={`text-sm font-medium mb-1 ${
                      message.role === 'user' ? 'text-right text-blue-600' : 'text-gray-900'
                    }`}>
                      {message.role === 'user' ? 'You' : 'Assistant'}
                    </div>
                    <div className={`prose prose-sm max-w-none ${
                      message.role === 'user' 
                        ? 'text-right' 
                        : 'text-left'
                    }`}>
                      {message.role === 'assistant' ? (
                        <div className="text-base leading-relaxed text-gray-900">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-base leading-relaxed text-gray-900 whitespace-pre-wrap">{message.content}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {chatLoading && (
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1 max-w-none">
                    <div className="text-sm font-medium mb-1 text-gray-900">Assistant</div>
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                      <span className="text-base text-gray-600">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Input Area */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage() } }}
                  placeholder="Message..."
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500 text-base"
                />
                <button
                  onClick={sendChatMessage}
                  disabled={!chatInput.trim() || chatLoading}
                  className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
