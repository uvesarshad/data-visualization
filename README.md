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

### 📖 Documentation

For detailed technical documentation designed for AI agents and developers, see [docs/overview.md](docs/overview.md).

### 🤖 AI Capabilities
The application leverages 7 specialized Genkit AI flows:

1.  **Visualization Recommender**: Recommends up to 9 optimal chart types based on metadata.
2.  **Data Insights Engine**: Generates narrative insights, key findings, and predictions.
3.  **Natural Language Query**: Converts user questions into dynamic visualizations.
4.  **Per-Chart Analysis**: Deep-dives into a specific chart's data patterns.
5.  **Executive Report Generation**: Creates comprehensive summaries and action items.
6.  **Anomaly Detection**: Explains statistical outliers with business context.
7.  **Batch Analysis**: Correlates patterns across multiple charts.

### 📂 Architecture & Workflow

```mermaid
graph TD
    A[User Uploads File] --> B{File Type?}
    B -- CSV/JSON --> C[parseCSV / JSON.parse]
    B -- Excel --> D[parseExcel]
    C --> E[Data Cleaning & Validation]
    D --> E
    E --> F[Extract Column Metadata]
    F --> G[Client Memory]
    
    subgraph AI Flows (Server Actions)
        G --> H[recommendVisualizations]
        G --> I[aiGeneratedDataInsights]
        G --> J[naturalLanguageQuery]
    end
    
    H --> K[Dashboard Grid]
    I --> L[Insights Panel]
    J --> M[Dynamic Chart]
    
    K --> N[Per-Chart Analysis]
    L --> O[Executive Report]
```

- `src/ai/flows/`: Genkit server actions for AI logic.
- `src/app/lib/`: Data processing, statistics, and validation utilities.
- `src/components/dashboard/`: UI for charts, insights, and query bar.
- `src/lib/`: Shared utilities (AI cache, prompt formatting, state).

### 🎨 UI/UX Features
- **Instant Dashboard**: Zero-config visualization upon upload.
- **Natural Language**: Query your data in plain English.
- **Theme Intelligence**: Fully responsive dark and light modes.
- **Raw Data Explorer**: Virtualized table for inspecting large datasets.
- **Executive Reports**: One-click professional analysis export.

