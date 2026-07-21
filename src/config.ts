export const config = {
    resumeUrl: "/PrateekResume.pdf",
    developer: {
        name: "Prateek",
        fullName: "Prateek Singh",
        title: "Student & Full-Stack Developer",
        description: "Student & Full-Stack Developer who loves turning ideas into working products. Interested in building web apps, exploring AI, and learning system design through real projects."
    },
    assets: {
        // Replace these with your own files under `public/images/`
        avatar: "/images/me.jpg",
        avatarTransparent: "/images/me.jpg"
    },
    social: {
        github: "Prateekiiitg56",
        email: "ps332927@gmail.com",
        location: "India"
    },
    about: {
        title: "About Me",
        description: "I'm Prateek Singh, a curious developer who loves turning ideas into working products. From building web applications to exploring AI and system design, I'm always experimenting, learning, and improving. I care about clean code, meaningful projects, and growing through real-world problem-solving."
    },
    experiences: [
        {
            position: "Open Source Contributor",
            company: "GSSOC / Hacktoberfest / Winter of Code / Code Social",
            period: "Present",
            location: "",
            description: "Actively contributing to community projects, implementing authentication systems, and building scalable frontend components.",
            responsibilities: [
                "Contributing features and fixes to community projects",
                "Implementing authentication and user flows",
                "Building scalable and reusable frontend components",
                "Collaborating in public codebases via Git/GitHub"
            ],
            technologies: ["Open Source", "Git/GitHub", "Auth", "Frontend"],
            referenceLetter: "/ReferenceLetter.pdf"
        }
    ],
    projects: [
        {
            id: 1,
            title: "BizInsight AI",
            category: "AI / Analytics",
            technologies: "Python, Streamlit, NLP, Pandas, Matplotlib/Plotly",
            image: "/images/project-1.webp",
            link: "https://github.com/Prateekiiitg56/BizInsight-AI",
            description: "An AI-powered customer feedback analytics platform for business intelligence. Performs sentiment analysis, identifies key issues, and generates automated improvement suggestions."
        },
        {
            id: 2,
            title: "Red Fizz 3D Interactive Brand Portfolio",
            category: "3D Web / Interactive",
            technologies: "React 18, Vite, React Router DOM, Three.js, React Three Fiber (R3F), @react-three/drei, Tailwind CSS, GSAP",
            image: "/images/project-10.png",
            link: "https://github.com/Prateekiiitg56/Red-Fizz",
            deploy: "https://red-fizz.vercel.app",
            description: "A premium, high-fidelity responsive web application showcasing carbonated beverages with real-time interactive WebGL elements. Features fullscreen 3D product inspectors, custom Can3D & Bottle3D models with cinematic rendering, dynamic texture remounting, glass material physics (transmission, IOR), and smooth scroll-reveal animations for an immersive brand experience."
        },
        {
            id: 3,
            title: "StudyBuddy Chrome Extension",
            category: "Browser Extension",
            technologies: "JavaScript, Chrome Extension API (v3), HTML, CSS",
            image: "/images/project-3.webp",
            link: "https://github.com/Prateekiiitg56/StudyBuddy-Chrome-Extension",
            description: "A productivity side-panel extension that provides AI-driven educational assistance and answers student queries in real-time."
        },
        {
            id: 4,
            title: "Music Prediction Model",
            category: "Machine Learning",
            technologies: "Python, Pandas, Scikit-Learn, Matplotlib",
            image: "/images/project-4.webp",
            link: "https://github.com/Prateekiiitg56/Music-Prediction-using-ML.git",
            description: "A machine learning pipeline that analyzes listener data to predict music preferences and genres, with reporting and visualization."
        },
        {
            id: 5,
            title: "CodeCapsule",
            category: "Full Stack",
            technologies: "React, Node.js, Local Storage/IndexedDB",
            image: "/images/project-5.webp",
            link: "https://github.com/Prateekiiitg56/CodeCapsule",
            description: "A secure environment for code storage and management, designed for handling sensitive snippets and rapid project documentation."
        },
        {
            id: 6,
            title: "The Matrix (LateCode)",
            category: "Full Stack / EdTech / Gamified Learning",
            technologies: "React, Vite, Tailwind CSS, Node.js, Express.js, MongoDB, Pyodide (WASM), Monaco Editor",
            image: "/images/project-6.jpg",
            link: "https://github.com/Prateekiiitg56/The-Matrix.git",
            deploy: "https://the-matrix-rho.vercel.app/",
            description: "A dual-world gamified learning OS. The Red Pill launches a brutalist DSA tracker with MongoDB-backed problem sets, streaks, and analytics. The Blue Pill opens The Construct — a Python curriculum with in-browser WASM execution via Pyodide, Monaco editor integration, 7-module curriculum tree, and XP-based rank progression."
        },
        {
            id: 7,
            title: "SmartScribe",
            category: "AI / Full Stack",
            technologies: "React, Vite, FastAPI, Python, SQLite, JWT, Google OAuth, OpenRouter API",
            image: "/images/project-7.jpg",
            link: "https://github.com/Prateekiiitg56/SmartScribe.git",
            deploy: "https://smartscribe-ai.vercel.app",
            description: "AI-powered essay evaluator that provides instant feedback on grammar, coherence, and argumentation strength. Features real Google OAuth sign-in, JWT authentication, a Monaco-style essay editor, and a user dashboard with evaluation history and stats."
        },
        {
            id: 8,
            title: "Sketch-to-Color GAN",
            category: "Deep Learning / Computer Vision",
            technologies: "Python, PyTorch, Torchvision, Pix2Pix (U-Net + PatchGAN), Albumentations, Jupyter Notebook",
            image: "/images/project-8.jpg",
            link: "https://github.com/Prateekiiitg56/SketchColured.git",
            description: "A conditional GAN (cGAN) that colorizes anime-style sketches using the Pix2Pix architecture. The U-Net generator maps black-and-white sketches to full-color images while a PatchGAN discriminator enforces fine-grained realism. Trained on the Anime Sketch Colorization Pair dataset."
        },
        {
            id: 9,
            title: "Automated Documentation & Tutorial Agent",
            category: "AI / Automation",
            technologies: "n8n, GitHub Webhooks, Groq AI, Node.js, Markdown",
            image: "/images/9.avif",
            link: "https://github.com/Prateekiiitg56/automated-documentation-agent",
            description: "Automated agent that generates docs, blogs, and video scripts on every GitHub PR merge using n8n and Groq AI. (Merge your code, and a robot will write your docs, your blog post, and your video script for you - automatically, in seconds)"
        },
        {
            id: 10,
            title: "AuraSpot",
            category: "Full Stack / Real-time",
            technologies: "React/Next.js, Firebase (Realtime DB & Auth), CSS Modules",
            image: "/images/project-2.webp",
            link: "https://github.com/Prateekiiitg56/auraspot",
            deploy: "https://auraspotfrontend.vercel.app/",
            description: "A real-time real estate platform for finding, buying, or selling hostels, PGs, and houses with localized discovery and seamless user interaction."
        }
    ],
    contact: {
        email: "ps332927@gmail.com",
        github: "https://github.com/Prateekiiitg56",
        linkedin: "https://www.linkedin.com/in/prateekiiitg56/",
        twitter: "",
        facebook: "",
        instagram: ""
    },
    skills: {
        develop: {
            title: "FULL-STACK",
            description: "Building modern web applications",
            details: "I build responsive web apps with React/Next.js, Firebase, and Node.js—focusing on clean UI, solid architecture, and real-world usability.",
            tools: ["JavaScript (ES6+)", "React", "Next.js", "Node.js", "Firebase", "HTML5", "CSS3", "Tailwind CSS", "IndexedDB", "Git/GitHub"]
        },
        design: {
            title: "AI / ML",
            description: "Exploring applied machine learning",
            details: "I build practical ML/NLP projects like sentiment analysis pipelines and prediction models, and I enjoy turning data into useful insights.",
            tools: ["Python", "NLP (Sentiment Analysis)", "TensorFlow", "OpenVINO", "OpenCV", "Scikit-Learn", "Pandas", "Matplotlib", "Streamlit"]
        }
    }
};


