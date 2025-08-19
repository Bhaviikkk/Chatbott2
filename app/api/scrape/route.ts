import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    const { spawn } = require("child_process")

    return new Promise((resolve) => {
      const python = spawn("python3", ["scripts/website_scraper.py"], {
        stdio: ["pipe", "pipe", "pipe"],
      })

      // Send URL to Python script
      python.stdin.write(JSON.stringify({ url }))
      python.stdin.end()

      let output = ""
      let error = ""

      python.stdout.on("data", (data: Buffer) => {
        output += data.toString()
      })

      python.stderr.on("data", (data: Buffer) => {
        error += data.toString()
      })

      python.on("close", (code: number) => {
        if (code === 0 && output) {
          try {
            const result = JSON.parse(output)
            resolve(NextResponse.json(result))
          } catch (parseError) {
            resolve(NextResponse.json({ error: "Failed to parse scraper output" }, { status: 500 }))
          }
        } else {
          resolve(NextResponse.json({ error: error || "Scraping failed" }, { status: 500 }))
        }
      })
    })
  } catch (error) {
    console.error("Scraping error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
