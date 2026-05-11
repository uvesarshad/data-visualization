# DataSense | Intelligent Data Visualization

DataSense is a high-performance, AI-driven data analysis and visualization dashboard. It allows users to upload raw datasets (CSV, JSON, Excel), fetch data from public URLs, and instantly generates meaningful visual representations and deep analytical insights using Google's Gemini models via Genkit. The platform now features a persistence layer for saving and loading previous analyses.

## Blueprint

### 🚀 Overview
DataSense transforms the traditional data analysis workflow. Instead of manually cleaning data and selecting chart types, the AI engine analyzes column metadata and row distributions to recommend the most effective visualizations and provide automated reasoning behind the data patterns.

### 📸 Visual Preview

#### 🎥 Platform Walkthrough
<div align="center">
  <video src="sample/Recording.mp4" width="100%" controls></video>
</div>

#### 🖼️ Screenshots
<div align="center">
  <img src="sample/Screenshot (1).jpg" width="49%" />
  <img src="sample/Screenshot (2).jpg" width="49%" />
  <img src="sample/Screenshot (3).jpg" width="49%" />
  <img src="sample/Screenshot (4).jpg" width="49%" />
  <img src="sample/Screenshot (5).jpg" width="49%" />
  <img src="sample/Screenshot (6).jpg" width="49%" />
  <img src="sample/Screenshot (7).jpg" width="100%" />
</div>


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
    A["User Uploads File or URL"] --> B{"Source?"}
    B -- "Local File" --> C["DataUploader"]
    B -- "Public URL" --> C
    C --> D{"File Type?"}
    D -- "CSV/JSON" --> E["parseCSV / JSON.parse"]
    D -- "Excel" --> F["parseExcel with Auto-Sheet"]
    E --> G["Data Cleaning & Validation"]
    F --> G
    G --> H["Extract Column Metadata"]
    H --> I["Client Memory & State"]
    
    subgraph Persistence["Data Persistence"]
        I --> J["Save Analysis to DB"]
        K["Previous Analyses"] --> I
    end
    
    subgraph AIFlows["AI Flows (Server Actions)"]
        I --> L["recommendVisualizations"]
        I --> M["aiGeneratedDataInsights"]
        I --> N["naturalLanguageQuery"]
    end
    
    L --> O["Dashboard Grid"]
    M --> P["Insights Panel"]
    N --> Q["Dynamic Chart"]
```

- `src/ai/flows/`: Genkit server actions for AI logic.
- `src/app/lib/`: Data processing, statistics, and validation utilities.
- `src/components/dashboard/`: UI for charts, insights, and query bar.
- `src/lib/`: Shared utilities (AI cache, prompt formatting, state).

### 🎨 UI/UX Features
- **Instant Dashboard**: Zero-config visualization upon upload.
- **Natural Language**: Query your data in plain English.
- **Persistence & History**: Save your analyses and restore them later with one click.
- **URL Importing**: Fetch datasets directly from public URLs (GitHub, Google Drive, etc.).
- **Robust Parsing**: Advanced sheet detection for Excel and robust quoting for CSV.
- **Theme Intelligence**: Fully responsive dark and light modes.
- **Raw Data Explorer**: Virtualized table for inspecting large datasets.
- **Executive Reports**: One-click professional analysis export.

