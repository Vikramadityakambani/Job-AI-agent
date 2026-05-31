document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const searchInput = document.getElementById("search-input");
    const searchBtn = document.getElementById("search-btn");
    const btnText = document.getElementById("btn-text");
    const settingsToggle = document.getElementById("settings-toggle");
    const settingsContent = document.getElementById("settings-content");
    const caret = settingsToggle.querySelector(".caret");
    
    const statusPanel = document.getElementById("status-panel");
    const consoleLogs = document.getElementById("console-logs");
    
    const resultsHeader = document.getElementById("results-header");
    const statsTotal = document.getElementById("stats-total");
    const downloadBtn = document.getElementById("download-btn");
    const resultsGrid = document.getElementById("results-grid");
    const emptyState = document.getElementById("empty-state");
    
    const toast = document.getElementById("toast");
    const toastMessage = document.getElementById("toast-message");

    // Toggle Advanced Settings Accordion
    settingsToggle.addEventListener("click", () => {
        const isOpen = settingsContent.classList.contains("open");
        if (isOpen) {
            settingsContent.classList.remove("open");
            settingsToggle.classList.remove("active");
        } else {
            settingsContent.classList.add("open");
            settingsToggle.classList.add("active");
        }
    });

    // Helper to log in console panel
    function clearLogs() {
        consoleLogs.innerHTML = "";
    }

    function addLog(message, type = "info") {
        const entry = document.createElement("div");
        entry.className = `log-entry log-${type}`;
        
        const timestamp = new Date().toLocaleTimeString();
        entry.innerHTML = `<span class="log-dim">[${timestamp}]</span> ${message}`;
        consoleLogs.appendChild(entry);
        consoleLogs.scrollTop = consoleLogs.scrollHeight;
    }

    // Typing effect simulation for logs to make it feel premium
    async function playLogsWithDelay(logsList) {
        clearLogs();
        statusPanel.classList.remove("hidden");
        
        for (const log of logsList) {
            addLog(log.message, log.type);
            // Small delay to simulate processing
            await new Promise(resolve => setTimeout(resolve, 300));
        }
    }

    // Helper for Toast alerts
    function showToast(message, isSuccess = true) {
        toastMessage.textContent = message;
        const icon = toast.querySelector("i");
        if (isSuccess) {
            toast.style.borderColor = "rgba(16, 185, 129, 0.3)";
            icon.className = "fa-solid fa-circle-check toast-icon";
            icon.style.color = "var(--color-wellfound)";
        } else {
            toast.style.borderColor = "rgba(239, 68, 68, 0.3)";
            icon.className = "fa-solid fa-circle-exclamation toast-icon";
            icon.style.color = "#ef4444";
        }
        toast.classList.remove("hidden");
        
        setTimeout(() => {
            toast.classList.add("hidden");
        }, 3000);
    }

    // Search trigger
    searchBtn.addEventListener("click", async () => {
        const keyword = searchInput.value.trim();
        if (!keyword) {
            showToast("Please enter a valid job keyword!", false);
            return;
        }

        // Set Loading States
        searchBtn.disabled = true;
        btnText.textContent = "Aggregating...";
        searchInput.disabled = true;
        
        // Reset grid and hide headers
        resultsHeader.classList.add("hidden");
        resultsGrid.innerHTML = "";
        emptyState.classList.add("hidden");
        
        // Add starting log
        statusPanel.classList.remove("hidden");
        clearLogs();
        addLog(`Initiating job aggregation for query: "${keyword}"`, "info");
        
        const firecrawlKey = document.getElementById("firecrawl-key").value.trim();
        const slackWebhook = document.getElementById("slack-webhook").value.trim();
        
        try {
            const response = await fetch("/api/search", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    keyword: keyword,
                    firecrawl_key: firecrawlKey,
                    slack_webhook: slackWebhook
                })
            });

            if (!response.ok) {
                throw new Error(`Server returned error status: ${response.status}`);
            }

            const result = await response.json();
            
            // Play logs animation
            if (result.logs && result.logs.length > 0) {
                await playLogsWithDelay(result.logs);
            }
            
            const jobs = result.jobs || [];
            
            if (jobs.length > 0) {
                // Populate stats
                statsTotal.textContent = jobs.length;
                resultsHeader.classList.remove("hidden");
                
                // Render Cards
                jobs.forEach(job => {
                    const card = document.createElement("div");
                    card.className = "job-card card";
                    
                    // Determine badge class
                    const srcLower = job.source.toLowerCase();
                    const badgeClass = `source-badge source-${srcLower}`;
                    
                    // Icon matching for locations/salaries
                    const locationIcon = job.location.toLowerCase().includes("remote") ? "fa-house-laptop" : "fa-location-dot";
                    
                    card.innerHTML = `
                        <div class="card-content">
                            <div class="card-top">
                                <span class="${badgeClass}">${job.source}</span>
                            </div>
                            <h3 class="job-title" title="${job.title}">${job.title}</h3>
                            <div class="company-name">
                                <i class="fa-regular fa-building"></i> ${job.company}
                            </div>
                        </div>
                        <div class="card-footer">
                            <div class="meta-row">
                                <div class="meta-item">
                                    <i class="fa-solid ${locationIcon}"></i>
                                    <span>${job.location}</span>
                                </div>
                                <div class="meta-item">
                                    <i class="fa-solid fa-wallet"></i>
                                    <span>${job.salary}</span>
                                </div>
                            </div>
                            <div class="card-action">
                                <a href="${job.url}" target="_blank" rel="noopener noreferrer" class="btn-card">
                                    View / Apply <i class="fa-solid fa-arrow-up-right-from-square"></i>
                                </a>
                            </div>
                        </div>
                    `;
                    resultsGrid.appendChild(card);
                });
                
                showToast(`Successfully aggregated ${jobs.length} jobs!`);
            } else {
                emptyState.classList.remove("hidden");
                showToast("No jobs found matching your keyword", false);
            }
            
        } catch (error) {
            addLog(`Error during search pipeline: ${error.message}`, "error");
            emptyState.classList.remove("hidden");
            showToast("Scraper aggregation failed!", false);
        } finally {
            // Restore States
            searchBtn.disabled = false;
            btnText.textContent = "Aggregate Jobs";
            searchInput.disabled = false;
        }
    });

    // ==========================================
    // Cron Scheduler Logic (Phase 5)
    // ==========================================
    
    const saveScheduleBtn = document.getElementById("save-schedule-btn");
    const schedulerStatus = document.getElementById("scheduler-status");
    const scheduleInterval = document.getElementById("schedule-interval");
    const scheduleKeyword = document.getElementById("schedule-keyword");
    const firecrawlKey = document.getElementById("firecrawl-key");
    const slackWebhook = document.getElementById("slack-webhook");

    // Formatter for relative timestamps
    function formatTime(unixTimestamp) {
        if (!unixTimestamp || unixTimestamp <= 0) return "Never";
        return new Date(unixTimestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }

    function updateSchedulerStatusUI(state) {
        if (!schedulerStatus || !state) return;
        
        let statusText = `Status: ${state.last_status || "Idle"}`;
        
        if (state.last_run > 0) {
            statusText += ` | Last Run: ${formatTime(state.last_run)}`;
        }
        if (state.next_run > 0) {
            statusText += ` | Next Run: ${formatTime(state.next_run)}`;
        }
        if (state.run_count > 0) {
            statusText += ` (${state.run_count} runs)`;
        }
        
        schedulerStatus.textContent = statusText;
    }

    // Load initial config from backend
    async function loadSchedulerConfig() {
        try {
            const response = await fetch("/api/scheduler");
            if (response.ok) {
                const data = await response.json();
                
                // Populate fields if config is loaded
                if (data.config) {
                    scheduleInterval.value = data.config.interval || "none";
                    scheduleKeyword.value = data.config.keyword || "";
                    if (data.config.slack_webhook) {
                        slackWebhook.value = data.config.slack_webhook;
                    }
                    if (data.config.firecrawl_key) {
                        firecrawlKey.value = data.config.firecrawl_key;
                    }
                }
                
                // Update state UI
                updateSchedulerStatusUI(data.state);
            }
        } catch (error) {
            console.error("Scheduler config load error:", error);
        }
    }

    // Save configuration settings
    saveScheduleBtn.addEventListener("click", async () => {
        const interval = scheduleInterval.value;
        const keyword = scheduleKeyword.value.trim();
        const fcKey = firecrawlKey.value.trim();
        const webhook = slackWebhook.value.trim();

        if (interval !== "none" && !keyword) {
            showToast("Scheduler requires a search keyword!", false);
            return;
        }

        saveScheduleBtn.disabled = true;
        saveScheduleBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Saving...`;

        try {
            const response = await fetch("/api/scheduler", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    interval: interval,
                    keyword: keyword,
                    firecrawl_key: fcKey,
                    slack_webhook: webhook
                })
            });

            if (response.ok) {
                const data = await response.json();
                showToast("Scheduler configuration saved!");
                updateSchedulerStatusUI(data.state);
            } else {
                throw new Error("Server rejected config");
            }
        } catch (error) {
            showToast("Failed to save scheduler config", false);
            console.error("Error saving schedule config:", error);
        } finally {
            saveScheduleBtn.disabled = false;
            saveScheduleBtn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Save Schedule`;
        }
    });

    // Run scheduler check on init
    loadSchedulerConfig();

    // Periodically query scheduler status (every 10 seconds if schedule is enabled)
    setInterval(async () => {
        if (scheduleInterval.value !== "none") {
            try {
                const response = await fetch("/api/scheduler");
                if (response.ok) {
                    const data = await response.json();
                    updateSchedulerStatusUI(data.state);
                }
            } catch (err) {
                console.error("Scheduler check-in error:", err);
            }
        }
    }, 10000);
});
