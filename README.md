# DataSense | Intelligent Data Visualization

DataSense is a high-performance, AI-driven data analysis and visualization dashboard. It allows users to upload raw datasets (CSV, JSON, Excel) and instantly generates meaningful visual representations and deep analytical insights using Google's Gemini models via Genkit.

## Blueprint

### 🚀 Overview
DataSense transforms the traditional data analysis workflow. Instead of manually cleaning data and selecting chart types, the AI engine analyzes column metadata and row distributions to recommend the most effective visualizations and provide automated reasoning behind the data patterns.

### 🛠 Tech Stack
- **Framework**: Next.js 15 (App Router)
- **AI Engine**: Genkit 1.x with Google AI (Gemini 2.5 Flash)
- **Visualization**: Recharts (Responsive, multi-chart support)
- **Styling**: Tailwind CSS & Shadcn UI
- **Data Handling**: `xlsx` for Excel parsing, custom CSV/JSON processors
- **Theme**: `next-themes` (Dark/Light mode support)

### 🤖 AI Capabilities
The application leverages two core Genkit flows:

1.  **Visualization Recommender (`recommendVisualizations`)**:
    - Analyzes column data types (Numerical, Categorical, Temporal).
    - Suggests up to 9 diverse chart types (Bar, Line, Radar, Area, Scatter, etc.).
    - Maps the most relevant columns to X and Y axes automatically.

2.  **Data Insights Engine (`aiGeneratedDataInsights`)**:
    - Processes data samples to find correlations and anomalies.
    - Generates detailed analytical insights.
    - Provides key findings and forward-looking predictions.
    - Supports "Reasoning Mode" for grounded analysis using Gemini's extensive knowledge.

### 📂 Architecture
- `src/ai/flows/`: Contains the logic for AI-driven recommendations and insights.
- `src/components/dashboard/`: Reusable visualization and insight panels.
- `src/app/lib/data-processor.ts`: Core logic for extracting metadata and parsing various file formats.
- `src/firebase/`: Scaffolding for Firebase integration (Auth/Firestore ready).

### 🎨 UI/UX Features
- **Instant Dashboard**: Zero-config visualization upon upload.
- **Theme Intelligence**: Fully responsive dark and light modes.
- **Raw Data Explorer**: A detailed table view for inspecting the processed records.
- **Smart Insights Sidebar**: A dedicated panel for AI-generated finding and predictions.
