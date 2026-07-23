# Signal Field

A 3D spiral particle system driven by AI prompts. Describe a mood or motion, and watch the visualization morph in real-time using Three.js and React.

## Features

- **AI-Powered**: Describe your scene with natural language; the LLM translates it to animation parameters
- **3D Visualization**: Real-time spiral particle effects with wave motion, instability progression, and burst events
- **Live Preview**: Interactive orbit camera with zoom and pan controls
- **Responsive Controls**: Sliders, toggles, and color pickers for manual tweaking

## Setup

### Prerequisites

- Node.js 16+ and npm

### Installation

1. Clone the repository and navigate to the project:

   ```bash
   cd signal-field
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

   If `npm install` fails, switch to the recommended Node version and retry:

   ```bash
   nvm install 20.19.0
   nvm use 20.19.0
   node -v
   npm install
   ```

3. Create your local environment file from the example:

   ```bash
   cp .env.example .env
   ```

### Development

Start the local dev server with HMR:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Project Structure

```
src/
├── features/
│   ├── spiral/
│   │   ├── components/       # SpiralPoints, SpiralPreview
│   │   └── utils/            # spiralUtils, spiralUpdates
│   └── ai/
│       ├── components/       # AIParamsPanel
│       └── utils/            # aiPromptUtils (prompt engineering)
├── App.jsx                   # Main component & parameter state
└── main.jsx                  # Entry point
```

**Architectural Note:** This project uses a feature-based folder structure, a proven production pattern used by leading tech teams. It groups components, utilities, and logic by feature domain to improve scalability and maintainability.

## Usage

### Manual Control

Use the control panel sliders and toggles to adjust:

- **Growth Rate**: Spiral expansion
- **Wave Amp/Freq**: Wave height and density
- **Jitter**: Randomness in position
- **Point Size**: Particle scale
- **Breathe Speed**: Animation tempo

### AI Control

You can interact with the AI in two ways:

1. **Type Manually**: Enter a custom description in the prompt input field
2. **Use Prompt Chips**: Click preset prompt chips to instantly populate the input field with example prompts

Example prompts:

- "A calm system gradually becoming unstable"
- "High energy with tightly controlled movement"
- "Dense, chaotic, and fast-moving"
- "Calm, relaxed, serene"

The AI translates your description to optimized animation parameters in real-time.
