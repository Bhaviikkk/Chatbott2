"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { IconRobot, IconX, IconSend, IconGripVertical, IconWorld, IconLoader } from "@tabler/icons-react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
}

interface Position {
  x: number
  y: number
}

interface WebsiteContext {
  url: string
  status: string
  metadata?: {
    title: string
    description: string
    domain: string
  }
  content?: {
    text_content: string
    headings: Array<{ level: number; text: string }>
  }
  navigation?: Array<{ text: string; href: string }>
  scraped_at: number
}

export function DraggableChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 })

  const [websiteUrl, setWebsiteUrl] = useState("")
  const [websiteContext, setWebsiteContext] = useState<WebsiteContext | null>(null)
  const [isScrapingWebsite, setIsScrapingWebsite] = useState(false)
  const [showUrlInput, setShowUrlInput] = useState(false)

  const chatbotRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const updatePosition = () => {
      if (!isOpen) {
        setPosition({
          x: window.innerWidth - 80,
          y: window.innerHeight - 80,
        })
      }
    }

    updatePosition()
    window.addEventListener("resize", updatePosition)
    return () => window.removeEventListener("resize", updatePosition)
  }, [isOpen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return

      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, dragOffset])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!chatbotRef.current) return

    const rect = chatbotRef.current.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
    setIsDragging(true)
  }

  const scrapeWebsite = async () => {
    if (!websiteUrl.trim() || isScrapingWebsite) return

    setIsScrapingWebsite(true)
    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: websiteUrl.trim() }),
      })

      if (!response.ok) {
        throw new Error("Failed to scrape website")
      }

      const data = await response.json()

      if (data.status === "success") {
        setWebsiteContext(data)
        setShowUrlInput(false)

        const systemMessage: Message = {
          id: Date.now().toString(),
          content: `✅ Successfully loaded website: ${data.metadata?.title || data.url}\n\nI can now answer questions about this website. What would you like to know?`,
          role: "assistant",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, systemMessage])
      } else {
        throw new Error(data.error || "Failed to scrape website")
      }
    } catch (error) {
      console.error("Error scraping website:", error)
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: `❌ Failed to load website: ${error instanceof Error ? error.message : "Unknown error"}. Please check the URL and try again.`,
        role: "assistant",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsScrapingWebsite(false)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat-context", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.content,
          websiteData: websiteContext,
          conversationHistory: messages.slice(-10),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: "assistant",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error sending message:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I encountered an error. Please make sure your Gemini API key is configured.",
        role: "assistant",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleUrlKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      scrapeWebsite()
    }
  }

  if (!isOpen) {
    return (
      <div
        ref={chatbotRef}
        className="fixed z-50 cursor-move"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
        onMouseDown={handleMouseDown}
      >
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full w-16 h-16 shadow-lg hover:shadow-xl transition-all duration-200 bg-primary hover:bg-primary/90"
        >
          <IconRobot className="w-8 h-8" />
        </Button>
      </div>
    )
  }

  return (
    <div
      ref={chatbotRef}
      className="fixed z-50 w-96 h-[600px] cursor-move"
      style={{
        left: `${Math.max(0, Math.min(position.x, window.innerWidth - 384))}px`,
        top: `${Math.max(0, Math.min(position.y, window.innerHeight - 600))}px`,
      }}
    >
      <Card className="w-full h-full flex flex-col shadow-2xl border-2">
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground rounded-t-lg cursor-move"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2">
            <IconRobot className="w-5 h-5" />
            <span className="font-semibold">AI Website Assistant</span>
          </div>
          <div className="flex items-center gap-2">
            <IconGripVertical className="w-4 h-4 opacity-70" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-primary-foreground hover:bg-primary-foreground/20 h-8 w-8 p-0"
            >
              <IconX className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Website Context Display */}
        {websiteContext && (
          <div className="px-4 py-2 bg-muted/50 border-b text-xs">
            <div className="flex items-center gap-2">
              <IconWorld className="w-3 h-3 text-green-600" />
              <span className="font-medium text-green-700">Connected to:</span>
              <span className="truncate">{websiteContext.metadata?.title || websiteContext.url}</span>
            </div>
          </div>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <IconRobot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">Hello! I'm your AI Website Assistant.</p>
                <p className="text-sm mb-4">I can help you with questions about any website.</p>

                {!websiteContext && (
                  <div className="mt-4 space-y-2">
                    <Button
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      <IconWorld className="w-3 h-3 mr-1" />
                      Load Website
                    </Button>

                    {showUrlInput && (
                      <div className="flex gap-2 mt-2">
                        <Input
                          value={websiteUrl}
                          onChange={(e) => setWebsiteUrl(e.target.value)}
                          onKeyPress={handleUrlKeyPress}
                          placeholder="Enter website URL..."
                          disabled={isScrapingWebsite}
                          className="text-xs h-8"
                        />
                        <Button
                          onClick={scrapeWebsite}
                          disabled={!websiteUrl.trim() || isScrapingWebsite}
                          size="sm"
                          className="h-8 px-2"
                        >
                          {isScrapingWebsite ? (
                            <IconLoader className="w-3 h-3 animate-spin" />
                          ) : (
                            <IconSend className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={cn("flex gap-3 max-w-[85%]", message.role === "user" ? "ml-auto" : "mr-auto")}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <IconRobot className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}

                <div
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
                    message.role === "user" ? "bg-primary text-primary-foreground ml-auto" : "bg-muted",
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <IconRobot className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="bg-muted rounded-lg px-3 py-2 text-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                    <div
                      className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    />
                    <div
                      className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t space-y-2">
          {!websiteContext && (
            <div className="flex gap-2">
              <Input
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                onKeyPress={handleUrlKeyPress}
                placeholder="Enter website URL to get started..."
                disabled={isScrapingWebsite}
                className="flex-1 text-xs h-8"
              />
              <Button
                onClick={scrapeWebsite}
                disabled={!websiteUrl.trim() || isScrapingWebsite}
                size="sm"
                className="h-8 px-3"
              >
                {isScrapingWebsite ? (
                  <IconLoader className="w-3 h-3 animate-spin" />
                ) : (
                  <IconWorld className="w-3 h-3" />
                )}
              </Button>
            </div>
          )}

          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={websiteContext ? "Ask about this website..." : "Load a website first..."}
              disabled={isLoading}
              className="flex-1"
            />
            <Button onClick={sendMessage} disabled={!input.trim() || isLoading} size="sm" className="px-3">
              <IconSend className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
