import { type NextRequest, NextResponse } from "next/server"
import * as cheerio from "cheerio"

interface NavigationItem {
  text: string
  href: string
}

interface HeadingItem {
  level: string
  text: string
}

interface ImageItem {
  src: string
  alt: string
}

interface ScrapedData {
  url: string
  title: string
  description: string
  keywords: string
  author: string
  siteName: string
  content: string
  navigation: NavigationItem[]
  headings: HeadingItem[]
  images: ImageItem[]
  wordCount: number
  scrapedAt: string
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    let normalizedUrl: string
    try {
      const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`)
      normalizedUrl = urlObj.toString()
    } catch (urlError) {
      console.log("[v0] Invalid URL format:", url)
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
    }

    console.log("[v0] Attempting to scrape:", normalizedUrl)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

    const response = await fetch(normalizedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        DNT: "1",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.log("[v0] Fetch failed with status:", response.status, response.statusText)
      return NextResponse.json(
        {
          error: `Failed to fetch URL: ${response.status} ${response.statusText}. The website might be blocking requests or temporarily unavailable.`,
        },
        { status: 400 },
      )
    }

    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("text/html")) {
      console.log("[v0] Non-HTML content type:", contentType)
      return NextResponse.json(
        {
          error: "URL does not return HTML content. Please provide a valid webpage URL.",
        },
        { status: 400 },
      )
    }

    console.log("[v0] Successfully fetched HTML, parsing with Cheerio...")
    const html = await response.text()

    if (!html || html.length < 100) {
      console.log("[v0] HTML content too short or empty")
      return NextResponse.json(
        {
          error: "Website returned empty or invalid content",
        },
        { status: 400 },
      )
    }

    const $ = cheerio.load(html)

    // Extract metadata
    const title = $("title").text().trim() || $("h1").first().text().trim() || "No title found"
    const description =
      $('meta[name="description"]').attr("content") ||
      $('meta[property="og:description"]').attr("content") ||
      $("p").first().text().trim().substring(0, 200) ||
      "No description found"

    const keywords = $('meta[name="keywords"]').attr("content") || ""
    const author = $('meta[name="author"]').attr("content") || ""
    const siteName = $('meta[property="og:site_name"]').attr("content") || ""

    // Extract main content
    const contentSelectors = [
      "main",
      "article",
      ".content",
      "#content",
      ".main-content",
      ".post-content",
      ".entry-content",
      ".page-content",
    ]

    let mainContent = ""
    for (const selector of contentSelectors) {
      const element = $(selector)
      if (element.length > 0) {
        mainContent = element.text().trim()
        break
      }
    }

    // Fallback to body content if no main content found
    if (!mainContent) {
      $("script, style, nav, header, footer, aside").remove()
      mainContent = $("body").text().trim()
    }

    // Clean and limit content
    mainContent = mainContent.replace(/\s+/g, " ").replace(/\n+/g, "\n").trim().substring(0, 5000) // Limit to 5000 characters

    // Extract navigation and links
    const navigation: NavigationItem[] = []
    $("nav a, .nav a, .menu a, header a").each((_, element) => {
      const text = $(element).text().trim()
      const href = $(element).attr("href")
      if (text && href && text.length < 50) {
        navigation.push({ text, href })
      }
    })

    // Extract headings for structure
    const headings: HeadingItem[] = []
    $("h1, h2, h3, h4, h5, h6").each((_, element) => {
      const $element = $(element)
      const text = $element.text().trim()
      const level = (element as cheerio.TagElement).name
      if (text && text.length < 200) {
        headings.push({ level, text })
      }
    })

    // Extract images
    const images: ImageItem[] = []
    $("img").each((_, element) => {
      const src = $(element).attr("src")
      const alt = $(element).attr("alt") || ""
      if (src) {
        images.push({ src, alt })
      }
    })

    console.log("[v0] Successfully scraped website:", {
      title: title.substring(0, 50),
      contentLength: mainContent.length,
      navigationItems: navigation.length,
      headings: headings.length,
      images: images.length,
    })

    const scrapedData: ScrapedData = {
      url: normalizedUrl,
      title,
      description,
      keywords,
      author,
      siteName,
      content: mainContent,
      navigation: navigation.slice(0, 20), // Limit navigation items
      headings: headings.slice(0, 30), // Limit headings
      images: images.slice(0, 10), // Limit images
      wordCount: mainContent.split(" ").length,
      scrapedAt: new Date().toISOString(),
    }

    return NextResponse.json(scrapedData)
  } catch (error) {
    console.error("[v0] Scraping error:", error)

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return NextResponse.json(
          {
            error: "Request timeout. The website took too long to respond.",
          },
          { status: 408 },
        )
      }

      if (error.message.includes("fetch")) {
        return NextResponse.json(
          {
            error: "Network error. Please check the URL and try again. The website might be blocking requests.",
          },
          { status: 400 },
        )
      }

      return NextResponse.json(
        {
          error: `Scraping failed: ${error.message}`,
        },
        { status: 500 },
      )
    }

    return NextResponse.json(
      {
        error: "Internal server error occurred while scraping the website",
      },
      { status: 500 },
    )
  }
}
