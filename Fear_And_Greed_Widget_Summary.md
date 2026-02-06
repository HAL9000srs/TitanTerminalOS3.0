# Fear & Greed Widget Upgrade Summary

Here is a summary of the integration we implemented to bring real-time crypto market sentiment into the Titan Terminal dashboard.

### 1. Frontend Implementation Details
We modified the specific files in the web application to ensure type safety, clean architecture, and a dynamic user interface.

*   **`types.ts`**: This file was updated to define a clear structure for the "Fear & Greed" data object. By strictly defining what this data looks like (score, label, timestamp), we ensure that different parts of the application communicate correctly without errors.
*   **`services/fearGreedService.ts`**: We created this dedicated service file to handle the specific logic of fetching sentiment data from our backend. Isolating this logic keeps the main application code clean and makes it easier to reuse or modify the data source in the future without breaking the visual components.
*   **`components/Dashboard.tsx`**: The main dashboard view was updated to replace the static placeholder card with a live widget. We added logic to interpret the numerical score (0-100) and dynamically assign a color (from red for "Extreme Fear" to green for "Extreme Greed") so the sentiment is instantly understandable at a glance.

### 2. n8n Automation Workflow
We built a backend workflow named **"Crypto Fear & Greed Poller"** to automatically source the data. This acts as the bridge between external market data and our internal system.

*   **`Schedule Trigger`**: This node is set to run every **12 hours**. We chose this interval because the Fear & Greed Index typically updates once a day. Polling frequently would be redundant, while twice daily ensures we always have the fresh daily value soon after it is published.
*   **`HTTP Request`**: This node connects to the **Alternative.me API**. It creates a standardized web request to fetch the latest available index data in a machine-readable format.
*   **`Supabase`**: This is the final destination node. It takes the data from the API and performs an **"Upsert"** operation (update if exists, insert if new) into our database. We configured it this way so that we don't create an endless list of duplicate entries; we simply maintain the single most current "truth" for the dashboard to read.

### 3. Supabase Database Structure
We utilized the **`system_stats`** table to store this data.

*   **Purpose**: This table is designed as a flexible key-value store for global system metrics, allowing us to store various types of dashboard data in one place without needing a new table for every single widget.
*   **Data Organization**: We used the specific key `CRYPTO_FEAR_GREED` to label this data. When the frontend asks for data, it requests only the row matching this key, retrieving the latest score and label (e.g., "Extreme Fear") that the n8n workflow deposited there.
