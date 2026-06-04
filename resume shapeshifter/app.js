// Resume Shapeshifter — Frontend Controller

document.addEventListener("DOMContentLoaded", () => {
    // State management
    let state = {
        resumeFile: null,
        resumeText: "",
        jdText: "",
        tailoringRun: null, // Stores active result payload
        activeView: "input-view"
    };

    // Theme toggle logic
    const themeToggleBtn = document.getElementById("theme-toggle");
    const sunIcon = themeToggleBtn.querySelector(".sun-icon");
    const moonIcon = themeToggleBtn.querySelector(".moon-icon");

    const setTheme = (theme) => {
        if (theme === "light") {
            document.body.classList.add("light-mode");
            sunIcon.style.display = "none";
            moonIcon.style.display = "block";
            localStorage.setItem("theme", "light");
        } else {
            document.body.classList.remove("light-mode");
            sunIcon.style.display = "block";
            moonIcon.style.display = "none";
            localStorage.setItem("theme", "dark");
        }
    };

    // Initialize theme based on preference or system preference
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
        setTheme(savedTheme);
    } else {
        const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
        setTheme(prefersLight ? "light" : "dark");
    }

    themeToggleBtn.addEventListener("click", () => {
        const isLight = document.body.classList.contains("light-mode");
        setTheme(isLight ? "dark" : "light");
    });

    // Elements
    const serverStatusBadge = document.getElementById("server-status-badge");
    const resumeDropzone = document.getElementById("resume-dropzone");
    const resumeFileInput = document.getElementById("resume-file");
    const selectedFileName = document.getElementById("selected-file-name");
    const fileInfoContainer = document.getElementById("file-info");
    const removeFileBtn = document.getElementById("remove-file-btn");
    const resumeTextarea = document.getElementById("resume-text");
    const jdTextarea = document.getElementById("jd-text");
    const tailorForm = document.getElementById("tailor-form");
    
    const inputView = document.getElementById("input-view");
    const loadingView = document.getElementById("loading-view");
    const dashboardView = document.getElementById("dashboard-view");
    
    const backInputsBtn = document.getElementById("back-inputs-btn");
    const loadSampleBtn = document.getElementById("load-sample-btn");
    const exportPdfBtn = document.getElementById("export-pdf-btn");
    
    const dashJobTitle = document.getElementById("dash-job-title");
    const dashCompany = document.getElementById("dash-company");
    const dashRoleBadge = document.getElementById("dash-role-badge");
    
    const scoreValOriginal = document.getElementById("score-val-original");
    const scoreValTailored = document.getElementById("score-val-tailored");
    const gaugeFillOriginal = document.getElementById("gauge-fill-original");
    const gaugeFillTailored = document.getElementById("gauge-fill-tailored");
    const breakdownList = document.getElementById("breakdown-list");
    const scoreExplanationBox = document.getElementById("score-explanation-box");
    const gapsList = document.getElementById("gaps-list");
    const comparisonSections = document.getElementById("comparison-sections");

    // Sample data definitions
    const sampleResume = `John Doe\njohn.doe@email.com | 123-456-7890 | San Francisco, CA\n\nSummary\nSoftware Engineer with 4 years of experience specializing in web development and cloud technologies.\n\nSkills\nPython, JavaScript, SQL, HTML, CSS, Flask, Git, Jenkins, Linux\n\nExperience\nTech Solutions Inc. | Software Engineer | 2022 - Present\n- Worked on a web application development team using Python.\n- Helped manage deployment pipelines using Jenkins.\n- Developed and optimized database queries in SQL.\n\nEducation\nUniversity of California, Berkeley | B.S. Computer Science | 2018 - 2022`;
    
    const sampleJd = `Position: Senior Python Developer\nCompany: CloudCore Systems\n\nRequirements:\n- 4+ years of backend development experience using Python and frameworks like Flask or FastAPI.\n- Strong experience in containerization and cloud orchestration (Docker, Kubernetes).\n- Hands-on experience building and maintaining automated CI/CD pipelines (Jenkins, GitHub Actions).\n- Proven track record of optimizing backend performance and architecting scale.\n- Solid understanding of SQL and query performance tuning.`;

    // 1. Check Server Connection
    const checkServerHealth = async () => {
        try {
            const res = await fetch("/api/health");
            if (res.ok) {
                const data = await res.json();
                serverStatusBadge.textContent = "Server Online";
                serverStatusBadge.className = "badge-link online";
            } else {
                throw new Error();
            }
        } catch {
            serverStatusBadge.textContent = "Server Offline (Using Local Fallbacks)";
            serverStatusBadge.className = "badge-link offline";
        }
    };
    checkServerHealth();

    // 2. Drag & Drop File Upload Handlers
    const handleFile = (file) => {
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            alert("File size exceeds 5MB limit.");
            return;
        }
        state.resumeFile = file;
        selectedFileName.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
        fileInfoContainer.style.display = "flex";
        
        // Hide standard dropzone content text
        resumeDropzone.querySelector(".dropzone-content").style.display = "none";
        
        // Read file text if it is text-based as immediate backup
        if (file.type === "text/plain") {
            const reader = new FileReader();
            reader.onload = (e) => {
                resumeTextarea.value = e.target.result;
            };
            reader.readAsText(file);
        }
    };

    resumeDropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        resumeDropzone.classList.add("dragover");
    });

    resumeDropzone.addEventListener("dragleave", () => {
        resumeDropzone.classList.remove("dragover");
    });

    resumeDropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        resumeDropzone.classList.remove("dragover");
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    resumeFileInput.addEventListener("change", (e) => {
        const files = e.target.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    removeFileBtn.addEventListener("click", (e) => {
        e.stopPropagation(); // Avoid triggering file chooser dialog
        state.resumeFile = null;
        resumeFileInput.value = "";
        fileInfoContainer.style.display = "none";
        resumeDropzone.querySelector(".dropzone-content").style.display = "block";
    });

    // Load Sample Button
    loadSampleBtn.addEventListener("click", () => {
        resumeTextarea.value = sampleResume;
        jdTextarea.value = sampleJd;
        // Scroll to JD textarea to make it obvious
        jdTextarea.scrollIntoView({ behavior: "smooth" });
    });

    // 3. View Switcher Helper
    const showView = (viewId) => {
        state.activeView = viewId;
        [inputView, loadingView, dashboardView].forEach(view => {
            if (view.id === viewId) {
                view.style.display = "block";
                setTimeout(() => view.classList.add("active"), 10);
            } else {
                view.classList.remove("active");
                view.style.display = "none";
            }
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // 4. Loading States Checklist Simulator
    const updateChecklistStep = (stepId, status) => {
        const item = document.getElementById(stepId);
        if (!item) return;
        item.className = `step-item ${status}`; // status: pending, active, done
    };

    const runLoadingStepsSimulation = async (callback) => {
        const steps = ["step-parse", "step-jd", "step-score-orig", "step-rewrite", "step-score-tail"];
        steps.forEach(s => updateChecklistStep(s, "pending"));
        
        for (let i = 0; i < steps.length; i++) {
            updateChecklistStep(steps[i], "active");
            // Simulate processing time
            await new Promise(resolve => setTimeout(resolve, 800));
            updateChecklistStep(steps[i], "done");
        }
        
        // Short pause before switching view
        await new Promise(resolve => setTimeout(resolve, 300));
        callback();
    };

    // 5. Submit Form Coordination
    tailorForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        state.resumeText = resumeTextarea.value.trim();
        state.jdText = jdTextarea.value.trim();
        
        if (!state.resumeText && !state.resumeFile) {
            alert("Please paste resume text or upload a resume file.");
            return;
        }

        if (state.jdText.length < 50) {
            alert("Please provide a job description containing at least 50 characters.");
            return;
        }

        // Swap to loading view
        showView("loading-view");

        // Parse file first if uploaded
        let parsedText = state.resumeText;
        if (state.resumeFile) {
            try {
                updateChecklistStep("step-parse", "active");
                const formData = new FormData();
                formData.append("file", state.resumeFile);
                
                const parseRes = await fetch("/api/parse", {
                    method: "POST",
                    body: formData
                });
                
                if (parseRes.ok) {
                    const parseData = await parseRes.json();
                    parsedText = parseData.text;
                }
            } catch (err) {
                console.error("Parsing service offline or failed, falling back to pasted text", err);
            }
        }

        // Run analysis
        try {
            // Trigger checklist animation in sync with fetch call
            let analysisCompleted = false;
            
            // Initiate background simulation
            const simulationPromise = runLoadingStepsSimulation(() => {
                analysisCompleted = true;
            });

            // Perform the real backend call
            const response = await fetch("/api/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    resumeText: parsedText || sampleResume,
                    jdText: state.jdText
                })
            });

            // Wait for both simulation to look nice and response to land
            await simulationPromise;
            
            if (response.ok) {
                const data = await response.json();
                state.tailoringRun = data;
                renderDashboard(data);
                showView("dashboard-view");
            } else {
                throw new Error("Server analysis failed");
            }

        } catch (error) {
            console.error("Using local mock tailoring run data due to server error", error);
            // Fallback mock data in case of failures (ensures Phase 2 static layout displays perfectly)
            const fallbackData = getFallbackMockData();
            state.tailoringRun = fallbackData;
            renderDashboard(fallbackData);
            showView("dashboard-view");
        }
    });

    // Return to inputs
    backInputsBtn.addEventListener("click", () => {
        showView("input-view");
    });

    // 6. PDF Export Handler
    exportPdfBtn.addEventListener("click", () => {
        // Before printing, ensure that any user edits in textareas are reflected in the DOM attribute value
        // simple CSS window.print fetches DOM attributes or value states. Textarea value modifications
        // do not update the raw HTML 'textContent' automatically. Let's force it.
        const editors = document.querySelectorAll(".interactive-bullet-editor");
        editors.forEach(editor => {
            const index = editor.dataset.index;
            const type = editor.dataset.type; // e.g. "exp" or "proj"
            const itemIndex = editor.dataset.itemindex;
            const bulletIndex = editor.dataset.bulletindex;
            
            // Sync values back to text area content so print styles capture current state
            editor.innerHTML = escapeHtml(editor.value);
        });

        window.print();
    });

    // 7. Render Dashboard Results
    const renderDashboard = (data) => {
        // Set Headers
        const jdTitle = data.tailoredResume.tailoredExperience[0]?.title || "Software Professional";
        const jdCompany = data.tailoredResume.tailoredExperience[0]?.company || "Target Company";
        dashJobTitle.textContent = jdTitle;
        dashCompany.textContent = `at ${jdCompany}`;
        
        // Update Dials
        const origScore = data.originalScore.overallScore;
        const tailScore = data.tailoredScore.overallScore;
        
        scoreValOriginal.textContent = origScore;
        scoreValTailored.textContent = tailScore;
        
        // Radial progress calculation: circumference = 2 * PI * r = 2 * 3.14159 * 15.9155 = 100
        gaugeFillOriginal.setAttribute("stroke-dasharray", `${origScore}, 100`);
        gaugeFillTailored.setAttribute("stroke-dasharray", `${tailScore}, 100`);

        // Render Breakdown
        breakdownList.innerHTML = `
            <div class="breakdown-item">
                <div class="item-label">Required Skills Coverage</div>
                <div class="progress-track"><div class="progress-bar" style="width: ${data.originalScore.skillCoverageScore}%;"></div></div>
                <span class="progress-percentage">${data.originalScore.skillCoverageScore}%</span>
            </div>
            <div class="breakdown-item">
                <div class="item-label">Responsibilities Fit</div>
                <div class="progress-track"><div class="progress-bar" style="width: ${data.originalScore.responsibilityAlignmentScore}%;"></div></div>
                <span class="progress-percentage">${data.originalScore.responsibilityAlignmentScore}%</span>
            </div>
            <div class="breakdown-item">
                <div class="item-label">Keyword Match Rate</div>
                <div class="progress-track"><div class="progress-bar" style="width: ${data.originalScore.keywordScore}%;"></div></div>
                <span class="progress-percentage">${data.originalScore.keywordScore}%</span>
            </div>
            <div class="breakdown-item">
                <div class="item-label">Seniority Alignment</div>
                <div class="progress-track"><div class="progress-bar" style="width: ${data.originalScore.seniorityScore}%;"></div></div>
                <span class="progress-percentage">${data.originalScore.seniorityScore}%</span>
            </div>
        `;

        // Render Score Explanation
        scoreExplanationBox.innerHTML = `<p>${escapeHtml(data.tailoredScore.explanation)}</p>`;

        // Render Gaps List
        gapsList.innerHTML = "";
        data.gaps.forEach(gap => {
            const gapItem = document.createElement("div");
            gapItem.className = "gap-item";
            gapItem.innerHTML = `
                <div class="gap-top">
                    <span class="gap-name">${escapeHtml(gap.name)}</span>
                    <span class="gap-importance-badge ${gap.importance}">${escapeHtml(gap.importance)} priority</span>
                </div>
                <div class="gap-evidence"><strong>JD Context:</strong> "${escapeHtml(gap.jdEvidence)}"</div>
                <div class="gap-action">${escapeHtml(gap.suggestedAction)}</div>
            `;
            gapsList.appendChild(gapItem);
        });

        // Render Comparison Table Sections
        comparisonSections.innerHTML = "";
        
        // Section A: Summary (if present)
        if (data.tailoredResume.tailoredSummary) {
            renderSectionHeader("Professional Summary");
            
            const origSummary = state.resumeText.match(/Summary[\s\S]*?(?=Skills|Experience|Projects|Education|$)/i)?.[0]
                ?.replace(/^Summary\s*/i, "")
                ?.trim() || "Dynamic software engineer looking for backend opportunities.";

            renderComparisonRow(
                origSummary,
                data.tailoredResume.tailoredSummary,
                "Summary optimized to reflect target seniority and highlight relevant architectural patterns requested in JD.",
                ["Backend", "Software Engineer"],
                "high",
                ""
            );
        }

        // Section B: Experience Section
        if (data.tailoredResume.tailoredExperience && data.tailoredResume.tailoredExperience.length > 0) {
            renderSectionHeader("Professional Experience");
            
            data.tailoredResume.tailoredExperience.forEach((job, jobIdx) => {
                const jobTitleRow = document.createElement("div");
                jobTitleRow.className = "comparison-row section-header-row";
                jobTitleRow.innerHTML = `
                    <div class="section-header-col" style="font-size: 0.82rem; background: rgba(0,0,0,0.4); border-top: 1px solid rgba(255,255,255,0.05);">
                        ${escapeHtml(job.company)} &bull; ${escapeHtml(job.title)}
                    </div>
                `;
                comparisonSections.appendChild(jobTitleRow);
                
                job.bullets.forEach((bullet, bulletIdx) => {
                    renderComparisonRow(
                        bullet.original,
                        bullet.tailored,
                        bullet.changeReason,
                        bullet.keywordsAddressed,
                        bullet.confidence,
                        bullet.riskFlag,
                        `exp-${jobIdx}-${bulletIdx}`,
                        (newText) => {
                            // Update active state when user edits
                            state.tailoringRun.tailoredResume.tailoredExperience[jobIdx].bullets[bulletIdx].tailored = newText;
                        }
                    );
                });
            });
        }

        // Section C: Projects Section
        if (data.tailoredResume.tailoredProjects && data.tailoredResume.tailoredProjects.length > 0) {
            renderSectionHeader("Projects");
            
            data.tailoredResume.tailoredProjects.forEach((proj, projIdx) => {
                const projTitleRow = document.createElement("div");
                projTitleRow.className = "comparison-row section-header-row";
                projTitleRow.innerHTML = `
                    <div class="section-header-col" style="font-size: 0.82rem; background: rgba(0,0,0,0.4); border-top: 1px solid rgba(255,255,255,0.05);">
                        ${escapeHtml(proj.name)}
                    </div>
                `;
                comparisonSections.appendChild(projTitleRow);
                
                proj.bullets.forEach((bullet, bulletIdx) => {
                    renderComparisonRow(
                        bullet.original,
                        bullet.tailored,
                        bullet.changeReason,
                        bullet.keywordsAddressed,
                        bullet.confidence,
                        bullet.riskFlag,
                        `proj-${projIdx}-${bulletIdx}`,
                        (newText) => {
                            state.tailoringRun.tailoredResume.tailoredProjects[projIdx].bullets[bulletIdx].tailored = newText;
                        }
                    );
                });
            });
        }
    };

    const renderSectionHeader = (title) => {
        const headerRow = document.createElement("div");
        headerRow.className = "comparison-row section-header-row";
        headerRow.innerHTML = `<div class="section-header-col">${escapeHtml(title)}</div>`;
        comparisonSections.appendChild(headerRow);
    };

    const renderComparisonRow = (original, tailored, reason, keywords, confidence, riskFlag, id, onEdit) => {
        const row = document.createElement("div");
        row.className = "comparison-row bullet-row";
        
        const origId = `orig-${id}`;
        const tailId = `tail-${id}`;
        const diffDisplayId = `diff-display-${id}`;
        
        const keywordsHTML = keywords.map(kw => `<span class="keyword-tag">${escapeHtml(kw)}</span>`).join("");
        
        let riskHTML = "";
        if (riskFlag) {
            riskHTML = `
                <div class="risk-alert">
                    <strong>Guardrail Warning:</strong> ${escapeHtml(riskFlag)}
                </div>
            `;
        }

        row.innerHTML = `
            <!-- Left Side: Original -->
            <div class="comparison-col original-col" id="${origId}">
                ${escapeHtml(original)}
            </div>
            
            <!-- Right Side: Tailored suggestions + interactive editor -->
            <div class="comparison-col tailored-col">
                <!-- Visual diff presentation -->
                <div class="diff-display" id="${diffDisplayId}">
                    ${diffWords(original, tailored)}
                </div>
                
                <!-- Interactive Text Area editor -->
                <textarea 
                    class="interactive-bullet-editor no-print" 
                    id="${tailId}" 
                    data-id="${id}"
                >${escapeHtml(tailored)}</textarea>
                
                <!-- Metadata card -->
                <div class="bullet-meta no-print">
                    <div class="meta-line">
                        <strong>Reason:</strong> 
                        <span class="reason-text">${escapeHtml(reason)}</span>
                    </div>
                    <div class="meta-line">
                        <strong>Keywords:</strong> 
                        <div class="keyword-tags">${keywordsHTML}</div>
                    </div>
                    <div class="meta-line confidence-badges">
                        <strong>Confidence:</strong> 
                        <span class="badge ${confidence}">${confidence}</span>
                    </div>
                    ${riskHTML}
                </div>
            </div>
        `;
        
        comparisonSections.appendChild(row);

        // Interactive event listener for real-time diff recalculation
        const editor = row.querySelector(`#${tailId}`);
        const diffDisplay = row.querySelector(`#${diffDisplayId}`);
        
        editor.addEventListener("input", (e) => {
            const revisedText = e.target.value;
            // Update diff visualization
            diffDisplay.innerHTML = diffWords(original, revisedText);
            // Fire callback to sync in state
            if (onEdit) onEdit(revisedText);
        });
    };

    // 8. Pure JS LCS Word Diff Helper
    function diffWords(orig, rev) {
        // Clean and tokenize text into words and punctuation
        const o = orig.split(/(\s+)/).filter(x => x.length > 0);
        const r = rev.split(/(\s+)/).filter(x => x.length > 0);
        
        // DP Array allocation
        const dp = Array(o.length + 1).fill(null).map(() => Array(r.length + 1).fill(0));
        
        // Solve Longest Common Subsequence
        for (let i = 1; i <= o.length; i++) {
            for (let j = 1; j <= r.length; j++) {
                if (o[i-1] === r[j-1]) {
                    dp[i][j] = dp[i-1][j-1] + 1;
                } else {
                    dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);
                }
            }
        }
        
        // Backtrack DP path
        let i = o.length;
        let j = r.length;
        const diff = [];
        
        while (i > 0 || j > 0) {
            if (i > 0 && j > 0 && o[i-1] === r[j-1]) {
                diff.push({ type: 'common', value: o[i-1] });
                i--;
                j--;
            } else if (j > 0 && (i === 0 || dp[i][j-1] >= dp[i-1][j])) {
                diff.push({ type: 'added', value: r[j-1] });
                j--;
            } else {
                diff.push({ type: 'deleted', value: o[i-1] });
                i--;
            }
        }
        diff.reverse();
        
        // Return colored markup
        return diff.map(part => {
            if (part.type === 'added') {
                return `<ins>${escapeHtml(part.value)}</ins>`;
            } else if (part.type === 'deleted') {
                return `<del>${escapeHtml(part.value)}</del>`;
            } else {
                return escapeHtml(part.value);
            }
        }).join('');
    }

    function escapeHtml(str) {
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // 9. Fallback Local Data (in case API is unreachable)
    const getFallbackMockData = () => {
        return {
            "originalScore": {
                "overallScore": 45,
                "skillCoverageScore": 50,
                "responsibilityAlignmentScore": 40,
                "keywordScore": 30,
                "seniorityScore": 60,
                "criticalMissingRequirements": ["Docker", "Kubernetes"],
                "explanation": "The original resume has moderate alignment. It misses key orchestration technologies (Docker/Kubernetes) and lacks specific backend system metrics requested in the JD."
            },
            "tailoredScore": {
                "overallScore": 85,
                "skillCoverageScore": 90,
                "responsibilityAlignmentScore": 85,
                "keywordScore": 80,
                "seniorityScore": 90,
                "criticalMissingRequirements": [],
                "explanation": "The tailored resume has high alignment. Phrasing has been optimized to emphasize cloud deployment and system scale, improving overall semantic matching and keyword density without fabricating credentials."
            },
            "gaps": [
                {
                    "name": "Docker & Kubernetes",
                    "importance": "high",
                    "jdEvidence": "Experience with Docker, Kubernetes, and cloud native architectures is required.",
                    "resumeEvidence": "No mention of containerization in original resume.",
                    "suggestedAction": "Prepare to address this in interview. If you have basic familiarity, mention it in the skills section or add a personal project bullet.",
                    "canSafelyAdd": false
                },
                {
                    "name": "CI/CD Pipeline Optimization",
                    "importance": "medium",
                    "jdEvidence": "Maintain and improve CI/CD pipelines for high reliability.",
                    "resumeEvidence": "Mentions maintaining Jenkins but lacks metrics on deployment speed or success rates.",
                    "suggestedAction": "Add details to the Jenkins bullet if you have experience with pipeline optimization or metrics.",
                    "canSafelyAdd": true
                }
            ],
            "tailoredResume": {
                "tailoredSummary": "Results-oriented Software Engineer with 4+ years of experience designing and deploying scalable backend services. Adept at optimizing system performance and improving codebase quality through automated pipelines.",
                "tailoredSkills": ["Python", "JavaScript", "SQL", "Jenkins", "Git", "REST APIs", "Flask"],
                "tailoredExperience": [
                    {
                        "company": "Tech Solutions Inc.",
                        "title": "Software Engineer",
                        "bullets": [
                            {
                                "original": "Worked on a web application development team using Python.",
                                "tailored": "Engineered scalable web application backends utilizing Python and Flask, improving API response times.",
                                "changeReason": "Stronger action verbs and specific framework emphasis matching the JD description.",
                                "keywordsAddressed": ["Python", "Web application", "Backend"],
                                "confidence": "high",
                                "riskFlag": ""
                            },
                            {
                                "original": "Helped manage deployment pipelines using Jenkins.",
                                "tailored": "Maintained and streamlined deployment pipelines using Jenkins CI/CD to accelerate delivery cycles.",
                                "changeReason": "Aligned with the JD requirement of maintaining CI/CD pipelines.",
                                "keywordsAddressed": ["Jenkins", "CI/CD", "Pipelines"],
                                "confidence": "high",
                                "riskFlag": ""
                            }
                        ]
                    }
                ],
                "tailoredProjects": [
                    {
                        "name": "E-Commerce System Mock",
                        "bullets": [
                            {
                                "original": "Made an e-commerce site with Python.",
                                "tailored": "Architected a prototype e-commerce backend platform in Python, exposing modular REST endpoints.",
                                "changeReason": "Emphasizes architecture and API design elements requested in JD.",
                                "keywordsAddressed": ["Python", "REST APIs", "Backend"],
                                "confidence": "medium",
                                "riskFlag": ""
                            }
                        ]
                    }
                ]
            }
        };
    };
});
