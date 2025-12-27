# Luminous Echo 🤖

An AI-powered chatbot application built with Next.js, featuring real-time streaming responses, persistent chat history, and a sleek dark theme.

![Luminous Echo](https://img.shields.io/badge/Luminous%20Echo-Chatbot-blue?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-15.5.9-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Firebase](https://img.shields.io/badge/Firebase-11.9.1-orange?style=flat-square&logo=firebase)

## ✨ Features

- **Persistent Input Field**: Always-accessible input for continuous interaction
- **Streaming AI Responses**: Real-time text generation for dynamic conversations
- **Scrollable Chat History**: Easy navigation through conversation history
- **New Chat Initiation**: Start fresh conversations with context clearing
- **Contextual Responses**: AI considers chat history for coherent replies
- **Modern Dark Theme**: Deep charcoal gray background with electric blue accents
- **Responsive Design**: Clean, intuitive layout that works on all devices

## 🛠️ Tech Stack

- **Framework**: Next.js 15.5.9 with App Router
- **Language**: TypeScript
- **AI**: Google Genkit AI
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI primitives
- **Database**: Firebase
- **Icons**: Lucide React
- **Forms**: React Hook Form with Zod validation

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (version 18 or higher)
- **npm** or **yarn** package manager
- **Google Cloud Project** with Genkit AI enabled
- **Firebase Project** (optional, for additional features)

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Deepthireddy729/CHATBOTIGEBRA.git
   cd CHATBOTIGEBRA
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory and add your configuration:

   ```env
   # Google Genkit AI Configuration
   GOOGLE_GENAI_API_KEY=your_google_genai_api_key

   # Firebase Configuration (optional)
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   ```

4. **Configure Google Cloud (for Genkit AI)**
   - Create a Google Cloud Project
   - Enable the Google AI API
   - Generate an API key
   - Add the API key to your `.env.local` file

## 🏃‍♂️ Usage

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:9002`

### Genkit AI Development

For AI development and testing:

```bash
# Start Genkit in development mode
npm run genkit:dev

# Or start with file watching
npm run genkit:watch
```

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm run start
```

## 📁 Project Structure

```
src/
├── ai/                    # AI configuration and flows
│   ├── dev.ts            # Development setup
│   ├── genkit.ts         # Genkit configuration
│   └── flows/            # AI conversation flows
├── app/                  # Next.js app directory
│   ├── actions.ts        # Server actions
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/           # React components
│   ├── chat-interface.tsx    # Main chat component
│   ├── streaming-text.tsx    # Streaming text display
│   └── ui/               # UI component library
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and configs
└── types/                # TypeScript type definitions
```

## 🎨 Design System

- **Background**: Deep charcoal gray (#121212)
- **Primary**: Electric blue (#7DF9FF)
- **Accent**: Soft lavender (#E6E6FA)
- **Font**: Inter sans-serif
- **Icons**: Minimalist line icons from Lucide React

## 🔧 Development Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run genkit:dev` - Start Genkit AI development server
- `npm run genkit:watch` - Start Genkit with file watching
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Powered by [Google Genkit AI](https://genkit.dev/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)

---

**Luminous Echo** - Illuminating conversations through AI ✨
