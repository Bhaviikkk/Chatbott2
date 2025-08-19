;(() => {
  // Configuration - Update these URLs to your deployed API
  const CHATBOT_CONFIG = {
    apiBase: window.location.origin, // Auto-detect or set manually: 'https://your-domain.vercel.app'
    primaryColor: "#2563eb",
    position: "bottom-right", // bottom-right, bottom-left, top-right, top-left
    offset: { x: 20, y: 20 },
    zIndex: 10000,
  }

  // Prevent multiple instances
  if (window.AIChatbotEmbedded) return
  window.AIChatbotEmbedded = true

  class EmbeddedChatbot {
    constructor() {
      this.websiteContext = null
      this.messages = []
      this.isLoading = false
      this.isDragging = false
      this.dragOffset = { x: 0, y: 0 }

      this.injectStyles()
      this.createChatbot()
      this.attachEventListeners()
    }

    injectStyles() {
      const style = document.createElement("style")
      style.textContent = `
                .ai-chatbot-embed * { box-sizing: border-box; }
                .ai-chatbot-embed { 
                    position: fixed; 
                    z-index: ${CHATBOT_CONFIG.zIndex}; 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    font-size: 14px;
                    color: #0f172a;
                }
                .ai-chatbot-button { 
                    width: 64px; height: 64px; border-radius: 50%; 
                    background: ${CHATBOT_CONFIG.primaryColor}; color: white; 
                    border: none; cursor: pointer; display: flex; 
                    align-items: center; justify-content: center; 
                    box-shadow: 0 10px 25px rgba(0,0,0,0.15); 
                    transition: all 0.2s ease; user-select: none;
                }
                .ai-chatbot-button:hover { transform: scale(1.05); }
                .ai-chatbot-window { 
                    width: 384px; height: 600px; background: white; 
                    border: 2px solid #e2e8f0; border-radius: 12px; 
                    box-shadow: 0 25px 50px rgba(0,0,0,0.15); 
                    display: none; flex-direction: column; overflow: hidden;
                }
                .ai-chatbot-window.show { display: flex; }
                .ai-chatbot-header { 
                    background: ${CHATBOT_CONFIG.primaryColor}; color: white; 
                    padding: 16px; display: flex; align-items: center; 
                    justify-content: space-between; cursor: move; user-select: none;
                }
                .ai-chatbot-messages { 
                    flex: 1; overflow-y: auto; padding: 16px; 
                    display: flex; flex-direction: column; gap: 16px;
                }
                .ai-chatbot-input { 
                    border-top: 1px solid #e2e8f0; padding: 16px; 
                    display: flex; flex-direction: column; gap: 12px;
                }
                .ai-chatbot-input input { 
                    flex: 1; padding: 8px 12px; border: 1px solid #e2e8f0; 
                    border-radius: 6px; outline: none;
                }
                .ai-chatbot-input button { 
                    padding: 8px 12px; background: ${CHATBOT_CONFIG.primaryColor}; 
                    color: white; border: none; border-radius: 6px; cursor: pointer;
                }
                .ai-message { display: flex; gap: 12px; max-width: 85%; }
                .ai-message.user { margin-left: auto; flex-direction: row-reverse; }
                .ai-message-content { 
                    background: #f1f5f9; padding: 12px 16px; 
                    border-radius: 12px; white-space: pre-wrap;
                }
                .ai-message.user .ai-message-content { 
                    background: ${CHATBOT_CONFIG.primaryColor}; color: white;
                }
                .hidden { display: none !important; }
            `
      document.head.appendChild(style)
    }

    createChatbot() {
      const container = document.createElement("div")
      container.className = "ai-chatbot-embed"
      container.innerHTML = `
                <button class="ai-chatbot-button" id="ai-chatbot-toggle">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 8V4H8"/>
                        <rect width="16" height="12" x="4" y="8" rx="2"/>
                        <path d="M2 14h2"/>
                        <path d="M20 14h2"/>
                        <path d="M15 13v2"/>
                        <path d="M9 13v2"/>
                    </svg>
                </button>
                <div class="ai-chatbot-window" id="ai-chatbot-window">
                    <div class="ai-chatbot-header" id="ai-chatbot-header">
                        <span>AI Website Assistant</span>
                        <button id="ai-chatbot-close" style="background:transparent;border:none;color:white;cursor:pointer;">✕</button>
                    </div>
                    <div class="ai-chatbot-messages" id="ai-chatbot-messages">
                        <div style="text-align:center;padding:32px;color:#64748b;">
                            <p><strong>Hello! I'm your AI Website Assistant.</strong></p>
                            <p>Enter a website URL below to get started.</p>
                        </div>
                    </div>
                    <div class="ai-chatbot-input">
                        <div style="display:flex;gap:8px;">
                            <input type="text" id="ai-website-url" placeholder="Enter website URL...">
                            <button id="ai-load-website">Load</button>
                        </div>
                        <div style="display:flex;gap:8px;">
                            <input type="text" id="ai-message-input" placeholder="Ask about the website..." disabled>
                            <button id="ai-send-message" disabled>Send</button>
                        </div>
                    </div>
                </div>
            `

      // Position the chatbot
      this.positionChatbot(container)
      document.body.appendChild(container)

      // Store references
      this.container = container
      this.toggleButton = container.querySelector("#ai-chatbot-toggle")
      this.window = container.querySelector("#ai-chatbot-window")
      this.header = container.querySelector("#ai-chatbot-header")
      this.closeButton = container.querySelector("#ai-chatbot-close")
      this.messagesContainer = container.querySelector("#ai-chatbot-messages")
      this.websiteUrlInput = container.querySelector("#ai-website-url")
      this.loadWebsiteButton = container.querySelector("#ai-load-website")
      this.messageInput = container.querySelector("#ai-message-input")
      this.sendButton = container.querySelector("#ai-send-message")
    }

    positionChatbot(container) {
      const positions = {
        "bottom-right": { right: `${CHATBOT_CONFIG.offset.x}px`, bottom: `${CHATBOT_CONFIG.offset.y}px` },
        "bottom-left": { left: `${CHATBOT_CONFIG.offset.x}px`, bottom: `${CHATBOT_CONFIG.offset.y}px` },
        "top-right": { right: `${CHATBOT_CONFIG.offset.x}px`, top: `${CHATBOT_CONFIG.offset.y}px` },
        "top-left": { left: `${CHATBOT_CONFIG.offset.x}px`, top: `${CHATBOT_CONFIG.offset.y}px` },
      }

      const pos = positions[CHATBOT_CONFIG.position] || positions["bottom-right"]
      Object.assign(container.style, pos)
    }

    attachEventListeners() {
      this.toggleButton.addEventListener("click", () => this.toggleChatbot())
      this.closeButton.addEventListener("click", () => this.closeChatbot())
      this.loadWebsiteButton.addEventListener("click", () => this.loadWebsite())
      this.sendButton.addEventListener("click", () => this.sendMessage())

      this.websiteUrlInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") this.loadWebsite()
      })

      this.messageInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") this.sendMessage()
      })

      // Dragging
      this.header.addEventListener("mousedown", (e) => this.startDragging(e))
      document.addEventListener("mousemove", (e) => this.drag(e))
      document.addEventListener("mouseup", () => this.stopDragging())
    }

    toggleChatbot() {
      this.window.classList.toggle("show")
      this.toggleButton.style.display = this.window.classList.contains("show") ? "none" : "flex"
    }

    closeChatbot() {
      this.window.classList.remove("show")
      this.toggleButton.style.display = "flex"
    }

    startDragging(e) {
      this.isDragging = true
      const rect = this.container.getBoundingClientRect()
      this.dragOffset = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    drag(e) {
      if (!this.isDragging) return
      const x = e.clientX - this.dragOffset.x
      const y = e.clientY - this.dragOffset.y
      this.container.style.left = Math.max(0, x) + "px"
      this.container.style.top = Math.max(0, y) + "px"
      this.container.style.right = "auto"
      this.container.style.bottom = "auto"
    }

    stopDragging() {
      this.isDragging = false
    }

    async loadWebsite() {
      const url = this.websiteUrlInput.value.trim()
      if (!url || this.isLoading) return

      this.setLoading(true)
      try {
        const response = await fetch(`${CHATBOT_CONFIG.apiBase}/api/scrape`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        })

        const data = await response.json()
        if (data.status === "success") {
          this.websiteContext = data
          this.enableChat()
          this.addMessage(
            "assistant",
            `✅ Successfully loaded: ${data.metadata?.title || data.url}\n\nWhat would you like to know about this website?`,
          )
        } else {
          throw new Error(data.error || "Failed to load website")
        }
      } catch (error) {
        this.addMessage("assistant", `❌ Failed to load website: ${error.message}`)
      } finally {
        this.setLoading(false)
      }
    }

    async sendMessage() {
      const message = this.messageInput.value.trim()
      if (!message || this.isLoading) return

      this.addMessage("user", message)
      this.messageInput.value = ""
      this.setLoading(true)

      try {
        const response = await fetch(`${CHATBOT_CONFIG.apiBase}/api/chat-context`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            websiteData: this.websiteContext,
            conversationHistory: this.messages.slice(-10),
          }),
        })

        const data = await response.json()
        this.addMessage("assistant", data.response)
      } catch (error) {
        this.addMessage("assistant", "Sorry, I encountered an error. Please try again.")
      } finally {
        this.setLoading(false)
      }
    }

    addMessage(role, content) {
      const message = { role, content, timestamp: new Date() }
      this.messages.push(message)

      // Clear empty state
      const emptyState = this.messagesContainer.querySelector('div[style*="text-align:center"]')
      if (emptyState) emptyState.remove()

      const messageEl = document.createElement("div")
      messageEl.className = `ai-message ${role}`
      messageEl.innerHTML = `<div class="ai-message-content">${this.escapeHtml(content)}</div>`

      this.messagesContainer.appendChild(messageEl)
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight
    }

    enableChat() {
      this.messageInput.disabled = false
      this.sendButton.disabled = false
      this.messageInput.placeholder = "Ask about this website..."
    }

    setLoading(loading) {
      this.isLoading = loading
      this.loadWebsiteButton.disabled = loading
      this.sendButton.disabled = loading
    }

    escapeHtml(text) {
      const div = document.createElement("div")
      div.textContent = text
      return div.innerHTML
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => new EmbeddedChatbot())
  } else {
    new EmbeddedChatbot()
  }
})()
