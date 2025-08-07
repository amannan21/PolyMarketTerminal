'use client'

import React, { useState, useEffect } from 'react'
import { Search, TrendingUp, MessageCircle, Filter, X, Send } from 'lucide-react'
import axios from 'axios'

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

  useEffect(() => {
    fetchData()
  }, [searchQuery, selectedCategory])

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

      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: response.data.response
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
              <div className="flex items-center space-x-2 text-sm text-gray-600 bg-blue-50 px-4 py-2 rounded-full">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span className="font-medium">{trendingEvents.length} trending events</span>
              </div>
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
                        <button
                          onClick={() => handleAnalyzeEvent(event)}
                          className="ml-6 flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                          <MessageCircle className="h-4 w-4" />
                          <span className="font-medium">Analyze</span>
                        </button>
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
            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-gradient-to-br from-gray-50 to-blue-50/30">
              {chatMessages.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <MessageCircle className="h-10 w-10 text-blue-600" />
                  </div>
                  <h4 className="text-2xl font-bold text-gray-900 mb-3">Start Your Analysis</h4>
                  <p className="text-gray-600 max-w-lg mx-auto text-lg leading-relaxed">
                    Ask me anything about this event. I can help you understand the markets, analyze probabilities, and provide insights.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 max-w-2xl mx-auto">
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200 shadow-sm">
                      <h5 className="font-semibold text-gray-900 mb-2">Market Analysis</h5>
                      <p className="text-sm text-gray-600">Get insights on probability trends and market sentiment</p>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200 shadow-sm">
                      <h5 className="font-semibold text-gray-900 mb-2">Risk Assessment</h5>
                      <p className="text-sm text-gray-600">Understand potential outcomes and risk factors</p>
                    </div>
                  </div>
                </div>
              )}
              
              {chatMessages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-4 max-w-3xl ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md ${
                      message.role === 'user' 
                        ? 'bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600' 
                        : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
                    }`}>
                      {message.role === 'user' ? (
                        <span className="text-white text-sm font-bold">U</span>
                      ) : (
                        <MessageCircle className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    
                    {/* Message Bubble */}
                    <div
                      className={`px-6 py-4 rounded-2xl shadow-lg backdrop-blur-sm ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 text-white'
                          : 'bg-white/90 text-gray-900 border border-gray-200'
                      }`}
                    >
                      <p className="text-sm leading-relaxed font-medium">{message.content}</p>
                    </div>
                  </div>
                </div>
              ))}
              
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-4 max-w-3xl">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-white to-gray-50 border border-gray-200 flex items-center justify-center flex-shrink-0 shadow-md">
                      <MessageCircle className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="bg-white/90 text-gray-900 px-6 py-4 rounded-2xl shadow-lg border border-gray-200 backdrop-blur-sm">
                      <div className="flex items-center space-x-3">
                        <div className="flex space-x-1">
                          <div className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce"></div>
                          <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2.5 h-2.5 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                        <span className="text-sm text-gray-700 font-medium">Analyzing your question...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Input Area */}
            <div className="px-8 py-6 border-t border-gray-100 bg-gradient-to-r from-white to-gray-50">
              <div className="flex space-x-4">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                    placeholder="Ask about this event..."
                    className="w-full border border-gray-200 rounded-2xl px-6 py-4 pr-14 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white focus:bg-white transition-all duration-200 text-gray-900 placeholder-gray-500 shadow-sm focus:shadow-md"
                  />
                  <button
                    onClick={sendChatMessage}
                    disabled={!chatInput.trim() || chatLoading}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 text-white p-2.5 rounded-xl hover:from-blue-600 hover:via-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Press <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Enter</kbd> to send
                </div>
                <div className="text-xs text-gray-400">
                  Ask about markets, probabilities, or insights
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
