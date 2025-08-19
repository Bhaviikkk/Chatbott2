# AI Website Chatbot

An intelligent AI chatbot that scrapes websites and provides context-aware responses using Google's Gemini API. The chatbot can be embedded on any website and provides accurate answers based on the scraped website content.

## Features

- 🤖 **AI-Powered Responses**: Uses Google Gemini for intelligent conversations
- 🌐 **Website Scraping**: Automatically extracts content, metadata, and structure
- 🎯 **Context-Aware**: Only answers questions related to the scraped website
- 📱 **Draggable Interface**: Moveable chat window for optimal positioning
- 🔗 **Easy Embedding**: Single HTML file or JavaScript embed for any website
- 🎨 **Modern UI**: Clean, responsive design with dark mode support
- ⚡ **Production Ready**: Optimized for deployment on Vercel

## Quick Start

### 1. Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/ai-website-chatbot)

### 2. Set Environment Variables

Add your Gemini API key in Vercel dashboard:

\`\`\`bash
GEMINI_API_KEY=your_gemini_api_key_here
\`\`\`

### 3. Get Your Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key to your Vercel environment variables

## Usage Options

### Option 1: Standalone HTML (Recommended)

Use the complete standalone chatbot:

\`\`\`html
<iframe 
  src="https://your-domain.vercel.app/chatbot" 
  width="400" 
  height="600"
  frameborder="0">
</iframe>
\`\`\`

### Option 2: JavaScript Embed

Add to any website:

\`\`\`html
<script src="https://your-domain.vercel.app/embed.js"></script>
\`\`\`

### Option 3: Direct Integration

Copy the chatbot component into your Next.js project:

\`\`\`jsx
import { DraggableChatbot } from '@/components/draggable-chatbot'

export default function MyPage() {
  return (
    <div>
      <h1>My Website</h1>
      <DraggableChatbot />
    </div>
  )
}
\`\`\`

## Local Development

### Prerequisites

- Node.js 18+
- Python 3.8+
- Gemini API key

### Setup

1. Clone the repository:
\`\`\`bash
git clone https://github.com/yourusername/ai-website-chatbot.git
cd ai-website-chatbot
\`\`\`

2. Install dependencies:
\`\`\`bash
npm run setup
pip3 install -r scripts/requirements.txt
\`\`\`

3. Create environment file:
\`\`\`bash
echo "GEMINI_API_KEY=your_api_key_here" > .env.local
\`\`\`

4. Run development server:
\`\`\`bash
npm run dev
\`\`\`

5. Test the scraper:
\`\`\`bash
npm run test:scraper
\`\`\`

## API Endpoints

### POST /api/scrape
Scrapes website content and metadata.

**Request:**
\`\`\`json
{
  "url": "https://example.com"
}
\`\`\`

**Response:**
\`\`\`json
{
  "status": "success",
  "url": "https://example.com",
  "metadata": {
    "title": "Example Site",
    "description": "Site description"
  },
  "content": {
    "text_content": "Main content...",
    "headings": [{"level": 1, "text": "Main Title"}]
  }
}
\`\`\`

### POST /api/chat-context
Generates AI responses based on website context.

**Request:**
\`\`\`json
{
  "message": "What is this website about?",
  "websiteData": { /* scraped data */ },
  "conversationHistory": [/* previous messages */]
}
\`\`\`

## Configuration

### Customizing the Chatbot

Edit `public/chatbot-embed.js` to customize:

\`\`\`javascript
const CHATBOT_CONFIG = {
  primaryColor: '#2563eb',
  position: 'bottom-right',
  offset: { x: 20, y: 20 }
};
\`\`\`

### API Configuration

Update API endpoints in the standalone files:

\`\`\`javascript
const config = {
  scrapeAPI: 'https://your-domain.vercel.app/api/scrape',
  chatAPI: 'https://your-domain.vercel.app/api/chat-context'
};
\`\`\`

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

### Docker

\`\`\`bash
docker build -t ai-chatbot .
docker run -p 3000:3000 -e GEMINI_API_KEY=your_key ai-chatbot
\`\`\`

### Manual Deployment

\`\`\`bash
npm run build
npm run deploy
\`\`\`

## Troubleshooting

### Common Issues

1. **Scraping fails**: Check if the website blocks bots or requires authentication
2. **API errors**: Verify your Gemini API key is correct and has quota
3. **CORS issues**: Ensure proper headers are set in `vercel.json`

### Debug Mode

Enable debug logging:

\`\`\`javascript
console.log("[v0] Debug info:", data);
\`\`\`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- 📧 Email: support@yourdomain.com
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/ai-website-chatbot/issues)
- 📖 Docs: [Documentation](https://your-docs-site.com)

---

Made with ❤️ using Next.js, Gemini AI, and Vercel
