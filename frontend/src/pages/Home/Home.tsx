import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUser, getRole, clearAuth } from '../../api/auth'
import './Home.css'

export default function Home() {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string | null>(null)

  // Interactive Mini-game state
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [streakCount, setStreakCount] = useState(1)

  useEffect(() => {
    const user = getUser()
    const role = getRole()
    if (user) {
      setCurrentUser(user)
      setUserRole(role)
    }
  }, [])

  const handleLogout = () => {
    clearAuth()
    setCurrentUser(null)
    setUserRole(null)
    navigate('/role')
  }

  // Handle teaser answer selection
  const handleGameAnswer = (isCorrect: boolean) => {
    setSelectedAnswer(isCorrect)
    if (isCorrect) {
      setStreakCount((prev) => prev + 1)
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance('Roar! Perfect! Leo the Lion is the King of the Jungle!')
        utterance.rate = 0.95
        utterance.pitch = 1.15
        window.speechSynthesis.speak(utterance)
      }
    } else {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance('Nice try! Tommy the bunny is friendly, but Leo the Lion has the golden mane!')
        utterance.rate = 0.95
        window.speechSynthesis.speak(utterance)
      }
    }
  }

  // Handle "Play Audio Voice" button
  const handlePlayVoice = () => {
    setIsPlayingAudio(true)
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('I am the King of the Jungle with a golden mane! Who am I?')
      utterance.rate = 0.9
      utterance.pitch = 1.1
      utterance.onend = () => setIsPlayingAudio(false)
      window.speechSynthesis.speak(utterance)
    } else {
      setTimeout(() => setIsPlayingAudio(false), 1600)
    }
  }

  return (
    <div className="home-container">
      {/* ══════════════════════════════════════════════════════════════════
         1. FIXED HEADER
         ══════════════════════════════════════════════════════════════════ */}
      <header className="home-header">
        <div className="home-header-inner">
          <div className="header-brand" onClick={() => navigate('/home')}>
            <img
              src="https://lh3.googleusercontent.com/aida/AEtjO1Vs1UmU6otEhHz0XqAeXcscts6MAqadwXG-_A9MR65FA1xtTNkBhXFnT7pPZA_Q_W8PebojjvSwU_qsl8vtg03QvVVfxL2Xcg3By8bJYjy_7sN4luljo1ZY2CzVFM3LgneVSsC5U-_NOp7t0DboWDEqtGlFVMDswL50JiHQtQWMezKJfVXRCmxH109N27lNEKu0UD-ZjGUU4-a4KGNyT_q15XZad_JhAUmRU5NVPJaF6oPdS5ya-9MN-Ks"
              alt="Professor Hoot"
              className="brand-avatar"
            />
            <div className="brand-text">
              <span className="brand-title">CAIRE</span>
              <span className="brand-tagline">Learn • Play • Grow</span>
            </div>
          </div>

          <nav className="header-nav">
            <a href="#home" className="nav-link active">Home</a>
            <a href="#how-it-works" className="nav-link">How It Works</a>
            <a href="#learning-skills" className="nav-link">Learning Skills</a>
            <a href="#parents-teachers" className="nav-link">For Parents &amp; Teachers</a>
          </nav>

          <div className="header-actions">
            {currentUser ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  className="user-badge"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate('/profile')}
                  title="Click to view your profile & KPI progress"
                >
                  <span>{userRole === 'teacher' ? '👩‍🏫' : '👨‍👩‍👧'}</span>
                  <span>{currentUser.name || currentUser.parent_name || 'Member'}</span>
                </div>
                <button
                  className="btn-header-start"
                  style={{ padding: '8px 18px', background: '#0058be' }}
                  onClick={() => navigate('/profile')}
                  title="View Profile, KPIs and Learning Plan"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>account_circle</span>
                  <span>Profile</span>
                </button>
                <button
                  onClick={handleLogout}
                  style={{
                    background: '#fee2e2',
                    border: '1px solid #fecdd3',
                    color: '#991b1b',
                    padding: '8px 14px',
                    borderRadius: '50px',
                    cursor: 'pointer',
                    fontWeight: 800,
                    fontSize: '12px',
                    fontFamily: 'Quicksand',
                  }}
                  title="Logout"
                >
                  Logout
                </button>
              </div>
            ) : (
              <>
                <button className="btn-header-login" onClick={() => navigate('/role')}>
                  Log In
                </button>
                <button className="btn-header-start" onClick={() => navigate('/role')}>
                  <span>Get Started</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    rocket_launch
                  </span>
                </button>
                <button
                  className="btn-header-login"
                  style={{ padding: '8px 14px' }}
                  onClick={() => navigate('/profile')}
                  title="View Sample Profile & KPIs"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', verticalAlign: 'middle' }}>
                    account_circle
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════
         2. HERO SECTION — Cheerful Sunny Sky with Floating Storybook Elements
         ══════════════════════════════════════════════════════════════════ */}
      <section id="home" className="home-hero-section">
        {/* Child-friendly Background elements: Sun, Rays, Clouds & Floating Stickers */}
        <div className="kids-sun-wrap">
          <div className="kids-sun-core" />
          <div className="kids-sun-glow" />
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="kids-sun-ray"
              style={{ transform: `rotate(${i * 45}deg) translateY(42px)` }}
            />
          ))}
        </div>

        {/* Soft Cartoon Drifting Clouds */}
        <div className="kids-cloud cloud-top-1" />
        <div className="kids-cloud cloud-top-2" />
        <div className="kids-cloud cloud-top-3" />

        {/* Soft Rainbow Arc */}
        <div className="kids-rainbow-arc" />

        {/* Floating Storybook & Adventure Emojis */}
        <div className="kids-float-sticker sticker-1" title="Golden Star">⭐</div>
        <div className="kids-float-sticker sticker-2" title="Balloon">🎈</div>
        <div className="kids-float-sticker sticker-3" title="Butterfly">🦋</div>
        <div className="kids-float-sticker sticker-4" title="Magic Pencil">✏️</div>
        <div className="kids-float-sticker sticker-5" title="Storybook">📖</div>
        <div className="kids-float-sticker sticker-6" title="Letter A">🅰️</div>
        <div className="kids-float-sticker sticker-7" title="Letter B">🅱️</div>
        <div className="kids-float-sticker sticker-8" title="Rocket Adventure">🚀</div>
        <div className="kids-float-sticker sticker-9" title="Rainbow Sparkle">✨</div>

        <div className="hero-content-wrapper">
          {/* Top Pill Badges */}
          <div className="hero-badges-row">
            <div className="hero-pill-badge hero-pill-green">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>verified_user</span>
              <span>100% Child-Safe &amp; Ad-Free</span>
            </div>
            <div className="hero-pill-badge hero-pill-blue">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>auto_awesome</span>
              <span>4 Core Research Pillars</span>
            </div>
            <div className="hero-pill-badge hero-pill-orange">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>emoji_events</span>
              <span>Personalized AI Growth</span>
            </div>
          </div>

          {/* Main Hero Split Grid */}
          <div className="hero-grid">
            {/* Left Text Col */}
            <div className="hero-text-col">
              <div className="hero-category-tag">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>school</span>
                <span>Ages 7–10 Literacy Platform</span>
              </div>

              <h1 className="hero-headline">
                Learn English. <br />
                <span className="hero-highlight-gradient">Play Every Day!</span>
                <span className="hero-bounce-sparkle"> ✨</span>
              </h1>

              <p className="hero-description">
                A joyful reading journey designed for Grade 3–5 young learners. Powered by CAIRE’s speech AI that
                listens to real speech, adapts story levels, and gently boosts confidence step-by-step.
              </p>

              {/* 3D Action Buttons */}
              <div className="hero-buttons-group">
                <button className="btn-3d-primary" onClick={() => navigate('/role')}>
                  <span>Start Learning Free</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>rocket_launch</span>
                </button>
                <a href="#interactive-teaser" className="btn-3d-secondary">
                  <span className="material-symbols-outlined" style={{ color: '#0058be', fontSize: '24px' }}>
                    sports_esports
                  </span>
                  <span>Try Mini Game</span>
                </a>
              </div>

              {/* Trust Strip */}
              <div className="hero-trust-strip">
                <div className="trust-item">
                  <span className="material-symbols-outlined">mic</span>
                  <span>Whisper-CAIRE AI</span>
                </div>
                <span className="trust-dot">•</span>
                <div className="trust-item">
                  <span className="material-symbols-outlined">psychology</span>
                  <span>Phonics &amp; Fluency</span>
                </div>
                <span className="trust-dot">•</span>
                <div className="trust-item">
                  <span className="material-symbols-outlined">family_restroom</span>
                  <span>Child Safe Design</span>
                </div>
              </div>
            </div>

            {/* Right Stage Card */}
            <div className="hero-stage-card">
              <div className="stage-header-row">
                <span className="stage-tag-green">
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>stars</span>
                  Reading Guide
                </span>
                <span className="stage-tag-blue">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>volume_up</span>
                  Pronounce: /h-uː-t/
                </span>
              </div>

              <div className="character-illustration-box">
                <img
                  src="https://lh3.googleusercontent.com/aida/AEtjO1Vs1UmU6otEhHz0XqAeXcscts6MAqadwXG-_A9MR65FA1xtTNkBhXFnT7pPZA_Q_W8PebojjvSwU_qsl8vtg03QvVVfxL2Xcg3By8bJYjy_7sN4luljo1ZY2CzVFM3LgneVSsC5U-_NOp7t0DboWDEqtGlFVMDswL50JiHQtQWMezKJfVXRCmxH109N27lNEKu0UD-ZjGUU4-a4KGNyT_q15XZad_JhAUmRU5NVPJaF6oPdS5ya-9MN-Ks"
                  alt="Professor Hoot holding magical storybook"
                  className="character-img"
                />
              </div>

              <div className="dialogue-speech-bubble">
                <div className="bubble-icon-wrap">
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>smart_toy</span>
                </div>
                <div>
                  <div className="bubble-sender">Professor Hoot says:</div>
                  <div className="bubble-quote">
                    "Hello adventurer! Tap the microphone and read your first magic tale with me today!"
                  </div>
                </div>
              </div>

              <div className="buddy-mini-bar">
                <div className="buddy-info-left">
                  <img
                    src="https://lh3.googleusercontent.com/aida/AEtjO1XQ_6VsXQONhTJ5F28i8_LSCzfnLcRc30Qr8rJprGiPXrXhs4hpwDw9O9AtkdvthyIIwzq6cPcGrzDGhjzsVwjvTWb148LHBIuyAQVKB8hkyMSQeZeipYaMzx3QbiQnnonI2qGdua2JpxwOFdg8K8h7Hx1xWa6oxmbfIQTxHJ-smJXaT_fqKU4LdxYtqy1Q7edboK1jgzJ5mT1sQnzmE8GzINdg8V9NozzI_KLt7onVYuF0alxFhY88NUGP"
                    alt="Tommy Rabbit"
                    className="buddy-mini-avatar"
                  />
                  <div>
                    <span className="buddy-name">Tommy's Garden</span>
                    <span className="buddy-sub">Level 1: Story Island</span>
                  </div>
                </div>
                <div className="buddy-xp-badge">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>star</span>
                  450 XP
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Organic Storybook Wave Divider */}
        <div className="storybook-wave-bottom">
          <svg viewBox="0 0 1440 120" fill="none" preserveAspectRatio="none">
            <path
              d="M0,40 C320,110 480,10 720,60 C960,110 1120,20 1440,50 L1440,120 L0,120 Z"
              fill="#f0f7ff"
            />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
         3. SECTION 2: 4 CORE ENGLISH SKILLS
         ══════════════════════════════════════════════════════════════════ */}
      <section id="learning-skills" className="home-section-skills">
        <div className="section-header-centered">
          <div className="section-pill-tag">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>psychology</span>
            <span>Pedagogical Framework</span>
          </div>
          <h2 className="section-title-large">Discover the 4 English Superpowers ✨</h2>
          <p className="section-subtitle-text">
            Built on proven speech science and literacy research to evaluate, encourage, and strengthen
            every young reader's foundational skills.
          </p>
        </div>

        <div className="skills-bento-grid">
          {/* Skill 1 */}
          <div className="skill-card">
            <div>
              <div className="skill-top-bar">
                <div className="skill-icon-bubble skill-icon-blue">
                  <span className="material-symbols-outlined">auto_stories</span>
                </div>
                <span className="skill-tag-pill skill-tag-blue">Live AI Listening</span>
              </div>
              <h3 className="skill-name">Reading &amp; Fluency</h3>
              <p className="skill-desc">
                Voice-driven story reading missions with real-time fluency scoring, syllable pacing, and word-accuracy feedback.
              </p>
              <div className="skill-badges-cluster">
                <span className="skill-chip">WPM Pacing</span>
                <span className="skill-chip">Whisper-AI</span>
              </div>
            </div>
            <button className="skill-action-btn" onClick={() => navigate('/role')}>
              <span>Explore Activity</span>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
            </button>
          </div>

          {/* Skill 2 */}
          <div className="skill-card">
            <div>
              <div className="skill-top-bar">
                <div className="skill-icon-bubble skill-icon-green">
                  <span className="material-symbols-outlined">draw</span>
                </div>
                <span className="skill-tag-pill skill-tag-green">Letters A to Z</span>
              </div>
              <h3 className="skill-name">Writing &amp; Tracing</h3>
              <p className="skill-desc">
                Trace phonics shapes, practice handwriting strokes, and build essential fine motor skills with sparkling trail guidance.
              </p>
              <div className="skill-badges-cluster">
                <span className="skill-chip">Stroke Physics</span>
                <span className="skill-chip">Phonics Sound</span>
              </div>
            </div>
            <button className="skill-action-btn" onClick={() => navigate('/role')}>
              <span>Explore Activity</span>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
            </button>
          </div>

          {/* Skill 3 */}
          <div className="skill-card">
            <div>
              <div className="skill-top-bar">
                <div className="skill-icon-bubble skill-icon-orange">
                  <span className="material-symbols-outlined">record_voice_over</span>
                </div>
                <span className="skill-tag-pill skill-tag-orange">Voice Quest</span>
              </div>
              <h3 className="skill-name">Speaking Clarity</h3>
              <p className="skill-desc">
                Converse with friendly buddies like Leo the Lion to practice vocal clarity, expressive intonation, and syllable stresses.
              </p>
              <div className="skill-badges-cluster">
                <span className="skill-chip">Echo Read</span>
                <span className="skill-chip">Friendly Leo</span>
              </div>
            </div>
            <button className="skill-action-btn" onClick={() => navigate('/role')}>
              <span>Explore Activity</span>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
            </button>
          </div>

          {/* Skill 4 */}
          <div className="skill-card">
            <div>
              <div className="skill-top-bar">
                <div className="skill-icon-bubble skill-icon-purple">
                  <span className="material-symbols-outlined">extension</span>
                </div>
                <span className="skill-tag-pill skill-tag-purple">Play &amp; Match</span>
              </div>
              <h3 className="skill-name">Vocabulary Hunt</h3>
              <p className="skill-desc">
                Solve riddle puzzles, find jungle animal items, and unlock magical vocabulary chests through playful associative context.
              </p>
              <div className="skill-badges-cluster">
                <span className="skill-chip">Word Riddles</span>
                <span className="skill-chip">500+ Words</span>
              </div>
            </div>
            <button className="skill-action-btn" onClick={() => navigate('/role')}>
              <span>Explore Activity</span>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
            </button>
          </div>
        </div>

        {/* Storybook Cloud Wave Divider to Next Section */}
        <div className="storybook-wave-bottom">
          <svg viewBox="0 0 1440 100" fill="none" preserveAspectRatio="none">
            <path
              d="M0,30 C360,90 720,10 1080,70 C1260,100 1380,40 1440,50 L1440,100 L0,100 Z"
              fill="#ffffff"
            />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
         4. SECTION 3: LEARN THROUGH PLAY & INTERACTIVE TEASER
         ══════════════════════════════════════════════════════════════════ */}
      <section id="interactive-teaser" className="home-section-games">
        <div className="games-header-row">
          <div className="games-header-left">
            <span className="section-pill-tag">
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>sports_esports</span>
              <span>Interactive Minigames</span>
            </span>
            <h2 className="section-title-large">Playful Learning, Real Growth 🎮</h2>
            <p className="section-subtitle-text">
              Inspired by Duolingo ABC — no boring drills or tests, just joyful exploration that keeps young minds eager to practice every day.
            </p>
          </div>
          <div className="hearts-unlimited-pill">
            <span className="material-symbols-outlined">favorite</span>
            <span>Unlimited Hearts for Explorers</span>
          </div>
        </div>

        <div className="games-layout-grid">
          {/* Left Bento Tiles */}
          <div className="games-bento-grid">
            <div className="game-tile" onClick={() => navigate('/role')}>
              <div className="game-tile-top">
                <div className="game-tile-icon" style={{ background: '#6cf8bb', color: '#002113' }}>
                  <span className="material-symbols-outlined">dashboard</span>
                </div>
                <span className="skill-tag-pill skill-tag-green">Drag &amp; Match</span>
              </div>
              <h4 className="game-tile-title">Picture &amp; Word Match</h4>
              <p className="game-tile-desc">Connect animal illustrations to English sight words with satisfying tactile sounds.</p>
            </div>

            <div className="game-tile" onClick={() => navigate('/role')}>
              <div className="game-tile-top">
                <div className="game-tile-icon" style={{ background: '#d8e2ff', color: '#001a42' }}>
                  <span className="material-symbols-outlined">gesture</span>
                </div>
                <span className="skill-tag-pill skill-tag-blue">Letter Quest</span>
              </div>
              <h4 className="game-tile-title">Star Letter Tracing</h4>
              <p className="game-tile-desc">Guide bright shooting stars across uppercase and lowercase letter paths.</p>
            </div>

            <div className="game-tile" onClick={() => navigate('/role')}>
              <div className="game-tile-top">
                <div className="game-tile-icon" style={{ background: '#ffddb8', color: '#825100' }}>
                  <span className="material-symbols-outlined">hearing</span>
                </div>
                <span className="skill-tag-pill skill-tag-orange">Listening</span>
              </div>
              <h4 className="game-tile-title">Listen &amp; Tap Adventure</h4>
              <p className="game-tile-desc">Hear native sentence audio and pick the magical artifact being described.</p>
            </div>

            <div className="game-tile" onClick={() => navigate('/role')}>
              <div className="game-tile-top">
                <div className="game-tile-icon" style={{ background: '#6cf8bb', color: '#002113' }}>
                  <span className="material-symbols-outlined">explore</span>
                </div>
                <span className="skill-tag-pill skill-tag-green">Explorer</span>
              </div>
              <h4 className="game-tile-title">Treasure Word Hunt</h4>
              <p className="game-tile-desc">Unscramble mystery island letters to open Professor Hoot’s secret treasure chest.</p>
            </div>
          </div>

          {/* Right Live Teaser Widget */}
          <div className="teaser-interactive-card">
            <div className="teaser-card-header">
              <div className="teaser-live-indicator">
                <span className="live-dot" />
                <span>Interactive Game Preview</span>
              </div>
              <div className="streak-pill">
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>bolt</span>
                <span>Streak: +{streakCount}</span>
              </div>
            </div>

            <div className="teaser-prompt-box">
              <div className="teaser-prompt-label">Listen to the clue &amp; tap the right friend:</div>
              <div className="teaser-prompt-clue">"I am the King of the Jungle with a golden mane!"</div>
              <button className="btn-play-voice" onClick={handlePlayVoice} disabled={isPlayingAudio}>
                <span className={`material-symbols-outlined ${isPlayingAudio ? 'animate-spin' : ''}`} style={{ fontSize: '18px' }}>
                  {isPlayingAudio ? 'sync' : 'volume_up'}
                </span>
                <span>{isPlayingAudio ? 'Speaking Voice...' : 'Play Audio Voice'}</span>
              </button>
            </div>

            <div className="teaser-options-grid">
              <button
                type="button"
                className={`teaser-answer-btn ${selectedAnswer === false ? 'selected-wrong' : ''}`}
                onClick={() => handleGameAnswer(false)}
              >
                <img
                  src="https://lh3.googleusercontent.com/aida/AEtjO1XQ_6VsXQONhTJ5F28i8_LSCzfnLcRc30Qr8rJprGiPXrXhs4hpwDw9O9AtkdvthyIIwzq6cPcGrzDGhjzsVwjvTWb148LHBIuyAQVKB8hkyMSQeZeipYaMzx3QbiQnnonI2qGdua2JpxwOFdg8K8h7Hx1xWa6oxmbfIQTxHJ-smJXaT_fqKU4LdxYtqy1Q7edboK1jgzJ5mT1sQnzmE8GzINdg8V9NozzI_KLt7onVYuF0alxFhY88NUGP"
                  alt="Rabbit"
                  className="answer-avatar-img"
                />
                <span className="answer-label">A Bunny Rabbit</span>
              </button>

              <button
                type="button"
                className={`teaser-answer-btn ${selectedAnswer === true ? 'selected-correct' : ''}`}
                onClick={() => handleGameAnswer(true)}
              >
                <img
                  src="https://lh3.googleusercontent.com/aida/AEtjO1UYj_UCS0QShA9a7hPMaEt8Ie883roZPZ6iUteGQIC_sx-vXH_Z8tHkrNCCVUBIhE_d-N4XWRxMBfh1Mkm030hyQjYyN2NpVD9zUec2QUJ4n9KA2FkeCwiAecuqLGu1VvN_ccU2FIJaLsRDs4TNCSUh9vtEjTNt-wETMI2dkkNnsajPBtzxGI_YdJB0SEFe9usTsxnxG80tEWiEfUqmcKTM1_FNoDjJGQms0ZepaASI6ajgj1nj46X-yYc"
                  alt="Leo the Lion"
                  className="answer-avatar-img"
                />
                <span className="answer-label">Leo the Lion</span>
              </button>
            </div>

            {selectedAnswer !== null && (
              <div className={`teaser-feedback-box ${selectedAnswer ? 'feedback-correct' : 'feedback-wrong'}`}>
                {selectedAnswer ? (
                  <span>🎉 ROAR! Perfect! Leo the Lion is the King of the Jungle! (+50 XP)</span>
                ) : (
                  <span>🐰 Nice try! Tommy the bunny is super cute, but Leo has the golden mane! Tap Leo!</span>
                )}
              </div>
            )}

            <div className="teaser-bottom-meta">
              <span>🎯 Target: Listening Comprehension</span>
              <span style={{ color: '#006c49', fontWeight: 800 }}>Grade 2-3 Level</span>
            </div>
          </div>
        </div>

        {/* Storybook Wave Divider to Journey */}
        <div className="storybook-wave-bottom">
          <svg viewBox="0 0 1440 90" fill="none" preserveAspectRatio="none">
            <path
              d="M0,20 C420,80 840,10 1260,60 L1440,40 L1440,90 L0,90 Z"
              fill="#eef7ff"
            />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
         5. SECTION 4: YOUR LEARNING JOURNEY (ADAPTIVE PATHWAY)
         ══════════════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="home-section-journey">
        <div className="section-header-centered">
          <div className="section-pill-tag">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>map</span>
            <span>Continuous AI Roadmap</span>
          </div>
          <h2 className="section-title-large">A Magical Adventure Path Built Just For You 🗺️</h2>
          <p className="section-subtitle-text">
            Every child learns at their unique pace. CAIRE evaluates real-time pauses and pronunciations to chart the ideal next step.
          </p>
        </div>

        <div className="pathway-ribbon-card">
          <div className="pathway-coach-banner">
            <img
              src="https://lh3.googleusercontent.com/aida/AEtjO1Vs1UmU6otEhHz0XqAeXcscts6MAqadwXG-_A9MR65FA1xtTNkBhXFnT7pPZA_Q_W8PebojjvSwU_qsl8vtg03QvVVfxL2Xcg3By8bJYjy_7sN4luljo1ZY2CzVFM3LgneVSsC5U-_NOp7t0DboWDEqtGlFVMDswL50JiHQtQWMezKJfVXRCmxH109N27lNEKu0UD-ZjGUU4-a4KGNyT_q15XZad_JhAUmRU5NVPJaF6oPdS5ya-9MN-Ks"
              alt="Professor Hoot"
              className="coach-avatar"
            />
            <div>
              <span style={{ fontFamily: 'Quicksand', fontWeight: 700, color: '#0058be' }}>Professor Hoot: </span>
              <span style={{ fontSize: '14px', color: '#0b1c30' }}>
                "Super work! You completed Story Island with 3 Golden Stars. Leo's Echo Bridge is waiting for you next!"
              </span>
            </div>
          </div>

          <div className="pathway-steps-grid">
            {/* Step 1 */}
            <div className="pathway-step-card">
              <div className="step-icon-circle step-circle-green">
                <span className="material-symbols-outlined" style={{ fontSize: '36px' }}>check_circle</span>
                <span className="step-badge-done">✓ Done</span>
              </div>
              <h4 className="step-title">Story Island</h4>
              <p className="step-desc">Beginner phonics &amp; picture books</p>
              <div className="step-stars-row">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>star</span>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>star</span>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>star</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="pathway-step-card">
              <div className="step-icon-circle step-circle-green">
                <span className="material-symbols-outlined" style={{ fontSize: '36px' }}>auto_stories</span>
                <span className="step-badge-done">450 XP</span>
              </div>
              <h4 className="step-title">Letter Woods</h4>
              <p className="step-desc">Vowel sounds &amp; blend traces</p>
              <div className="step-stars-row">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>star</span>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>star</span>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#c2c6d6' }}>star</span>
              </div>
            </div>

            {/* Step 3: Active */}
            <div className="pathway-step-card pathway-step-active">
              <div className="step-icon-circle step-circle-blue">
                <span className="material-symbols-outlined" style={{ fontSize: '36px' }}>play_arrow</span>
                <span className="step-badge-active">ACTIVE</span>
              </div>
              <h4 className="step-title">Lion’s Echo Bridge</h4>
              <p className="step-desc">Speak 5 phrases with Leo</p>
              <button className="btn-play-quest" onClick={() => navigate('/role')}>
                Play Quest 🚀
              </button>
            </div>

            {/* Step 4: Locked */}
            <div className="pathway-step-card" style={{ opacity: 0.65 }}>
              <div className="step-icon-circle step-circle-gray">
                <span className="material-symbols-outlined" style={{ fontSize: '36px' }}>lock</span>
              </div>
              <h4 className="step-title">Treasure Garden</h4>
              <p className="step-desc">Advanced sentence mastery</p>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#727785' }}>Unlocks at Level 4</span>
            </div>
          </div>
        </div>

        {/* Wave Divider to Diagnostics */}
        <div className="storybook-wave-bottom">
          <svg viewBox="0 0 1440 90" fill="none" preserveAspectRatio="none">
            <path
              d="M0,35 C320,10 640,70 1040,20 C1240,-5 1380,45 1440,55 L1440,90 L0,90 Z"
              fill="#ffffff"
            />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
         6. SECTION 5: FOR PARENTS & TEACHERS (DIAGNOSTICS & RESEARCH)
         ══════════════════════════════════════════════════════════════════ */}
      <section id="parents-teachers" className="home-section-diagnostics">
        <div className="diagnostics-header-row">
          <div style={{ maxWidth: '680px' }}>
            <div className="section-pill-tag">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>analytics</span>
              <span>Diagnostic Framework</span>
            </div>
            <h2 className="section-title-large">Empowering Parents &amp; Teachers with Actionable Insights 👩‍🏫</h2>
            <p className="section-subtitle-text">
              Beyond playful gaming, CAIRE operates as an objective literacy evaluation system built alongside university cognitive speech researchers.
            </p>
          </div>

          <div className="diagnostics-actions">
            <button className="btn-diag-portal" onClick={() => navigate('/role')}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>badge</span>
              <span>Teacher &amp; Parent Portal</span>
            </button>
            <button className="btn-diag-pdf" onClick={() => alert('Research overview document will download soon.')}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
              <span>Research Overview PDF</span>
            </button>
          </div>
        </div>

        <div className="diag-cards-grid">
          {/* Card 1 */}
          <div className="diag-card">
            <div className="diag-icon-box" style={{ background: '#d8e2ff', color: '#0058be' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>speed</span>
            </div>
            <h3 className="skill-name">Reading Fluency Composite</h3>
            <p className="skill-desc">
              Measures Words-Per-Minute (WPM), hesitation pause lengths, and expressive cadence without intimidating the child.
            </p>
            <div className="diag-metric-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 800 }}>
                <span>Avg. Baseline WPM</span>
                <span style={{ color: '#0058be' }}>84 WPM</span>
              </div>
              <div className="metric-bar-outer">
                <div className="metric-bar-fill" style={{ width: '78%', background: '#0058be' }} />
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="diag-card">
            <div className="diag-icon-box" style={{ background: '#6cf8bb', color: '#005236' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>graphic_eq</span>
            </div>
            <h3 className="skill-name">Phonemic Alignment</h3>
            <p className="skill-desc">
              Whisper-CAIRE speech models analyze phoneme substitutions, syllable omissions, and sound-letter associations.
            </p>
            <div className="diag-metric-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 800 }}>
                <span>Phoneme Accuracy</span>
                <span style={{ color: '#006c49' }}>92%</span>
              </div>
              <div className="metric-bar-outer">
                <div className="metric-bar-fill" style={{ width: '92%', background: '#006c49' }} />
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="diag-card">
            <div className="diag-icon-box" style={{ background: '#ffddb8', color: '#825100' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>recommend</span>
            </div>
            <h3 className="skill-name">Smart Interventions</h3>
            <p className="skill-desc">
              Recommends phrase-cued readings, vowel repetition games, and sight-word hunts tailored to specific stumble points.
            </p>
            <div className="diag-metric-box">
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#825100', display: 'block', marginBottom: '2px' }}>
                Next Recommendation:
              </span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#0b1c30' }}>
                "Vowel Blends with Leo #3"
              </span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="diag-card">
            <div className="diag-icon-box" style={{ background: '#dce9ff', color: '#0058be' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>trending_up</span>
            </div>
            <h3 className="skill-name">Longitudinal Growth</h3>
            <p className="skill-desc">
              Track reading stamina, confidence curves, and vocabulary growth across 30, 60, and 90-day progress graphs.
            </p>
            <div className="diag-metric-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 800 }}>
                <span>30-Day Growth</span>
                <span style={{ color: '#0058be' }}>+24%</span>
              </div>
              <div className="metric-bar-outer">
                <div className="metric-bar-fill" style={{ width: '82%', background: '#2170e4' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Teacher Quote Bar */}
        <div className="diag-quote-bar">
          <div className="quote-icon-circle">
            <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>format_quote</span>
          </div>
          <div>
            <div className="quote-main-text">
              "CAIRE gives our classroom real diagnostic depth while the children simply think they are reading magical stories with Professor Hoot."
            </div>
            <div className="quote-author">
              — Dr. Evelyn Vance, Primary Literacy Specialist &amp; Early Reading Researcher
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
         7. SECTION 6: MOTIVATION & REWARDS
         ══════════════════════════════════════════════════════════════════ */}
      <section className="home-section-rewards">
        <div className="section-header-centered">
          <div className="section-pill-tag">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>military_tech</span>
            <span>Positive Psychology</span>
          </div>
          <h2 className="section-title-large">Celebrate Every Step of the Journey 🌟</h2>
          <p className="section-subtitle-text">
            Encouragement that builds fearless readers. We focus on effort, resilience, and personal triumphs instead of punitive grading.
          </p>
        </div>

        <div className="rewards-cards-grid">
          {/* Reward 1 */}
          <div className="reward-card">
            <div className="reward-icon-bubble" style={{ background: '#6cf8bb', color: '#004d34' }}>
              <span className="material-symbols-outlined">military_tech</span>
            </div>
            <h3 className="skill-name">Collect Badges</h3>
            <p className="skill-desc">
              Earn collector badges like "Jungle Word Scout", "Master Storyteller", and "Pronunciation Hero" to pin on your profile shield.
            </p>
            <div className="reward-pill-foot">12 Badges to Unlock</div>
          </div>

          {/* Reward 2 */}
          <div className="reward-card">
            <div className="reward-icon-bubble" style={{ background: '#ffddb8', color: '#825100' }}>
              <span className="material-symbols-outlined">hotel_class</span>
            </div>
            <h3 className="skill-name">Earn Golden Stars</h3>
            <p className="skill-desc">
              Collect up to 50 stars per story mission to cultivate your interactive animal sanctuary and unlock new character hats.
            </p>
            <div className="reward-pill-foot">50 Stars Per Mission</div>
          </div>

          {/* Reward 3 */}
          <div className="reward-card">
            <div className="reward-icon-bubble" style={{ background: '#d8e2ff', color: '#0058be' }}>
              <span className="material-symbols-outlined">sentiment_very_satisfied</span>
            </div>
            <h3 className="skill-name">Joyful Feedback</h3>
            <p className="skill-desc">
              Friendly spoken cheers like "Great Try!", "Clear Words!", and "You Can Do It!" reinforce courage with zero error-penalties.
            </p>
            <div className="reward-pill-foot">Zero Stress Experience</div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
         8. CALL TO ACTION BANNER
         ══════════════════════════════════════════════════════════════════ */}
      <section className="home-cta-banner">
        <div className="cta-banner-inner">
          <div className="cta-badge-icon">
            <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>local_florist</span>
          </div>
          <h2 className="cta-banner-title">Ready for Your Child's Reading Adventure?</h2>
          <p className="cta-banner-sub">
            Join students and schools flourishing with CAIRE. No credit card required. Free for families and classrooms.
          </p>
          <div className="cta-buttons-row">
            <button className="btn-cta-white" onClick={() => navigate('/role')}>
              Start Free Today 🚀
            </button>
            <button className="btn-cta-outline" onClick={() => navigate('/teacher/auth')}>
              School Classrooms
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
         9. FOOTER
         ══════════════════════════════════════════════════════════════════ */}
      <footer className="home-footer">
        <div className="footer-top-grid">
          <div className="footer-brand-col">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: 'Quicksand', fontSize: '24px', fontWeight: 800, color: '#0058be' }}>
                CAIRE
              </span>
              <span className="hero-pill-badge hero-pill-green" style={{ fontSize: '11px', padding: '3px 10px' }}>
                AI Reading Buddy
              </span>
            </div>
            <p style={{ fontSize: '14px', color: '#424754', lineHeight: 1.6, maxWidth: '420px' }}>
              CAIRE — Helping young learners grow their English skills through personalized learning, playful evaluation, and interactive speech journeys.
            </p>
          </div>

          <div className="footer-links-col">
            <div className="footer-links-title">Explore</div>
            <a href="#home" className="footer-link">Home</a>
            <a href="#learning-skills" className="footer-link">Learning Skills</a>
            <a href="#how-it-works" className="footer-link">How It Works</a>
          </div>

          <div className="footer-links-col">
            <div className="footer-links-title">Support</div>
            <a href="#parents-teachers" className="footer-link">For Parents</a>
            <a href="#parents-teachers" className="footer-link">For Teachers</a>
            <a href="#contact" className="footer-link">Help / Contact</a>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <div>© 2026 CAIRE Research Project (Child AI Reading Evaluation Framework)</div>
          <div className="footer-legal-links">
            <a href="#privacy" className="footer-link">Privacy</a>
            <span>•</span>
            <a href="#safety" className="footer-link">Child Safety</a>
            <span>•</span>
            <a href="#terms" className="footer-link">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
