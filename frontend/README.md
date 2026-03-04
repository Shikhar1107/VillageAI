# VillageAI Frontend

Voice-first AI agricultural assistant frontend for rural Indian farmers.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React Query + Zustand
- **Audio Processing**: Web Audio API
- **HTTP Client**: Axios

## Features

- 🎤 Voice Recording Interface
- 📊 Admin Dashboard
- 👥 Volunteer Portal (Krishi Sahayak)
- 📚 Knowledge Base Management
- 📈 Analytics & Metrics
- 🌐 Multi-language Support

## Setup

### Prerequisites

- Node.js 18+ and npm
- Backend server running on http://localhost:8000

### Installation

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.local.example .env.local
```

4. Update `.env.local` with your backend URL:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

Build for production:
```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── page.tsx           # Home page with tabs
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/
│   ├── ui/                # Reusable UI components
│   ├── voice-recorder.tsx # Voice recording component
│   └── providers.tsx      # React Query provider
├── lib/
│   ├── api-client.ts      # API client for backend
│   ├── audio-utils.ts     # Audio recording utilities
│   └── utils.ts          # Utility functions
└── hooks/
    └── use-toast.ts      # Toast notification hook
```

## Key Components

### Voice Recorder
- Press and hold to record
- Automatic transcription via backend
- Audio response playback
- Visual feedback during recording

### Admin Dashboard
- Real-time metrics display
- Query analytics
- Farmer statistics
- System health monitoring

### Knowledge Base
- Manage crops and diseases
- Edit treatment recommendations
- Safety validation rules
- Multi-language content

## API Integration

The frontend connects to the FastAPI backend at `/voice/process` endpoint:

```typescript
// Process voice query
const result = await apiClient.processVoice(audioFile)
// Returns: { transcript, response, audio_url }
```

## Testing the Voice Feature

1. Start the backend server (port 8000)
2. Start the frontend (port 3000)
3. Navigate to Voice Test tab
4. Allow microphone permissions
5. Press and hold the record button
6. Speak: "My wheat has yellow spots"
7. Release to process
8. View transcript and response

## Browser Support

- Chrome 90+ (Recommended)
- Firefox 88+
- Safari 14.1+
- Edge 90+

Note: Microphone permissions required for voice features.

## Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Troubleshooting

### Microphone Not Working
- Check browser permissions
- Ensure HTTPS in production
- Test with browser console: `navigator.mediaDevices.getUserMedia({audio: true})`

### API Connection Issues
- Verify backend is running on port 8000
- Check CORS settings in backend
- Verify `.env.local` has correct API URL

### Build Errors
- Clear `.next` folder: `rm -rf .next`
- Clear node_modules: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (should be 18+)

## Contributing

1. Create feature branch from `dhruv`
2. Make changes
3. Test thoroughly
4. Create pull request

## License

Private - VillageAI Team