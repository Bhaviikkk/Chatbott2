import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function POST(request: NextRequest) {
  try {
    const { message, websiteData, conversationHistory } = await request.json()

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 })
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    let systemPrompt = `You are an intelligent chatbot assistant for a specific website. Your role is to answer questions ONLY about the website and its content that has been provided to you.

STRICT RULES:
1. ONLY answer questions related to the website content provided
2. If a question is not related to the website, politely decline and redirect to website topics
3. Use the website data to provide accurate, helpful responses
4. Be conversational but professional
5. If you don't have enough information from the website data, say so clearly

`

    if (websiteData && websiteData.status === "success") {
      systemPrompt += `WEBSITE INFORMATION:
Website: ${websiteData.url}
Title: ${websiteData.metadata?.title || "N/A"}
Description: ${websiteData.metadata?.description || "N/A"}

WEBSITE CONTENT:
${websiteData.content?.text_content || "No content available"}

WEBSITE STRUCTURE:
Headings: ${websiteData.content?.headings?.map((h: any) => `H${h.level}: ${h.text}`).join(", ") || "None"}

Navigation: ${websiteData.navigation?.map((nav: any) => nav.text).join(", ") || "None"}
`
    } else {
      systemPrompt += `No website data has been provided yet. Please ask the user to provide a website URL first before you can answer questions about any website.`
    }

    let conversationContext = ""
    if (conversationHistory && conversationHistory.length > 0) {
      conversationContext = "\nPREVIOUS CONVERSATION:\n"
      conversationHistory.slice(-6).forEach((msg: any) => {
        conversationContext += `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}\n`
      })
    }

    const fullPrompt = `${systemPrompt}${conversationContext}

Current User Question: ${message}

Please respond according to the rules above. If the question is not related to the website content, politely decline and suggest asking about the website instead.`

    const result = await model.generateContent(fullPrompt)
    const response = await result.response
    const text = response.text()

    return NextResponse.json({
      response: text,
      hasWebsiteContext: websiteData && websiteData.status === "success",
    })
  } catch (error) {
    console.error("Chat context error:", error)
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 })
  }
}
