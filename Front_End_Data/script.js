document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------
    // 0. CONFIG (Halkan ayaa laga saxay URL-kaaga)
    // ----------------------------
    const API_BASE_URL = 'https://test-6jux.onrender.com'; 

    // Buttons
    const predictBtn = document.getElementById("predictBtn");
    const submitBtn = document.querySelector('.submit-btn');
    const resultDiv = document.getElementById("result");
    const confidenceDiv = document.getElementById("confidence");
    const errorDiv = document.getElementById("errorMessage");

    // ----------------------------
    // HEALTH CHECK (Hubinta in Render uu kiciyay)
    // ----------------------------
    fetch(`${API_BASE_URL}/`)
        .then(res => res.json())
        .then(data => {
            // Render-kaaga wuxuu soo celinayaa status: "Online"
            if (data.status === "Online") {
                console.log("✅ Server-ka Render waa diyaar!");
                if (predictBtn) predictBtn.disabled = false;
                if (submitBtn) submitBtn.disabled = false;
            }
        })
        .catch(err => {
            console.warn("⚠️ Server-ku weli ma kicin. Sug 30 ilbiriqsi ka dibna Refresh dheh.");
        });

    // ----------------------------
    // 1. SPA Navigation
    // ----------------------------
    const sections = document.querySelectorAll('section');
    const mainNavLinks = document.querySelectorAll('.nav-links a');
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

    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const id = link.getAttribute('href').substring(1);
            showSection(id);
        });
    });

    if (hamburger) hamburger.addEventListener('click', () => navMenu.classList.toggle('active'));

    const initialHash = window.location.hash.substring(1) || 'home';
    showSection(initialHash);

    // ----------------------------
    // 2. Hero Slider
    // ----------------------------
    const slides = document.querySelectorAll('.slide');
    let currentSlide = 0;

    function nextSlide() {
        if (slides.length > 0) {
            slides.forEach((s, i) => s.style.opacity = i === currentSlide ? '1' : '0');
            currentSlide = (currentSlide + 1) % slides.length;
        }
    }
    if (slides.length > 0) setInterval(nextSlide, 5000);

    // ----------------------------
    // 3. Fake News Prediction (MUHIIM)
    // ----------------------------
    if (predictBtn) {
        predictBtn.addEventListener('click', () => {
            const newsText = document.getElementById("newsText").value.trim();
            
            if (newsText.length < 20) {
                if (errorDiv) errorDiv.innerText = "Fadlan geli ugu yaraan 20 xaraf.";
                return;
            }

            if (errorDiv) errorDiv.innerText = "";
            resultDiv.innerText = "⏳ Baaritaan ayaa socda...";
            confidenceDiv.innerText = "";

            // Halkan waxaa lagu saxay Key-ga loo dirayo Python (text)
            fetch(`${API_BASE_URL}/predict`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: newsText })
            })
            .then(res => {
                if (!res.ok) throw new Error("Server Error");
                return res.json();
            })
            .then(res => {
                if (res.error) {
                    resultDiv.innerText = "❌ " + res.error;
                } else {
                    const isReal = res.prediction.includes("REAL");
                    resultDiv.innerText = isReal ? "WAR RUN AH" : "WAR BEEN AH";
                    resultDiv.style.color = isReal ? "#2ecc71" : "#e74c3c";
                    confidenceDiv.innerText = "Kalsoonida: " + res.confidence;
                }
            })
            .catch(err => {
                resultDiv.innerText = "❌ Connection Error: Iska hubi Render-kaaga.";
                console.error(err);
            });
        });
    }

    // ----------------------------
    // 4. Reset Button
    // ----------------------------
    const refreshBtn = document.getElementById("refreshBtn");
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            document.getElementById("newsText").value = "";
            resultDiv.innerText = "";
            confidenceDiv.innerText = "";
            if (errorDiv) errorDiv.innerText = "";
        });
    }
});
