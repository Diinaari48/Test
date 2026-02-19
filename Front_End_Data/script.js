document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------
    // 0. CONFIG (Halkan ayaa laga saxay)
    // ----------------------------
    const API_BASE_URL = 'https://test-6jux.onrender.com'; 

    // Buttons
    const predictBtn = document.getElementById("predictBtn");
    const submitBtn = document.querySelector('.submit-btn');

    // ----------------------------
    // HEALTH CHECK
    // ----------------------------
    fetch(`${API_BASE_URL}/`)
        .then(res => res.json())
        .then(data => {
            // Flask-gaagu wuxuu soo celinayaa "Online"
            if (data.status === "Online") {
                console.log("✅ Flask server online");
                if (predictBtn) predictBtn.disabled = false;
                if (submitBtn) submitBtn.disabled = false;
            }
        })
        .catch(err => {
            console.warn("⚠️ Server-ka Render weli ma uusan kicin ama URL-ka ayaa qaldan.");
        });

    // ----------------------------
    // 1. SPA Navigation (Koodhkaagii oo dhammaystiran)
    // ----------------------------
    const allInternalLinks = document.querySelectorAll('a[href^="#"]');
    const mainNavLinks = document.querySelectorAll('.nav-links a');
    const sections = document.querySelectorAll('section');
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-links');

    function showSection(sectionId) {
        if (!sectionId) return;
        sections.forEach(sec => sec.style.display = 'none');
        const target = document.getElementById(sectionId);
        if (target) {
            target.style.display = 'block';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        mainNavLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + sectionId) link.classList.add('active');
        });
        if (navMenu) navMenu.classList.remove('active');
    }

    allInternalLinks.forEach(link => link.addEventListener('click', e => {
        const href = link.getAttribute('href');
        if (href.startsWith('#')) {
            e.preventDefault();
            const sectionId = href.substring(1);
            showSection(sectionId);
        }
    }));

    if (hamburger) hamburger.addEventListener('click', () => navMenu.classList.toggle('active'));

    const hash = window.location.hash.substring(1);
    showSection(hash && document.getElementById(hash) ? hash : 'home');

    // ----------------------------
    // 2. Hero Slider Logic
    // ----------------------------
    const slides = document.querySelectorAll('.slide');
    let currentSlide = 0;

    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.style.opacity = i === index ? '1' : '0';
            slide.style.transition = 'opacity 1s ease-in-out';
        });
    }

    function nextSlide() {
        if (slides.length > 0) {
            currentSlide = (currentSlide + 1) % slides.length;
            showSlide(currentSlide);
        }
    }

    if (slides.length > 0) {
        showSlide(0);
        setInterval(nextSlide, 5000);
    }

    // ----------------------------
    // 2.5 VALIDATION HELPERS
    // ----------------------------
    const errorDiv = document.getElementById("errorMessage");
    const newsText = document.getElementById("newsText");
    const newsURL = document.getElementById("newsURL");
    let errorTimeout = null;

    function showError(msg, inputId) {
        if (errorDiv) {
            if (errorTimeout) clearTimeout(errorTimeout);
            errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${msg}`;
            const input = document.getElementById(inputId);
            if (input) input.value = "";
            errorTimeout = setTimeout(() => { errorDiv.innerHTML = ""; }, 4000);
        }
    }

    function clearError() { if (errorDiv) errorDiv.innerText = ""; }

    [newsText, newsURL].forEach(input => {
        if (input) input.addEventListener('input', clearError);
    });

    function isURL(text) {
        const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i;
        return urlPattern.test(text.trim());
    }

    function containsLink(text) {
        const linkPattern = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-z0-9.-]+\.(com|net|org|io|so|me))/i;
        return linkPattern.test(text);
    }

    // ----------------------------
    // 3. Fake News Prediction (SAXIDII URL-ka & KEY-GA)
    // ----------------------------
    const resultDiv = document.getElementById("result");
    const confidenceDiv = document.getElementById("confidence");
    const textInput = document.getElementById("textInput");
    const urlInput = document.getElementById("urlInput");

    document.querySelectorAll('input[name="inputType"]').forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.value === "text") { textInput.classList.remove("hidden"); urlInput.classList.add("hidden"); }
            else { textInput.classList.add("hidden"); urlInput.classList.remove("hidden"); }
        });
    });

    if (predictBtn) predictBtn.addEventListener('click', () => {
        const selected = document.querySelector('input[name="inputType"]:checked');
        const inputType = selected.value;
        let userInputData = "";

        if (inputType === "text") {
            userInputData = newsText.value.trim();
            if (userInputData.length < 20) { showError("Fadlan geli ugu yaraan 20 xaraf.", "newsText"); return; }
            if (containsLink(userInputData)) { showError("Text mode-ka laguma ogola Links.", "newsText"); return; }
        } else {
            userInputData = newsURL.value.trim();
            if (!userInputData || !isURL(userInputData)) { showError("Fadlan geli URL sax ah.", "newsURL"); return; }
        }

        resultDiv.innerText = "⏳ Analyzing...";
        
        // CUSBOONAYSIIN: U dir 'text' halkii ay ka ahaan lahayd 'data'
        fetch(`${API_BASE_URL}/predict`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: userInputData }) 
        })
        .then(res => {
            if (!res.ok) throw new Error("Server Error");
            return res.json();
        })
        .then(res => {
            if (res.error) { resultDiv.innerText = "❌ " + res.error; }
            else {
                const isReal = res.prediction.includes("REAL");
                resultDiv.innerText = isReal ? "WAR RUN AH" : "WAR BEEN AH";
                resultDiv.style.color = isReal ? "#2ecc71" : "#e74c3c";
                confidenceDiv.innerText = "Kalsoonida: " + res.confidence;
            }
        })
        .catch(() => { 
            resultDiv.innerText = "❌ Connection Error: Iska hubi Render-kaaga."; 
        });
    });

    const refreshBtn = document.getElementById("refreshBtn");
    if (refreshBtn) refreshBtn.addEventListener('click', () => {
        newsText.value = "";
        newsURL.value = "";
        resultDiv.innerText = "";
        confidenceDiv.innerText = "";
    });

    // ----------------------------
    // 4. Contact Form Handling
    // ----------------------------
    if (submitBtn) {
        submitBtn.addEventListener('click', () => {
            const name = document.getElementById("contactName").value.trim();
            const email = document.getElementById("contactEmail").value.trim();
            const message = document.getElementById("contactMessage").value.trim();

            if (!name || !email || !message) { alert("Fadlan buuxi dhamaan meelaha banaan."); return; }

            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Sending...';

            fetch(`${API_BASE_URL}/contact`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, message })
            })
            .then(res => res.json())
            .then(res => {
                alert("Fariintaada waa la diray!");
                document.getElementById("contactName").value = "";
                document.getElementById("contactEmail").value = "";
                document.getElementById("contactMessage").value = "";
            })
            .catch(() => { alert("Cilad dhinaca server-ka ah."); })
            .finally(() => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Send Message';
            });
        });
    }
});
