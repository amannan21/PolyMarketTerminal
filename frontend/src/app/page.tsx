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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Polymarket Terminal</h1>
              <p className="text-gray-600">Search and analyze prediction markets</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <TrendingUp className="h-4 w-4" />
                <span>{trendingEvents.length} trending events</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Events ({events.length})
                </h2>
              </div>
              
              {loading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {events.map((event) => (
                    <div key={event.id} className="p-6 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {event.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {event.description}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {event.category}
                            </span>
                            <span>Ends: {formatDate(event.endDate)}</span>
                            <span>{event.markets.length} markets</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAnalyzeEvent(event)}
                          className="ml-4 flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <MessageCircle className="h-4 w-4" />
                          <span>Analyze</span>
                        </button>
                      </div>
                      
                      {event.markets.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {event.markets.slice(0, 3).map((market) => (
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
                            <div className="text-sm text-gray-500">
                              +{event.markets.length - 3} more markets
                            </div>
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
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Trending Events</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {trendingEvents.map((event) => (
                  <div key={event.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start space-x-3">
                      {/* Event Image */}
                      {event.image && (
                        <img 
                          src={event.image} 
                          alt={event.title}
                          className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                        />
                      )}
                      
                      {/* Event Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">
                          {event.title}
                        </h4>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>{event.category || 'General'}</span>
                          <span>{formatVolume(event.volume24hr)}</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-[600px] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Analyze Event</h3>
                <p className="text-sm text-gray-600">{selectedEvent.title}</p>
              </div>
              <button
                onClick={() => setShowChat(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {chatMessages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                      <span>Analyzing...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                  placeholder="Ask about this event..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={sendChatMessage}
                  disabled={!chatInput.trim() || chatLoading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
