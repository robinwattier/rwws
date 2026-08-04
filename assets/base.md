You are given a task to integrate an existing React component in the codebase

The codebase should support:
- shadcn project structure  
- Tailwind CSS
- Typescript

If it doesn't, provide instructions on how to setup project via shadcn CLI, install Tailwind or Typescript.

Determine the default path for components and styles. 
If default path for components is not /components/ui, provide instructions on why it's important to create this folder
Copy-paste this component to /components/ui folder:
```tsx
music-portfolio.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';

// Register GSAP plugin
gsap.registerPlugin(ScrambleTextPlugin);

// Time Display Component
const TimeDisplay = ({CONFIG={}}) => {
  const [time, setTime] = useState({ hours: '', minutes: '', dayPeriod: '' });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options = {
        timeZone: CONFIG.timeZone,
        hour12: true,
        hour: "numeric",
        minute: "numeric",
        second: "numeric"
      };
      const formatter = new Intl.DateTimeFormat("en-US", options);
      const parts = formatter.formatToParts(now);
      
      setTime({
        hours: parts.find(part => part.type === "hour")?.value || '',
        minutes: parts.find(part => part.type === "minute")?.value || '',
        dayPeriod: parts.find(part => part.type === "dayPeriod")?.value || ''
      });
    };

    updateTime();
    const interval = setInterval(updateTime, CONFIG.timeUpdateInterval);
    return () => clearInterval(interval);
  }, []);

  return (
    <time className="corner-item bottom-right" id="current-time">
      {time.hours}<span className="time-blink">:</span>{time.minutes} {time.dayPeriod}
    </time>
  );
};

// Project Item Component
const ProjectItem = ({ project, index, onMouseEnter, onMouseLeave, isActive, isIdle }) => {
  const itemRef = useRef(null);
  const textRefs = {
    artist: useRef(null),
    album: useRef(null),
    category: useRef(null),
    label: useRef(null),
    year: useRef(null),
  };

  useEffect(() => {
    if (isActive) {
      // Animate text scramble on hover
      Object.entries(textRefs).forEach(([key, ref]) => {
        if (ref.current) {
          gsap.killTweensOf(ref.current);
          gsap.to(ref.current, {
            duration: 0.8,
            scrambleText: {
              text: project[key],
              chars: "qwerty1337h@ck3r",
              revealDelay: 0.3,
              speed: 0.4
            }
          });
        }
      });
    } else {
      // Reset text
      Object.entries(textRefs).forEach(([key, ref]) => {
        if (ref.current) {
          gsap.killTweensOf(ref.current);
          ref.current.textContent = project[key];
        }
      });
    }
  }, [isActive, project]);

  return (
    <li 
      ref={itemRef}
      className={`project-item ${isActive ? 'active' : ''} ${isIdle ? 'idle' : ''}`}
      onMouseEnter={() => onMouseEnter(index, project.image)}
      onMouseLeave={onMouseLeave}
      data-image={project.image}
    >
      <span ref={textRefs.artist} className="project-data artist hover-text">
        {project.artist}
      </span>
      <span ref={textRefs.album} className="project-data album hover-text">
        {project.album}
      </span>
      <span ref={textRefs.category} className="project-data category hover-text">
        {project.category}
      </span>
      <span ref={textRefs.label} className="project-data label hover-text">
        {project.label}
      </span>
      <span ref={textRefs.year} className="project-data year hover-text">
        {project.year}
      </span>
    </li>
  );
};

// Main Portfolio Component
const MusicPortfolio = ({PROJECTS_DATA=[], LOCATION={}, CALLBACKS={}, CONFIG={}, SOCIAL_LINKS={}}) => {
  const [activeIndex, setActiveIndex] = useState(-1);
  const [backgroundImage, setBackgroundImage] = useState('');
  const [isIdle, setIsIdle] = useState(true);
  
  const backgroundRef = useRef(null);
  const containerRef = useRef(null);
  const idleTimerRef = useRef(null);
  const idleAnimationRef = useRef(null);
  const debounceRef = useRef(null);
  const projectItemsRef = useRef([]);

  // Preload images
  useEffect(() => {
    PROJECTS_DATA.forEach(project => {
      if (project.image) {
        const img = new Image();
        //img.crossOrigin = "anonymous";
        img.src = project.image;
      }
    });
  }, []);

  // Start idle animation
  const startIdleAnimation = useCallback(() => {
    if (idleAnimationRef.current) return;
    
    const timeline = gsap.timeline({
      repeat: -1,
      repeatDelay: 2
    });
    
    projectItemsRef.current.forEach((item, index) => {
      if (!item) return;
      
      const hideTime = 0 + index * 0.05;
      const showTime = 0 + (PROJECTS_DATA.length * 0.05 * 0.5) + index * 0.05;
      
      timeline.to(item, {
        opacity: 0.05,
        duration: 0.1,
        ease: "power2.inOut"
      }, hideTime);
      
      timeline.to(item, {
        opacity: 1,
        duration: 0.1,
        ease: "power2.inOut"
      }, showTime);
    });
    
    idleAnimationRef.current = timeline;
  }, []);

  // Stop idle animation
  const stopIdleAnimation = useCallback(() => {
    if (idleAnimationRef.current) {
      idleAnimationRef.current.kill();
      idleAnimationRef.current = null;
      
      projectItemsRef.current.forEach(item => {
        if (item) {
          gsap.set(item, { opacity: 1 });
        }
      });
    }
  }, []);

  // Start idle timer
  const startIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    
    idleTimerRef.current = setTimeout(() => {
      if (activeIndex === -1) {
        setIsIdle(true);
        startIdleAnimation();
      }
    }, CONFIG.idleDelay);
  }, [activeIndex, startIdleAnimation]);

  // Stop idle timer
  const stopIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  // Handle mouse enter on project
  const handleProjectMouseEnter = useCallback((index, imageUrl) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    stopIdleAnimation();
    stopIdleTimer();
    setIsIdle(false);
    
    if (activeIndex === index) return;
    
    setActiveIndex(index);
    
    if (imageUrl && backgroundRef.current) {
      // Show background with animation
      const bg = backgroundRef.current;
      bg.style.transition = "none";
      bg.style.transform = "translate(-50%, -50%) scale(1.2)";
      bg.style.backgroundImage = `url(${imageUrl})`;
      bg.style.opacity = "1";
      
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          bg.style.transition = "opacity 0.6s ease, transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
          bg.style.transform = "translate(-50%, -50%) scale(1.0)";
        });
      });
    }
  }, [activeIndex, stopIdleAnimation, stopIdleTimer]);

  // Handle mouse leave on project
  const handleProjectMouseLeave = useCallback(() => {
    debounceRef.current = setTimeout(() => {
      // Text reset handled in ProjectItem component
    }, 50);
  }, []);

  // Handle container mouse leave
  const handleContainerMouseLeave = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    setActiveIndex(-1);
    
    if (backgroundRef.current) {
      backgroundRef.current.style.opacity = "0";
    }
    
    startIdleTimer();
  }, [startIdleTimer]);

  // Initial idle animation
  useEffect(() => {
    startIdleTimer();
    return () => {
      stopIdleTimer();
      stopIdleAnimation();
    };
  }, [startIdleTimer, stopIdleTimer, stopIdleAnimation]);

  return (
    <>
      <div 
        className="container"
      >
        <main 
          ref={containerRef}
          className={`portfolio-container ${activeIndex !== -1 ? 'has-active' : ''}`}
          onMouseLeave={handleContainerMouseLeave}
        >
          <h1 className="sr-only">Music Portfolio</h1>
          <ul className="project-list" role="list">
            {PROJECTS_DATA.map((project, index) => (
              <ProjectItem
                key={project.id}
                project={project}
                index={index}
                onMouseEnter={handleProjectMouseEnter}
                onMouseLeave={handleProjectMouseLeave}
                isActive={activeIndex === index}
                isIdle={isIdle}
                ref={el => projectItemsRef.current[index] = el}
              />
            ))}
          </ul>
        </main>

        <div 
          ref={backgroundRef}
          className="background-image" 
          id="backgroundImage" 
          role="img" 
          aria-hidden="true"
        />

        <aside className="corner-elements">
          <div className="corner-item top-left">
            <div className="corner-square" aria-hidden="true"></div>
          </div>
          <nav className="corner-item top-right">
            <a href="https://open.spotify.com/user/226ilulo57zutgtiwjsjqnqsy?si=0004e7bc669a406e">
              Spotify
            </a> |
            <a href="mailto:hi@filip.fyi">Email</a> |
            <a href="https://x.com/filipz" target="_blank" rel="noopener">X</a>
          </nav>
          <div className="corner-item bottom-left">43.9250° N, 19.5530° E</div>
          <TimeDisplay CONFIG={CONFIG} />
        </aside>
      </div>
    </>
  );
};

export default MusicPortfolio;

demo.tsx
import MusicPortfolio from "@/components/ui/music-portfolio";

export default function DemoOne() {
  const projectsData = [
    {
      id: 1,
      artist: "YOUNG BROKE & LONELY",
      album: "LONELY BOY",
      category: "SINGLE",
      label: "SELF RELEASED",
      year: "2024",
      image: "https://i.pinimg.com/736x/9f/10/23/9f1023c3785097536e164d3ef7ac9fb6.jpg"
    },
    {
      id: 2,
      artist: "YOUNG BROKE & LONELY",
      album: "IN YOUR MEMORY",
      category: "SINGLE",
      label: "SELF RELEASED",
      year: "2024",
      image: "https://i.pinimg.com/736x/bf/f0/4d/bff04d662db206377de801ec0bc42804.jpg"
    },
    {
      id: 3,
      artist: "YOUNG BROKE & LONELY",
      album: "WHO AM I?",
      category: "SINGLE",
      label: "SELF RELEASED",
      year: "2023",
      image: "https://i.pinimg.com/736x/90/cf/ec/90cfec4c5230978dba450909c676fd42.jpg"
    },
    {
      id: 4,
      artist: "YOUNG BROKE & LONELY",
      album: "SINGLE MOM",
      category: "SINGLE",
      label: "SELF RELEASED",
      year: "2023",
      image: "https://i.pinimg.com/736x/8a/9d/06/8a9d06bccabc53834aa311fb3beb75f6.jpg"
    },
    {
      id: 5,
      artist: "YOUNG BROKE & LONELY",
      album: "GHOST",
      category: "SINGLE",
      label: "SELF RELEASED",
      year: "2023",
      image: "https://i.pinimg.com/1200x/99/0d/93/990d93d257f1f31ac12fbd161b29da8b.jpg"
    },
    {
      id: 6,
      artist: "YOUNG BROKE & LONELY",
      album: "DIFFICULTY",
      category: "SINGLE",
      label: "SELF RELEASED",
      year: "2022",
      image: "https://i.pinimg.com/1200x/1c/17/6b/1c176b16985212a93a950d61793b7e18.jpg"
    },
    // ... more projects
  ];

  const config = {
    timeZone: "America/New_York",
    timeUpdateInterval: 1000,
    idleDelay: 4000,
    debounceDelay: 100
  };

  const socialLinks = {
    spotify: "https://spotify.com/your-profile",
    email: "mailto:your-email@example.com",
    x: "https://x.com/your-handle"
  };

  const location = {
    latitude: "40.7128° N",
    longitude: "74.0060° W",
    display: true
  };

  const callbacks = {
    onProjectHover: (project) => console.log('Hovering:', project),
    onProjectLeave: () => console.log('Left project'),
    onContainerLeave: () => console.log('Left container'),
    onIdleStart: () => console.log('Idle animation started'),
    onThemeChange: (theme) => console.log(`Theme changed to: ${theme}`)
  };

  return (
    <MusicPortfolio
      PROJECTS_DATA={projectsData}
      CONFIG={config}
      SOCIAL_LINKS={socialLinks}
      LOCATION={location}
      CALLBACKS={callbacks}
    />
  );
}

```

Install NPM dependencies:
```bash
gsap
```

Extend existing Tailwind 4 index.css with this code (or if project uses Tailwind 3, extend tailwind.config.js or globals.css):
```css
@import "tailwindcss";
@import "tw-animate-css";

:root {
  --color-accent: rgb(255, 223, 0);
  --font-primary: "PP Supply Mono", monospace;
}

.dark {
  --color-accent: rgb(255, 223, 0);
  --font-primary: "PP Supply Mono", monospace;
}


@keyframes blink {
  50% {
    opacity: 0;
  }
}
```

Implementation Guidelines
 1. Analyze the component structure and identify all required dependencies
 2. Review the component's argumens and state
 3. Identify any required context providers or hooks and install them
 4. Questions to Ask
 - What data/props will be passed to this component?
 - Are there any specific state management requirements?
 - Are there any required assets (images, icons, etc.)?
 - What is the expected responsive behavior?
 - What is the best place to use this component in the app?

Steps to integrate
 0. Copy paste all the code above in the correct directories
 1. Install external dependencies
 2. Fill image assets with Unsplash stock images you know exist
 3. Use lucide-react icons for svgs or logos if component requires them
