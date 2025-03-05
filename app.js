document.addEventListener('DOMContentLoaded', function() {
    // Show loading indicator
    document.getElementById('content').innerHTML = `
        <div class="loading-spinner">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p>Loading content...</p>
        </div>
    `;
    
    // Add language selector
    addLanguageSelector();
    
    // Load content based on selected language
    loadContentForLanguage(getCurrentLanguage());
    
    // Initialize dark mode
    initDarkMode();
    
    // Add back to top button
    addBackToTopButton();
});

// Get current language from localStorage or default to English
function getCurrentLanguage() {
    return localStorage.getItem('preferredLanguage') || 'en';
}

// Add language selector to the page
function addLanguageSelector() {
    const sidebar = document.querySelector('.sidebar-sticky');
    
    // Create language selector container
    const langContainer = document.createElement('div');
    langContainer.className = 'language-selector';
    
    // Create language selector
    const langSelector = document.createElement('div');
    langSelector.className = 'btn-group w-100';
    langSelector.setAttribute('role', 'group');
    
    // English button
    const enBtn = document.createElement('button');
    enBtn.type = 'button';
    enBtn.className = 'btn ' + (getCurrentLanguage() === 'en' ? 'btn-primary' : 'btn-outline-primary');
    enBtn.innerHTML = '<span class="flag-icon">🇬🇧</span><span>English</span>';
    enBtn.setAttribute('aria-label', 'Switch to English');
    enBtn.addEventListener('click', function() {
        if (getCurrentLanguage() !== 'en') {
            localStorage.setItem('preferredLanguage', 'en');
            window.location.reload();
        }
    });
    
    // French button
    const frBtn = document.createElement('button');
    frBtn.type = 'button';
    frBtn.className = 'btn ' + (getCurrentLanguage() === 'fr' ? 'btn-primary' : 'btn-outline-primary');
    frBtn.innerHTML = '<span class="flag-icon">🇫🇷</span><span>Français</span>';
    frBtn.setAttribute('aria-label', 'Switch to French');
    frBtn.addEventListener('click', function() {
        if (getCurrentLanguage() !== 'fr') {
            localStorage.setItem('preferredLanguage', 'fr');
            window.location.reload();
        }
    });
    
    // Add buttons to selector
    langSelector.appendChild(enBtn);
    langSelector.appendChild(frBtn);
    
    // Add selector to container
    langContainer.appendChild(langSelector);
    
    // Add container to sidebar
    sidebar.insertBefore(langContainer, sidebar.firstChild);
}

// Load content based on language
function loadContentForLanguage(language) {
    // Determine which files to load based on language
    const mainFile = language === 'fr' ? 'MtF_Transition_Research_FR.md' : 'MtF_Transition_Research.md';
    const disclaimerFile = language === 'fr' ? 'disclaimer_FR.md' : 'disclaimer.md';
    
    // Update sidebar heading based on language
    const sidebarHeading = document.querySelector('.sidebar-heading');
    if (sidebarHeading) {
        sidebarHeading.textContent = language === 'fr' 
            ? 'Recherche Scientifique sur la Transition MtF' 
            : 'Scientific Research on MtF Transition';
    }
    
    // Fetch the markdown file
    fetch(mainFile)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.text();
        })
        .then(markdown => {
            // Process the markdown content
            processMarkdown(markdown);
            
            // Add disclaimer link to the table of contents
            addDisclaimerLink(language);
            
            // Now that sections are loaded, handle URL hash if present
            const hash = window.location.hash.substring(1);
            if (hash && window.documentSections) {
                if (hash === 'disclaimer') {
                    loadDisclaimer(language);
                } else {
                    loadSection(hash);
                }
            } else if (window.documentSections && window.documentSections.length > 0) {
                loadSection(window.documentSections[0].id);
            }
        })
        .catch(error => {
            console.error('Error loading markdown file:', error);
            document.getElementById('content').innerHTML = `
                <div class="alert alert-danger">
                    <h4>${language === 'fr' ? 'Erreur de Chargement du Contenu' : 'Error Loading Content'}</h4>
                    <p>${language === 'fr' ? 'Désolé, il y a eu un problème lors du chargement du document. Veuillez réessayer plus tard.' : 'Sorry, there was a problem loading the document. Please try again later.'}</p>
                    <p>${language === 'fr' ? 'Détails techniques:' : 'Technical details:'} ${error.message}</p>
                </div>
            `;
        });
}

function processMarkdown(markdown) {
    // Parse the markdown into sections
    const sections = parseMarkdownSections(markdown);
    
    // Create the table of contents
    createTableOfContents(sections);
    
    // Store sections in a global variable for access by navigation functions
    window.documentSections = sections;
}

function parseMarkdownSections(markdown) {
    const sections = [];
    
    // Split the markdown by section headers (## **X. Title**)
    const sectionRegex = /^## \*\*((\d+)\. (.+?))\*\*/gm;
    let match;
    let lastIndex = 0;
    let sectionId = 0;
    
    // Find all section headers
    while ((match = sectionRegex.exec(markdown)) !== null) {
        sectionId++;
        const fullTitle = match[1].trim(); // Full title with number
        const sectionNumber = match[2].trim(); // Just the number
        const title = match[3].trim(); // Just the title text
        const startIndex = match.index;
        
        // If this isn't the first section, save the previous section content
        if (startIndex > 0 && sections.length > 0) {
            const previousSection = sections[sections.length - 1];
            previousSection.content = markdown.substring(lastIndex, startIndex).trim();
        }
        
        // Add the new section
        sections.push({
            id: `section-${sectionId}`,
            title: title,
            sectionNumber: sectionNumber,
            content: ''
        });
        
        lastIndex = startIndex;
    }
    
    // Add the content for the last section
    if (sections.length > 0) {
        const lastSection = sections[sections.length - 1];
        lastSection.content = markdown.substring(lastIndex).trim();
    }
    
    return sections;
}

function createTableOfContents(sections) {
    const tocElement = document.getElementById('table-of-contents');
    tocElement.innerHTML = '';
    
    sections.forEach(section => {
        const link = document.createElement('a');
        link.href = `#${section.id}`;
        link.className = 'nav-link';
        
        // Create span for section number
        const numberSpan = document.createElement('span');
        numberSpan.className = 'section-number';
        numberSpan.textContent = section.sectionNumber;
        
        // Create span for section title
        const titleSpan = document.createElement('span');
        titleSpan.className = 'section-title';
        titleSpan.textContent = ` ${section.title}`;
        
        // Add spans to link
        link.appendChild(numberSpan);
        link.appendChild(titleSpan);
        link.dataset.sectionId = section.id;
        
        link.addEventListener('click', function(e) {
            e.preventDefault();
            loadSection(section.id);
            
            // Update active link
            document.querySelectorAll('.nav-link').forEach(el => {
                el.classList.remove('active');
            });
            this.classList.add('active');
            
            // Update URL hash without scrolling
            history.pushState(null, null, `#${section.id}`);
        });
        
        tocElement.appendChild(link);
    });
}

// Add disclaimer link to the table of contents
function addDisclaimerLink(language) {
    const tocElement = document.getElementById('table-of-contents');
    
    // Add a separator
    const separator = document.createElement('hr');
    separator.className = 'toc-separator';
    tocElement.appendChild(separator);
    
    // Add the disclaimer link
    const disclaimerLink = document.createElement('a');
    disclaimerLink.href = '#disclaimer';
    disclaimerLink.className = 'nav-link';
    
    // Create span for section number
    const numberSpan = document.createElement('span');
    numberSpan.className = 'section-number';
    numberSpan.textContent = 'i';
    
    // Create span for section title
    const titleSpan = document.createElement('span');
    titleSpan.className = 'section-title';
    titleSpan.textContent = ' ' + (language === 'fr' ? 'À Propos de ce Document' : 'About This Document');
    
    // Add spans to link
    disclaimerLink.appendChild(numberSpan);
    disclaimerLink.appendChild(titleSpan);
    disclaimerLink.dataset.sectionId = 'disclaimer';
    
    disclaimerLink.addEventListener('click', function(e) {
        e.preventDefault();
        loadDisclaimer(language);
        
        // Update active link
        document.querySelectorAll('.nav-link').forEach(el => {
            el.classList.remove('active');
        });
        this.classList.add('active');
        
        // Update URL hash without scrolling
        history.pushState(null, null, '#disclaimer');
    });
    
    tocElement.appendChild(disclaimerLink);
    
    // Add legal information link
    const legalLink = document.createElement('a');
    legalLink.href = '#legal';
    legalLink.className = 'nav-link';
    
    // Create span for section number
    const legalNumberSpan = document.createElement('span');
    legalNumberSpan.className = 'section-number';
    legalNumberSpan.textContent = 'ii';
    
    // Create span for section title
    const legalTitleSpan = document.createElement('span');
    legalTitleSpan.className = 'section-title';
    legalTitleSpan.textContent = ' ' + (language === 'fr' ? 'Informations Légales' : 'Legal Information');
    
    // Add spans to link
    legalLink.appendChild(legalNumberSpan);
    legalLink.appendChild(legalTitleSpan);
    legalLink.dataset.sectionId = 'legal';
    
    legalLink.addEventListener('click', function(e) {
        e.preventDefault();
        loadLegal(language);
        
        // Update active link
        document.querySelectorAll('.nav-link').forEach(el => {
            el.classList.remove('active');
        });
        this.classList.add('active');
        
        // Update URL hash without scrolling
        history.pushState(null, null, '#legal');
    });
    
    tocElement.appendChild(legalLink);
}

// Load the disclaimer content
function loadDisclaimer(language) {
    // Show loading indicator
    document.getElementById('content').innerHTML = `
        <div class="loading-spinner">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p>${language === 'fr' ? 'Chargement du contenu...' : 'Loading content...'}</p>
        </div>
    `;
    
    // Determine which disclaimer file to load
    const disclaimerFile = language === 'fr' ? 'disclaimer_FR.md' : 'disclaimer.md';
    
    // Fetch the disclaimer markdown file
    fetch(disclaimerFile)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.text();
        })
        .then(markdown => {
            // Convert markdown to HTML
            const contentHtml = marked.parse(markdown);
            
            // Update the content area
            const contentElement = document.getElementById('content');
            contentElement.innerHTML = contentHtml;
            
            // Add navigation buttons
            addDisclaimerNavigationButtons(language);
            
            // Update active link in table of contents
            document.querySelectorAll('.nav-link').forEach(el => {
                el.classList.remove('active');
                if (el.dataset.sectionId === 'disclaimer') {
                    el.classList.add('active');
                }
            });
            
            // Scroll to top
            window.scrollTo(0, 0);
        })
        .catch(error => {
            console.error('Error loading disclaimer file:', error);
            document.getElementById('content').innerHTML = `
                <div class="alert alert-danger">
                    <h4>${language === 'fr' ? 'Erreur de Chargement de la Page À Propos' : 'Error Loading Disclaimer'}</h4>
                    <p>${language === 'fr' ? 'Désolé, il y a eu un problème lors du chargement de la page À Propos. Veuillez réessayer plus tard.' : 'Sorry, there was a problem loading the disclaimer. Please try again later.'}</p>
                    <p>${language === 'fr' ? 'Détails techniques:' : 'Technical details:'} ${error.message}</p>
                </div>
            `;
        });
}

// Add navigation buttons for the disclaimer page
function addDisclaimerNavigationButtons(language) {
    // Create navigation container
    const navContainer = document.createElement('div');
    navContainer.className = 'section-navigation';
    
    // Back to main content button
    const backButton = document.createElement('button');
    backButton.className = 'btn btn-outline-primary';
    backButton.innerHTML = language === 'fr' ? '&laquo; Retour au Contenu Principal' : '&laquo; Back to Main Content';
    backButton.addEventListener('click', function() {
        if (window.documentSections && window.documentSections.length > 0) {
            loadSection(window.documentSections[0].id);
            history.pushState(null, null, `#${window.documentSections[0].id}`);
        }
    });
    
    // Add button to container
    navContainer.appendChild(backButton);
    
    // Add container to content
    document.getElementById('content').appendChild(navContainer);
}

function loadSection(sectionId) {
    // Check if documentSections exists before trying to access it
    if (!window.documentSections) {
        console.error('Document sections not loaded yet');
        document.getElementById('content').innerHTML = `
            <div class="alert alert-danger">
                <h4>Error Loading Content</h4>
                <p>Sorry, there was a problem loading the document. Please try again later.</p>
                <p>Technical details: Document sections not loaded yet</p>
            </div>
        `;
        return;
    }
    
    const sections = window.documentSections;
    const section = sections.find(s => s.id === sectionId);
    
    if (!section) {
        console.error(`Section with ID ${sectionId} not found`);
        return;
    }
    
    // Convert markdown to HTML
    const contentHtml = marked.parse(section.content);
    
    // Update the content area
    const contentElement = document.getElementById('content');
    contentElement.innerHTML = contentHtml;
    
    // Add navigation buttons
    addNavigationButtons(sectionId);
    
    // Update active link in table of contents
    document.querySelectorAll('.nav-link').forEach(el => {
        el.classList.remove('active');
        if (el.dataset.sectionId === sectionId) {
            el.classList.add('active');
        }
    });
    
    // Scroll to top
    window.scrollTo(0, 0);
}

function addNavigationButtons(currentSectionId) {
    const sections = window.documentSections;
    const currentIndex = sections.findIndex(s => s.id === currentSectionId);
    
    // Create navigation container
    const navContainer = document.createElement('div');
    navContainer.className = 'section-navigation';
    
    // Previous button
    const prevButton = document.createElement('button');
    prevButton.className = 'btn btn-outline-primary';
    prevButton.innerHTML = '&laquo; Previous';
    prevButton.disabled = currentIndex <= 0;
    if (currentIndex > 0) {
        prevButton.addEventListener('click', function() {
            loadSection(sections[currentIndex - 1].id);
            history.pushState(null, null, `#${sections[currentIndex - 1].id}`);
        });
    }
    
    // Next button
    const nextButton = document.createElement('button');
    nextButton.className = 'btn btn-outline-primary';
    nextButton.innerHTML = 'Next &raquo;';
    nextButton.disabled = currentIndex >= sections.length - 1;
    if (currentIndex < sections.length - 1) {
        nextButton.addEventListener('click', function() {
            loadSection(sections[currentIndex + 1].id);
            history.pushState(null, null, `#${sections[currentIndex + 1].id}`);
        });
    }
    
    // Disclaimer button
    const disclaimerButton = document.createElement('button');
    disclaimerButton.className = 'btn btn-outline-secondary ms-auto';
    disclaimerButton.innerHTML = 'About This Document';
    disclaimerButton.addEventListener('click', function() {
        loadDisclaimer();
        history.pushState(null, null, '#disclaimer');
    });
    
    // Add buttons to container
    navContainer.appendChild(prevButton);
    navContainer.appendChild(nextButton);
    navContainer.appendChild(disclaimerButton);
    
    // Add container to content
    document.getElementById('content').appendChild(navContainer);
}

// Handle browser back/forward navigation
window.addEventListener('popstate', function() {
    // Only attempt to load sections if they're already loaded
    if (window.documentSections) {
        const hash = window.location.hash.substring(1);
        if (hash === 'disclaimer') {
            loadDisclaimer(getCurrentLanguage());
        } else if (hash === 'legal') {
            loadLegal(getCurrentLanguage());
        } else if (hash) {
            loadSection(hash);
        } else if (window.documentSections.length > 0) {
            loadSection(window.documentSections[0].id);
        }
    }
});

// Handle sidebar toggle for mobile and desktop view
document.addEventListener('DOMContentLoaded', function() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const contentArea = document.querySelector('.content-area');
    
    // Create desktop toggle button
    const desktopToggle = document.createElement('button');
    desktopToggle.id = 'desktopSidebarToggle';
    desktopToggle.className = 'btn sidebar-toggle d-none d-md-flex';
    desktopToggle.innerHTML = '<i class="bi bi-layout-sidebar"></i>';
    desktopToggle.setAttribute('aria-label', 'Toggle Sidebar');
    desktopToggle.setAttribute('title', 'Toggle Sidebar');
    document.body.appendChild(desktopToggle);
    
    // Handle mobile toggle
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('show');
            document.body.classList.toggle('sidebar-open');
        });
        
        // Close sidebar when clicking on a link (mobile view)
        document.querySelectorAll('#table-of-contents .nav-link').forEach(link => {
            link.addEventListener('click', function() {
                if (window.innerWidth < 768) {
                    sidebar.classList.remove('show');
                    document.body.classList.remove('sidebar-open');
                }
            });
        });
    }
    
    // Handle desktop toggle
    if (desktopToggle && sidebar && contentArea) {
        desktopToggle.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
            contentArea.classList.toggle('sidebar-collapsed');
            desktopToggle.classList.toggle('collapsed');
        });
    }
});

// Initialize dark mode functionality
function initDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    
    // Check for saved dark mode preference
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    
    // Apply dark mode if saved preference exists
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        darkModeToggle.innerHTML = '<i class="bi bi-sun"></i>';
    }
    
    // Add event listener to dark mode toggle button
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', function() {
            document.body.classList.toggle('dark-mode');
            const isDarkModeNow = document.body.classList.contains('dark-mode');
            
            // Update button icon
            this.innerHTML = isDarkModeNow ? '<i class="bi bi-sun"></i>' : '<i class="bi bi-moon-stars"></i>';
            
            // Save preference to localStorage
            localStorage.setItem('darkMode', isDarkModeNow);
        });
    }
}

// Add back to top button
function addBackToTopButton() {
    // Create the button
    const backToTopBtn = document.createElement('button');
    backToTopBtn.id = 'backToTopBtn';
    backToTopBtn.className = 'btn btn-primary back-to-top';
    backToTopBtn.innerHTML = '<i class="bi bi-arrow-up"></i>';
    backToTopBtn.style.position = 'fixed';
    backToTopBtn.style.bottom = '20px';
    backToTopBtn.style.right = '20px';
    backToTopBtn.style.display = 'none';
    backToTopBtn.style.zIndex = '99';
    backToTopBtn.style.borderRadius = '50%';
    backToTopBtn.style.width = '40px';
    backToTopBtn.style.height = '40px';
    backToTopBtn.style.padding = '0';
    backToTopBtn.style.display = 'flex';
    backToTopBtn.style.alignItems = 'center';
    backToTopBtn.style.justifyContent = 'center';
    backToTopBtn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    backToTopBtn.style.opacity = '0';
    backToTopBtn.style.transition = 'opacity 0.3s ease';
    
    // Add to the document
    document.body.appendChild(backToTopBtn);
    
    // Add click event
    backToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // Show/hide button based on scroll position
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTopBtn.style.opacity = '1';
        } else {
            backToTopBtn.style.opacity = '0';
        }
    });
}

// Load the legal content
function loadLegal(language) {
    // Show loading indicator
    document.getElementById('content').innerHTML = `
        <div class="loading-spinner">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p>${language === 'fr' ? 'Chargement du contenu...' : 'Loading content...'}</p>
        </div>
    `;
    
    // Determine which legal file to load
    const legalFile = language === 'fr' ? 'legal_FR.md' : 'legal.md';
    
    // Fetch the legal markdown file
    fetch(legalFile)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.text();
        })
        .then(markdown => {
            // Convert markdown to HTML
            const contentHtml = marked.parse(markdown);
            
            // Update the content area
            const contentElement = document.getElementById('content');
            contentElement.innerHTML = contentHtml;
            
            // Add navigation buttons
            addLegalNavigationButtons(language);
            
            // Update active link in table of contents
            document.querySelectorAll('.nav-link').forEach(el => {
                el.classList.remove('active');
                if (el.dataset.sectionId === 'legal') {
                    el.classList.add('active');
                }
            });
            
            // Scroll to top
            window.scrollTo(0, 0);
        })
        .catch(error => {
            console.error('Error loading legal file:', error);
            document.getElementById('content').innerHTML = `
                <div class="alert alert-danger">
                    <h4>${language === 'fr' ? 'Erreur de Chargement des Informations Légales' : 'Error Loading Legal Information'}</h4>
                    <p>${language === 'fr' ? 'Désolé, il y a eu un problème lors du chargement des informations légales. Veuillez réessayer plus tard.' : 'Sorry, there was a problem loading the legal information. Please try again later.'}</p>
                    <p>${language === 'fr' ? 'Détails techniques:' : 'Technical details:'} ${error.message}</p>
                </div>
            `;
        });
}

// Add navigation buttons for the legal page
function addLegalNavigationButtons(language) {
    // Create navigation container
    const navContainer = document.createElement('div');
    navContainer.className = 'section-navigation';
    
    // Back to main content button
    const backButton = document.createElement('button');
    backButton.className = 'btn btn-outline-primary';
    backButton.innerHTML = language === 'fr' ? '&laquo; Retour au Contenu Principal' : '&laquo; Back to Main Content';
    backButton.addEventListener('click', function() {
        if (window.documentSections && window.documentSections.length > 0) {
            loadSection(window.documentSections[0].id);
            history.pushState(null, null, `#${window.documentSections[0].id}`);
        }
    });
    
    // Add button to container
    navContainer.appendChild(backButton);
    
    // Add container to content
    document.getElementById('content').appendChild(navContainer);
}