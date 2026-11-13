(function () {
    const STORAGE_KEY = "wl_chatbot_state_v2";

    function readPageContext() {
        const marker = document.getElementById("wl-chat-context");
        const params = new URLSearchParams(window.location.search);
        const queryLoc = params.get("q") || "";
        const categoryParam = params.get("category") || "";

        if (marker) {
            return {
                location: (marker.dataset.location || queryLoc || "").trim(),
                country: (marker.dataset.country || "").trim(),
                title: (marker.dataset.title || "").trim(),
                category: (marker.dataset.category || categoryParam || "").trim(),
                price: (marker.dataset.price || "").trim(),
                page: window.location.pathname
            };
        }

        return {
            location: queryLoc.trim(),
            country: "",
            title: "",
            category: categoryParam.trim(),
            price: "",
            page: window.location.pathname
        };
    }

    function fallbackInbuiltSuggestions(context) {
        const loc = (context.location || context.country || "").trim();
        if (loc) {
            return [
                `What makes ${loc} special & famous?`,
                `Must-try local food & specialties in ${loc}`,
                `Best nearby places & distances from ${loc}`,
                `Best time to visit & solo travel tips for ${loc}`,
                `How many days are ideal for exploring ${loc}?`
            ];
        }
        return [
            "What makes Manali special & famous?",
            "Distance, travel time & best route from Delhi to Manali",
            "Must-try local food & hidden gems in Goa",
            "Top heritage places & distances in Jaipur",
            "Plan a 3-day trip between Udaipur and Jodhpur"
        ];
    }

    function parseLineSegments(lineText) {
        const parts = String(lineText || "").split(/(\*\*[^*]+\*\*)/g);
        const segments = [];
        parts.forEach((part) => {
            if (!part) return;
            if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
                segments.push({ text: part.slice(2, -2), bold: true });
            } else {
                segments.push({ text: part, bold: false });
            }
        });
        return segments;
    }

    function splitReplyLines(text) {
        const rawLines = String(text || "")
            .split(/\r?\n/)
            .map((l) => l.trim())
            .filter(Boolean);

        if (rawLines.length === 1 && rawLines[0].length > 120) {
            const sentences = rawLines[0].split(/(?<=[.!?])\s+/).filter(Boolean);
            if (sentences.length > 1) {
                return sentences;
            }
        }
        return rawLines;
    }

    function createLineHost(container, rawLine, listState, animate) {
        const isBullet = rawLine.startsWith("- ") || rawLine.startsWith("* ");
        const cleanText = isBullet ? rawLine.slice(2).trim() : rawLine;

        let el;
        if (isBullet) {
            if (!listState.listEl) {
                listState.listEl = document.createElement("ul");
                listState.listEl.className = "wl-chat-list";
                container.appendChild(listState.listEl);
            }
            el = document.createElement("li");
            if (animate) el.className = "wl-chat-line-enter";
            listState.listEl.appendChild(el);
        } else {
            listState.listEl = null;
            el = document.createElement("p");
            el.className = animate ? "wl-chat-p wl-chat-line-enter" : "wl-chat-p";
            container.appendChild(el);
        }

        return { el, segments: parseLineSegments(cleanText) };
    }

    function renderCompleteLines(container, text) {
        const lines = splitReplyLines(text);
        const listState = { listEl: null };
        lines.forEach((rawLine) => {
            const { el, segments } = createLineHost(container, rawLine, listState, false);
            segments.forEach((seg) => {
                if (seg.bold) {
                    const strong = document.createElement("strong");
                    strong.textContent = seg.text;
                    el.appendChild(strong);
                } else {
                    el.appendChild(document.createTextNode(seg.text));
                }
            });
        });
    }

    document.addEventListener("DOMContentLoaded", function () {
        const root = document.getElementById("wl-chatbot-root");
        if (!root) return;

        let csrfToken = root.dataset.csrf || "";
        const toggleBtn = document.getElementById("wl-chatbot-toggle");
        const panel = document.getElementById("wl-chatbot-panel");
        const closeBtn = document.getElementById("wl-chatbot-close");
        const resetBtn = document.getElementById("wl-chatbot-reset-btn");
        const messagesEl = document.getElementById("wl-chatbot-messages");
        const form = document.getElementById("wl-chatbot-form");
        const input = document.getElementById("wl-chatbot-input");
        const sendBtn = document.getElementById("wl-chatbot-send");
        const locationPill = document.getElementById("wl-chatbot-location-pill");

        const context = readPageContext();
        let inbuiltSuggestions = fallbackInbuiltSuggestions(context);
        let isSending = false;
        let activeStreamId = 0;
        let activeStreamTimer = null;
        let state = {
            open: false,
            messages: []
        };

        try {
            const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
            if (saved && Array.isArray(saved.messages)) {
                state = {
                    open: Boolean(saved.open),
                    messages: saved.messages.slice(-20)
                };
            }
        } catch (err) {
            // Ignore malformed sessionStorage
        }

        function persistState() {
            try {
                sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
                    open: state.open,
                    messages: state.messages.slice(-20)
                }));
            } catch (err) {
                // Ignore storage quota issues
            }
        }

        function updateLocationPill(customLoc) {
            const locLabel = (customLoc || [context.location, context.country].filter(Boolean).join(", ")).trim();
            if (locLabel) {
                locationPill.textContent = locLabel;
                locationPill.classList.remove("d-none");
            } else {
                locationPill.classList.add("d-none");
            }
        }

        function cancelActiveStream() {
            activeStreamId += 1;
            if (activeStreamTimer) {
                clearTimeout(activeStreamTimer);
                activeStreamTimer = null;
            }
        }

        function ensureWelcomeMessage() {
            if (state.messages.length > 0) return;
            const focusPlace = [context.location, context.country].filter(Boolean).join(", ");
            const intro = focusPlace
                ? `Hi! I'm your **Wanderlust Guide**. Ask me anything about **${focusPlace}**, distances to nearby places, local specialties, or anywhere in the world.`
                : "Hi! I'm your **Wanderlust Guide**. Ask me about any place, distances between cities, local food, or travel tips.";
            state.messages.push({
                role: "model",
                text: intro
            });
        }

        function appendStartSuggestions(container) {
            if (!Array.isArray(inbuiltSuggestions) || inbuiltSuggestions.length === 0) return;
            const wrap = document.createElement("div");
            wrap.id = "wl-chatbot-inbuilt-chips";
            wrap.className = "wl-chat-start-suggestions";

            const label = document.createElement("div");
            label.className = "wl-chat-related-label";
            label.textContent = "Suggested questions to start:";
            wrap.appendChild(label);

            const chips = document.createElement("div");
            chips.className = "wl-chat-chips";
            inbuiltSuggestions.forEach((text) => {
                const btn = document.createElement("button");
                btn.type = "button";
                btn.className = "wl-chat-chip";
                btn.textContent = text;
                btn.addEventListener("click", () => submitQuestion(text));
                chips.appendChild(btn);
            });
            wrap.appendChild(chips);
            container.appendChild(wrap);
        }

        function renderMessages() {
            ensureWelcomeMessage();
            messagesEl.innerHTML = "";

            const hasUserChatted = state.messages.some((m) => m.role === "user");

            state.messages.forEach((msg) => {
                const row = document.createElement("div");
                row.className = `wl-chat-msg ${msg.role === "user" ? "wl-chat-msg-user" : "wl-chat-msg-bot"}`;

                const bubble = document.createElement("div");
                bubble.className = "wl-chat-bubble";
                renderCompleteLines(bubble, msg.text);
                row.appendChild(bubble);
                messagesEl.appendChild(row);
            });

            // Show starter suggestions ONLY at the very start before user sends any chat
            if (!hasUserChatted && !isSending) {
                appendStartSuggestions(messagesEl);
            }

            if (isSending) {
                const typingRow = document.createElement("div");
                typingRow.className = "wl-chat-msg wl-chat-msg-bot";
                const typingBubble = document.createElement("div");
                typingBubble.className = "wl-chat-bubble wl-chat-typing";
                typingBubble.textContent = "Thinking...";
                typingRow.appendChild(typingBubble);
                messagesEl.appendChild(typingRow);
            }

            messagesEl.scrollTop = messagesEl.scrollHeight;
        }

        function streamLatestBotMessage(msg) {
            cancelActiveStream();
            const streamId = activeStreamId;
            state.messages.push(msg);
            persistState();

            isSending = false;
            const lines = splitReplyLines(msg.text);
            const allExceptLast = state.messages.slice(0, -1);

            messagesEl.innerHTML = "";
            allExceptLast.forEach((m) => {
                const prevRow = document.createElement("div");
                prevRow.className = `wl-chat-msg ${m.role === "user" ? "wl-chat-msg-user" : "wl-chat-msg-bot"}`;
                const prevBubble = document.createElement("div");
                prevBubble.className = "wl-chat-bubble";
                renderCompleteLines(prevBubble, m.text);
                prevRow.appendChild(prevBubble);
                messagesEl.appendChild(prevRow);
            });

            const row = document.createElement("div");
            row.className = "wl-chat-msg wl-chat-msg-bot";
            const bubble = document.createElement("div");
            bubble.className = "wl-chat-bubble";
            row.appendChild(bubble);
            messagesEl.appendChild(row);

            if (lines.length === 0) {
                sendBtn.disabled = false;
                input.focus();
                return;
            }

            const listState = { listEl: null };
            let lineIdx = 0;

            function streamNextLine() {
                if (streamId !== activeStreamId) return;

                if (lineIdx >= lines.length) {
                    messagesEl.scrollTop = messagesEl.scrollHeight;
                    sendBtn.disabled = false;
                    input.focus();
                    return;
                }

                const { el, segments } = createLineHost(bubble, lines[lineIdx], listState, true);
                let segIdx = 0;
                let charIdx = 0;
                let activeNode = null;

                function typeNextChunk() {
                    if (streamId !== activeStreamId) return;

                    if (segIdx >= segments.length) {
                        lineIdx += 1;
                        messagesEl.scrollTop = messagesEl.scrollHeight;
                        activeStreamTimer = setTimeout(streamNextLine, 220);
                        return;
                    }

                    const seg = segments[segIdx];
                    if (!activeNode) {
                        if (seg.bold) {
                            const strong = document.createElement("strong");
                            el.appendChild(strong);
                            activeNode = document.createTextNode("");
                            strong.appendChild(activeNode);
                        } else {
                            activeNode = document.createTextNode("");
                            el.appendChild(activeNode);
                        }
                    }

                    const nextCharIdx = Math.min(seg.text.length, charIdx + 3);
                    activeNode.textContent += seg.text.slice(charIdx, nextCharIdx);
                    charIdx = nextCharIdx;

                    if (charIdx >= seg.text.length) {
                        segIdx += 1;
                        charIdx = 0;
                        activeNode = null;
                    }

                    messagesEl.scrollTop = messagesEl.scrollHeight;
                    activeStreamTimer = setTimeout(typeNextChunk, 16);
                }

                typeNextChunk();
            }

            streamNextLine();
        }

        function setOpen(shouldOpen) {
            state.open = shouldOpen;
            panel.classList.toggle("d-none", !shouldOpen);
            toggleBtn.setAttribute("aria-expanded", String(shouldOpen));
            persistState();
            if (shouldOpen) {
                renderMessages();
                setTimeout(() => input.focus(), 60);
            }
        }

        async function loadSuggestions() {
            try {
                const qs = new URLSearchParams();
                if (context.location) qs.set("location", context.location);
                if (context.country) qs.set("country", context.country);
                if (context.title) qs.set("title", context.title);
                const resp = await fetch(`/api/chat/suggestions?${qs.toString()}`);
                if (!resp.ok) return false;
                const data = await resp.json();
                if (data.csrfToken) {
                    csrfToken = data.csrfToken;
                }
                if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
                    inbuiltSuggestions = data.suggestions;
                    if (!state.messages.some((m) => m.role === "user")) {
                        renderMessages();
                    }
                }
                return true;
            } catch (err) {
                return false;
            }
        }

        async function sendChatRequest(question, historyPayload) {
            const doFetch = () => fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-csrf-token": csrfToken
                },
                body: JSON.stringify({
                    message: question,
                    history: historyPayload,
                    context
                })
            });

            let resp = await doFetch();
            if (resp.status === 403) {
                await loadSuggestions();
                resp = await doFetch();
            }
            return resp;
        }

        async function submitQuestion(rawQuestion) {
            const question = String(rawQuestion || "").trim();
            if (!question || isSending) return;

            cancelActiveStream();
            const historyPayload = state.messages
                .filter((m) => m.role === "user" || m.role === "model")
                .slice(-10)
                .map((m) => ({ role: m.role, text: m.text }));

            state.messages.push({ role: "user", text: question });
            isSending = true;
            sendBtn.disabled = true;
            input.value = "";
            persistState();
            renderMessages();

            let streamed = false;
            try {
                const resp = await sendChatRequest(question, historyPayload);
                const data = await resp.json();
                if (!resp.ok) {
                    throw new Error(data.error || "Could not get an answer right now.");
                }

                if (data.detectedLocation) {
                    updateLocationPill(data.detectedLocation);
                }
                if (Array.isArray(data.inbuiltSuggestions) && data.inbuiltSuggestions.length > 0) {
                    inbuiltSuggestions = data.inbuiltSuggestions;
                }

                streamed = true;
                streamLatestBotMessage({
                    role: "model",
                    text: data.reply
                });
            } catch (err) {
                const friendlyError = (err && err.name === "TypeError")
                    ? "Could not connect to the Travel AI server right now. Please make sure the app is running or refresh the page."
                    : (err && err.message ? err.message : "Sorry, something went wrong. Please try again.");

                streamed = true;
                streamLatestBotMessage({
                    role: "model",
                    text: friendlyError
                });
            } finally {
                if (!streamed) {
                    isSending = false;
                    sendBtn.disabled = false;
                    persistState();
                    renderMessages();
                    input.focus();
                }
            }
        }

        toggleBtn.addEventListener("click", () => setOpen(!state.open));
        closeBtn.addEventListener("click", () => setOpen(false));

        resetBtn.addEventListener("click", () => {
            cancelActiveStream();
            isSending = false;
            sendBtn.disabled = false;
            state.messages = [];
            updateLocationPill("");
            persistState();
            renderMessages();
            loadSuggestions();
        });

        form.addEventListener("submit", (e) => {
            e.preventDefault();
            submitQuestion(input.value);
        });

        updateLocationPill("");
        loadSuggestions();
        setOpen(state.open);
    });
})();
