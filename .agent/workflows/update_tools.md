---
description: Update MCP servers (n8n, Supabase) to the latest version
---

1.  **Check n8n-mcp version**
    Execute the following command to check if checking for updates is possible and perform the update for the n8n-mcp server globally.

    // turbo
    ```bash
    npm update -g n8n-mcp
    ```

2.  **Check Supabase MCP version**
    Update the Supabase MCP server using npm (assuming it's installed globally or run via npx).

    // turbo
    ```bash
    npm update -g @supabase/mcp-server
    ```

3.  **Verify n8n Health**
    After update, check if n8n connection is still healthy.

    ```bash
    n8n_health_check(mode='status')
    ```
