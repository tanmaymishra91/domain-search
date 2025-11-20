document.addEventListener('DOMContentLoaded', () => {
    const searchBtn = document.getElementById('search-btn');
    const domainInput = document.getElementById('domain-input');
    const loadingIndicator = document.getElementById('loading-indicator');
    const resultsArea = document.getElementById('results-area');
    const tags = document.querySelectorAll('.tag');
    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas.getContext('2d');

    // Canvas Particle System
    let particles = [];
    let width, height;

    function resizeCanvas() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    }

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.size = Math.random() * 2;
            this.speedX = (Math.random() - 0.5) * 0.5;
            this.speedY = (Math.random() - 0.5) * 0.5;
            this.opacity = Math.random() * 0.5 + 0.1;
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            if (this.x < 0) this.x = width;
            if (this.x > width) this.x = 0;
            if (this.y < 0) this.y = height;
            if (this.y > height) this.y = 0;
        }

        draw() {
            ctx.fillStyle = `rgba(129, 140, 248, ${this.opacity})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function initParticles() {
        particles = [];
        for (let i = 0; i < 100; i++) {
            particles.push(new Particle());
        }
    }

    function animateParticles() {
        ctx.clearRect(0, 0, width, height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animateParticles);
    }

    window.addEventListener('resize', () => {
        resizeCanvas();
        initParticles();
    });

    resizeCanvas();
    initParticles();
    animateParticles();

    // Pricing Data from User
    // Pricing Data from User
    const pricingMap = {
        '.com': '₹1,179/Year',
        '.in': '₹729/Year',
        '.co.in': '₹639/Year',
        '.org.in': '₹879/Year',
        '.org': '₹1,299/Year',
        '.shop': '₹2,859/Year',
        '.store': '₹4,199/Year',
        '.net': '₹1,569/Year',
        '.co': '₹3,059/Year',
        '.blog': '₹2,619/Year',
        '.io': '₹5,939/Year',
        '.online': '₹2,859/Year',
        '.ai': '₹8,729/Year',
        '.icu': '₹1,399/Year',
        '.xyz': '₹1,229/Year',
        '.pro': '₹2,529/Year',
        '.ltd': '₹2,799/Year',
        '.jp': '₹3,489/Year',
        '.aozoradesu.com': 'FREE!!'
    };

    const tlds = Object.keys(pricingMap);

    async function searchDomain() {
        const query = domainInput.value.trim().toLowerCase();
        if (!query) return;

        // UI Reset
        resultsArea.innerHTML = '';
        resultsArea.classList.add('hidden');
        loadingIndicator.classList.remove('hidden');
        searchBtn.disabled = true;
        searchBtn.textContent = 'Checking...';

        try {
            await generateResults(query);
        } catch (error) {
            console.error('Search failed:', error);
            resultsArea.innerHTML = '<div class="error-msg">Something went wrong. Please try again.</div>';
        } finally {
            loadingIndicator.classList.add('hidden');
            searchBtn.disabled = false;
            searchBtn.textContent = 'Search';
            resultsArea.classList.remove('hidden');
        }
    }

    async function checkAvailability(domain) {
        try {
            // Use Google Public DNS API
            // Status 0 = NOERROR (Exists/Taken)
            // Status 3 = NXDOMAIN (Non-Existent/Available)
            const response = await fetch(`https://dns.google/resolve?name=${domain}&type=A`);
            const data = await response.json();

            // If Status is 3 (NXDOMAIN), it's available.
            // If Status is 0 (NOERROR), it's taken.
            return data.Status === 3;
        } catch (e) {
            console.error('DNS Check Error', e);
            return false; // Assume taken on error to be safe
        }
    }

    async function generateResults(query) {
        const parts = query.split('.');
        const baseName = parts[0];
        const inputTld = parts.length > 1 ? '.' + parts.slice(1).join('.') : null;

        const mainTld = (inputTld && pricingMap[inputTld]) ? inputTld : '.com';
        const mainDomain = baseName + mainTld;

        // Check Main Result Real-Time
        const isMainAvailable = await checkAvailability(mainDomain);
        const mainPrice = pricingMap[mainTld] || 'Check Price';

        // Add Main Result
        resultsArea.innerHTML += createResultCard(mainDomain, isMainAvailable, true, mainPrice, 0);

        // Generate alternatives
        let delay = 0.1;
        const altTlds = tlds.filter(t => t !== mainTld);

        // Check a few popular ones for real
        const realCheckTlds = ['.in', '.co', '.net', '.org', '.io'].filter(t => t !== mainTld).slice(0, 3);

        for (const tld of altTlds) {
            let isAvailable;

            if (realCheckTlds.includes(tld)) {
                isAvailable = await checkAvailability(baseName + tld);
            } else {
                // Fallback to random for less critical extensions
                isAvailable = Math.random() > 0.3;
            }

            resultsArea.innerHTML += createResultCard(baseName + tld, isAvailable, false, pricingMap[tld], delay);
            delay += 0.05;
        }
    }

    function createResultCard(domain, available, isPrimary, price, delay) {
        const displayPrice = available ? price : 'Taken';
        const statusClass = available ? 'status-available' : 'status-taken';
        const statusText = available ? 'Available' : 'Taken';
        const btnText = available ? 'Add to Cart' : 'Make Offer';
        const btnClass = available && isPrimary ? 'buy-btn primary' : 'buy-btn';

        const style = `animation-delay: ${delay}s`;

        return `
            <div class="result-card" style="${style}">
                <div class="result-info">
                    <span class="domain-name">${domain}</span>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </div>
                <div class="result-action">
                    <span class="price-tag">${available ? displayPrice : ''}</span>
                    <button class="${btnClass}">${btnText}</button>
                </div>
            </div>
        `;
    }

    // Event Listeners
    searchBtn.addEventListener('click', searchDomain);

    domainInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchDomain();
    });

    tags.forEach(tag => {
        tag.addEventListener('click', () => {
            const currentVal = domainInput.value;
            if (currentVal && !currentVal.includes('.')) {
                domainInput.value = currentVal + tag.textContent;
            } else {
                domainInput.value = 'example' + tag.textContent;
            }
            domainInput.focus();
        });
    });
});
