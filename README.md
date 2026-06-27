# AI Investment Research Agent

An end-to-end AI agent system that conducts comprehensive research on public companies. It analyzes financial strength, recent news sentiment, and the competitive landscape to output a deterministic investment score and a clear recommendation: `INVEST` or `PASS`.

This system is built with a **React + Tailwind CSS** frontend, a native **Node.js HTTP backend** (no bloated frameworks), modular agent services, and a custom state-based orchestration layer.

---

## 1. Overview — What It Does
The **AI Investment Research Agent** automates the manual workflow of investment analysts. When a user submits a company name:
1. **Validation & Filtering**: The system first validates the company's existence and ensures there is enough public information.
2. **Multi-Agent Research Pipeline**:
   - **Research Agent**: Gathers a high-level overview of the company, its business segments, and main products.
   - **Financial Agent**: Researches and evaluates revenue growth, profitability margins, balance sheet health, cash flows, and debt profiles.
   - **News & Sentiment Agent**: Gathers recent news, regulatory issues, and risk disclosures, then analyzes overall market sentiment.
   - **Competition Agent**: Maps out key competitors, determines relative strengths, weaknesses, and market share.
3. **Synthesis & Scoring (Decision Agent)**: Amalgamates the insights gathered by all agents, scores the company on a scale of 0-100 across predefined criteria, and makes a final `INVEST` or `PASS` recommendation based on a deterministic scoring threshold.
4. **User-Friendly Report Rendering**: Displays the complete analysis and final decision in a clean, professional, glassmorphic report interface.

---

## 2. How to Run It — Setup and Run Steps
Follow these steps to configure and run the application locally.

### Prerequisites
- **Node.js** (v20+ recommended)
- **npm** (v10+ recommended)
- **API Keys**:
  - Gemini API Key (Google AI Studio)
  - Tavily API Key (for web search)

### Setup Steps
1. **Clone the Repository**:
   ```bash
   git clone https://github.com/abhishek14311431/AI-Product-Development-Engineer-intern-assignment.git
   cd AI-Product-Development-Engineer-intern-assignment
   ```

2. **Configure Environment Variables**:
   Create a `.env` file in the `server/` directory and populate it with your keys:
   ```env
   PORT=3001
   CORS_ORIGIN=http://localhost:5173
   GEMINI_API_KEY=your_gemini_api_key_here
   TAVILY_API_KEY=your_tavily_api_key_here
   ```

3. **Install Backend Dependencies**:
   ```bash
   cd server
   npm install
   ```

4. **Install Frontend Dependencies**:
   ```bash
   cd ../apps/web
   npm install
   ```

### Running the Application

1. **Start the Backend Server**:
   From the `server/` directory:
   ```bash
   npm run dev
   ```
   The backend runs on `http://localhost:3001` by default.

2. **Start the Frontend App**:
   From the `apps/web/` directory:
   ```bash
   npm run dev
   ```
   The frontend runs on `http://localhost:5173` by default. Open this URL in your web browser.

---

## 3. How It Works — Our Approach and Architecture

### Multi-Agent Orchestration
We implemented a **state-passing graph pattern** (similar to LangGraph but natively in Node.js) to orchestrate the research workflow. Instead of a single LLM trying to do everything in one massive prompt, we isolate responsibilities:

```mermaid
flowchart TD
    Start([User Request]) --> Validate{Validation Node}
    Validate -- Valid Company --> A[Research Agent]
    Validate -- Invalid/Unknown --> Fail[Return Error/invalid company ]
    A --> B[Financial Agent]
    B --> C[News Agent]
    C --> D[Competition Agent]
    D --> E[Decision Agent]
    E --> End([Report & Recommendation])
```

1. **State Management**: A shared state object (`investmentState.js`) is passed sequentially from agent to agent. Each agent appends its findings to this shared state.
2. **Deterministic Decision Making**: The `Decision Agent` receives the compiled facts from all agents. It scores the company across categories (e.g., Financial Health, Competitive Edge, Sentiment) and checks if the total score exceeds the `INVEST` threshold. This makes the system auditable and consistent.

### Component Architecture
- **Frontend (`apps/web`)**: A single-page dashboard built with React and Tailwind CSS. It communicates with the backend via REST API, managing loading states dynamically.
- **Backend (`server/`)**: A native Node.js HTTP server. Routes are modularized under `/routes`. We avoided complex frameworks (like Express) to minimize external dependencies and memory footprints.
- **Services (`server/services/`)**: High-level wrapper clients around Gemini (via `@google/generative-ai`) and Tavily Search API.

---

## 4. Key Decisions & Trade-Offs

### What We Chose & Why
1. **Gemini API (using modern SDKs)**: Chosen for its fast inference speed, high context window, and exceptional structured text generation. It fits perfectly in sequential multi-agent chains where latency is a concern.
2. **Native Node.js HTTP Server**: Instead of standardizing on Express or NestJS, we utilized the native `http` module. This keeps the backend extremely fast, minimal, and ensures zero boilerplate.
3. **Sequential State Passing**: We opted for a strict pipeline rather than an agent loop (with routing back-and-forth). This reduces LLM token costs and ensures predictable execution times, which is critical for user experience in real-time interfaces.
4. **Pre-Analysis Validation Layer**: We added a check using search relevance to immediately fail and return an error for non-existent companies (e.g. `FakeCompanyXYZ`). This prevents the agents from hallucinating financial data for fake entities and saves unnecessary API costs.

### What We Left Out (Trade-Offs)
1. **Durable Database Queue**: In-memory state is used to hold active jobs. For high production throughput, an asynchronous job queue (e.g., Redis / BullMQ) combined with a database (e.g., PostgreSQL) would be required to prevent state loss on server restarts.
2. **Structured Financial Data APIs**: We currently rely on Tavily web search to pull financial details. While Tavily works well, integrating structured financial data feeds (like Alpha Vantage or SEC EDGAR) would increase data precision and eliminate potential LLM parsing discrepancies.
3. **WebSockets / Server-Sent Events (SSE)**: Currently, the frontend makes a single HTTP POST request and waits for the entire workflow to complete (which can take 15–20 seconds). In a production system, we would stream progress node-by-node to the frontend via SSE.

---

## 5. Example Runs

> [!NOTE]
> *This section is intentionally left open for you to insert your specific example runs. Please paste your custom company outputs (like Score, Decision, and Reasoning) below.*

### Example 1: [Insert Company Name here, e.g., NVIDIA]
- **Decision**: `[INVEST or PASS]`
- **Score**: `[Score, e.g., 88/100]`
- **Key Financial Highlight**: `[Detail]`
- **Key Risk**: `[Detail]`
- **Reasoning Summary**:
  ```text
  [Paste LLM reasoning output here]
  ```

### Example 2: [Insert Company Name here, e.g., Tesla]
- **Decision**: `[INVEST or PASS]`
- **Score**: `[Score, e.g., 72/100]`
- **Key Financial Highlight**: `[Detail]`
- **Key Risk**: `[Detail]`
- **Reasoning Summary**:
  ```text
  [Paste LLM reasoning output here]
  ```

### Example 3: FakeCompanyXYZ (Validation Test)
- **Result**: `Company not found or insufficient market information available.`
- **Reasoning Summary**:
  ```text
  [The pre-analysis validation node successfully intercepted the run, identified the company as non-verifiable, and halted execution to prevent hallucinated data generation and API waste.]
  ```

---

## 6. What We Would Improve with More Time
1. **Progress Streaming (SSE)**: Show which agent is currently running in real-time (e.g., "Financial Agent researching debt metrics...") with a step-by-step progress bar on the frontend.
2. **Direct SEC Filings Integration**: Scrape and parse 10-K and 10-Q forms directly to ensure absolute accuracy of balance sheet and income statements.
3. **Custom Scoring Rubrics**: Allow users to weight different metrics (e.g., prioritize dividend safety over revenue growth) to match their personal investment profiles.
4. **Durable Workflows**: Implement a workflow framework (like Temporal or BullMQ) to allow long-running analyses to resume even if a server restarts.
5. **Caching Layer**: Cache research results for a company (e.g., for 24 hours) to avoid redundant API calls and speed up repetitive queries.

---

## 7. 🌟 BONUS: LLM Chat Session Transcripts & Logs
In compliance with the project guidelines, the complete transcripts of the developer-LLM chat sessions during the development, debugging, and deployment of this project have been included in the repository.

You can view the full conversational history here:
👉 **[LLM_CHAT_LOGS.md](./LLM_CHAT_LOGS.md)**

This log provides transparent insights into the engineering decisions, prompt engineering, and bug-fixing processes.
