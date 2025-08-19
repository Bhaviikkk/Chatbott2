import { DraggableChatbot } from "@/components/draggable-chatbot"

export default function Home() {
  return (
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">Welcome to Your AI Assistant</h1>
        <p className="text-lg text-muted-foreground text-center mb-12">
          Click the AI button in the bottom-right corner to start chatting with your intelligent assistant.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 border rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Smart Conversations</h3>
            <p className="text-muted-foreground">
              Engage in natural conversations with our AI assistant powered by Google Gemini.
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Website Analysis</h3>
            <p className="text-muted-foreground">
              Load any website and get intelligent answers about its content and features.
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Draggable Interface</h3>
            <p className="text-muted-foreground">
              Move the chat window anywhere on your screen for the perfect positioning.
            </p>
          </div>
        </div>
      </div>

      <DraggableChatbot />
    </main>
  )
}
