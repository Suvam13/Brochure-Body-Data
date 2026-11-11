document.addEventListener("DOMContentLoaded", () => {
    function renderLaws(topicKey) {
        const rowsContainer = document.querySelector("#brochure-root .laws-rows-container");
        if (!rowsContainer) return;

        rowsContainer.innerHTML = "";
        const lawsList = brochureData[topicKey];

        lawsList.forEach((lawItem, index) => {
            const isEven = index % 2 === 0;
            const rowClass = isEven ? "row-alt-1" : "row-alt-2";
            
            let stickyButtonsHTML = "";
            lawItem.sections.forEach((sec, secIndex) => {
                // Add an 'active' class to the first button by default
                const activeClass = secIndex === 0 ? "active" : "";
                stickyButtonsHTML += `<button class="sticky-note-btn ${activeClass}" data-sec-id="${sec.id}">${sec.id}</button>`;
            });

            const rowDiv = document.createElement("div");
            rowDiv.className = `law-row ${rowClass}`;

            const firstSection = lawItem.sections[0];

            let bookColumnHTML = `
                <div class="book-column">
                    <div class="book-cover">
                        <h3>${lawItem.lawName}</h3>
                        <div class="book-spine-lines"><span></span><span></span><span></span></div>
                    </div>
                    <div class="sticky-notes-wrapper ${isEven ? 'right-tabs' : 'left-tabs'}">
                        ${stickyButtonsHTML}
                    </div>
                </div>
            `;

            let contentColumnHTML = `
                <div class="content-column">
                    <h3 class="section-badge">${firstSection ? firstSection.id : 'Section'}</h3>
                    <h4 class="section-subtitle">${firstSection ? firstSection.title : '[ Section Content / Article View ]'}</h4>
                    <p>${firstSection ? firstSection.content : 'Click a sticky note to load legal text...'}</p>
                </div>
            `;

            if (isEven) {
                rowDiv.innerHTML = bookColumnHTML + contentColumnHTML;
            } else {
                rowDiv.innerHTML = contentColumnHTML + bookColumnHTML;
            }

            rowsContainer.appendChild(rowDiv);
        });

        initStickyNotes(topicKey);
    }

    function initStickyNotes(topicKey) {
        const rows = document.querySelectorAll("#brochure-root .law-row");

        rows.forEach(row => {
            const stickyNotes = row.querySelectorAll(".sticky-note-btn");
            const contentColumn = row.querySelector(".content-column");

            // Helper function to update the pointer CSS variable relative to a button
            const updatePointer = (activeBtn) => {
                const contentRect = contentColumn.getBoundingClientRect();
                const btnRect = activeBtn.getBoundingClientRect();
                const relativeTop = (btnRect.top + btnRect.height / 2) - contentRect.top;
                contentColumn.style.setProperty('--active-tab-top', `${relativeTop}px`);
            };

            // Set initial pointer position for the default active (first) tab once rendered
            const defaultActiveBtn = row.querySelector(".sticky-note-btn.active") || stickyNotes[0];
            if (defaultActiveBtn) {
                // Use requestAnimationFrame to ensure DOM dimensions are computed
                requestAnimationFrame(() => updatePointer(defaultActiveBtn));
            }

            stickyNotes.forEach((note) => {
                note.addEventListener("click", (e) => {
                    const clickedBtn = e.currentTarget;
                    const secId = clickedBtn.getAttribute("data-sec-id");
                    
                    const lawRows = brochureData[topicKey];
                    let foundSection = null;

                    lawRows.forEach(law => {
                        const match = law.sections.find(s => s.id === secId);
                        if (match) foundSection = match;
                    });

                    if (foundSection) {
                        contentColumn.innerHTML = `
                            <h3 class="section-badge">${secId}</h3>
                            <h4 class="section-subtitle">${foundSection.title}</h4>
                            <p>${foundSection.content}</p>
                        `;
                    }

                    // Update active state. Colors come from CSS, not inline styles.
                    stickyNotes.forEach(btn => btn.classList.remove("active"));
                    clickedBtn.classList.add("active");

                    // Dynamically update the pointer position to point at this clicked button
                    updatePointer(clickedBtn);
                });
            });
        });
    }

    const tabButtons = document.querySelectorAll("#brochure-root .tab-btn");
    
    tabButtons.forEach(button => {
        button.addEventListener("click", (e) => {
            tabButtons.forEach(btn => btn.classList.remove("active"));
            e.currentTarget.classList.add("active");

            const selectedTarget = e.currentTarget.getAttribute("data-target");
            renderLaws(selectedTarget);
        });
    });

    // Initial load
    renderLaws("expression");
});
