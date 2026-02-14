import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

type Phase = 'intro' | 'question' | 'finale';
type FinaleStep = 'freeze' | 'flash' | 'wait' | 'dark-glitch' | 'but-i-wont' | 'teasing-line' | 'final-screen';

export default function App() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [countdown, setCountdown] = useState(10);
  const [shake, setShake] = useState(false);
  const [noAttempts, setNoAttempts] = useState(0);
  const [noPosition, setNoPosition] = useState({ x: 70, y: 50 }); // Start to the right of Yes button
  const [noScale, setNoScale] = useState(1);
  const [dramaticMessage, setDramaticMessage] = useState('');
  const [finaleStarted, setFinaleStarted] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [finaleStep, setFinaleStep] = useState<FinaleStep>('freeze');
  const [screenShake, setScreenShake] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const ambientOscRef = useRef<OscillatorNode | null>(null);
  const ambientGainRef = useRef<GainNode | null>(null);
  const buttonsContainerRef = useRef<HTMLDivElement>(null);
  const noButtonRef = useRef<HTMLButtonElement>(null);
  
  // Select teasing lines once at the start of finale
  const teasingLineRef = useRef<string>('');
  const finalSubtextRef = useRef<string>('');

  // Initialize audio context on first user interaction
  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
  };

  // Heartbeat sound
  const playHeartbeat = () => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    osc.start(now);
    osc.stop(now + 0.15);
  };

  // Ticking sound
  const playTick = () => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.frequency.setValueAtTime(800, now);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    
    osc.start(now);
    osc.stop(now + 0.05);
  };

  // Glitch/bass-drop sound
  const playGlitchSound = () => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;
    
    // Bass drop
    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    
    bassOsc.connect(bassGain);
    bassGain.connect(ctx.destination);
    
    bassOsc.type = 'sawtooth';
    bassOsc.frequency.setValueAtTime(120, now);
    bassOsc.frequency.exponentialRampToValueAtTime(40, now + 0.4);
    
    bassGain.gain.setValueAtTime(0, now);
    bassGain.gain.linearRampToValueAtTime(0.4, now + 0.02);
    bassGain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
    
    bassOsc.start(now);
    bassOsc.stop(now + 0.6);
    
    // Glitch noise
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = Math.random() * 2 - 1;
    }
    
    const noiseSource = ctx.createBufferSource();
    const noiseGain = ctx.createGain();
    const noiseFilter = ctx.createBiquadFilter();
    
    noiseSource.buffer = noiseBuffer;
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(800, now);
    
    noiseGain.gain.setValueAtTime(0.15, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    
    noiseSource.start(now);
    noiseSource.stop(now + 0.2);
  };

  // Subtle ambient tone
  const startAmbientTone = () => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    
    // Stop any existing ambient
    if (ambientOscRef.current) {
      ambientOscRef.current.stop();
      ambientOscRef.current = null;
    }
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, ctx.currentTime);
    
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 2);
    
    osc.start();
    
    ambientOscRef.current = osc;
    ambientGainRef.current = gain;
  };

  // Intro sequence
  useEffect(() => {
    if (phase !== 'intro') return;
    
    initAudio();
    
    // Heartbeat loop
    const heartbeatInterval = setInterval(() => {
      playHeartbeat();
    }, 1000);
    
    // Start countdown after 2 seconds
    const countdownTimeout = setTimeout(() => {
      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            setTimeout(() => setPhase('question'), 500);
            return 0;
          }
          playTick();
          if (prev <= 3) {
            setShake(true);
            setTimeout(() => setShake(false), 100);
          }
          return prev - 1;
        });
      }, 1000);
    }, 2000);
    
    return () => {
      clearInterval(heartbeatInterval);
      clearTimeout(countdownTimeout);
    };
  }, [phase]);

  // Handle "No" button hover with bounded movement
  const handleNoHover = () => {
    const newAttempts = noAttempts + 1;
    setNoAttempts(newAttempts);
    
    // Calculate bounded random position
    if (buttonsContainerRef.current && noButtonRef.current) {
      const container = buttonsContainerRef.current.getBoundingClientRect();
      const button = noButtonRef.current.getBoundingClientRect();
      
      // Calculate safe bounds (percentage-based, accounting for button size)
      const buttonWidthPercent = (button.width / container.width) * 100;
      const buttonHeightPercent = (button.height / container.height) * 100;
      
      const minX = buttonWidthPercent / 2 + 5; // 5% padding
      const maxX = 100 - buttonWidthPercent / 2 - 5;
      const minY = buttonHeightPercent / 2 + 5;
      const maxY = 100 - buttonHeightPercent / 2 - 5;
      
      const newX = Math.random() * (maxX - minX) + minX;
      const newY = Math.random() * (maxY - minY) + minY;
      
      setNoPosition({ x: newX, y: newY });
    } else {
      // Fallback to safe bounded percentages
      const newX = Math.random() * 60 + 20; // 20-80%
      const newY = Math.random() * 60 + 20;
      setNoPosition({ x: newX, y: newY });
    }
    
    // Shrink slightly (minimum 0.4)
    setNoScale((prev) => Math.max(0.4, prev - 0.1));
    
    // Show dramatic messages using the NEW attempt count
    if (newAttempts === 3) {
      setDramaticMessage('Why are you running from destiny?');
      setTimeout(() => setDramaticMessage(''), 3000);
    } else if (newAttempts === 5) {
      setDramaticMessage('The universe is watching you.');
      setTimeout(() => setDramaticMessage(''), 3000);
    } else if (newAttempts === 7) {
      setDramaticMessage('This is your moment. Don\'t waste it.');
      setTimeout(() => setDramaticMessage(''), 3000);
    } else if (newAttempts >= 9) {
      setDramaticMessage('You know what you want to say...');
      setTimeout(() => setDramaticMessage(''), 3000);
    }
  };

  // Handle "Yes" click - new troll sequence
  const handleYes = () => {
    if (finaleStarted) return;
    setFinaleStarted(true);
    
    // Select random lines once
    const teasingLines = [
      '…make it that easy.',
      '…say yes that fast.',
      '…fall for that so quickly.',
      '…let you win without a challenge.',
    ];
    const finalSubtexts = [
      'Relax. I\'m just messing with you.',
      'Maybe I like that you said yes.',
      'We\'ll see what happens.',
      'Stay tuned.',
    ];
    
    teasingLineRef.current = teasingLines[Math.floor(Math.random() * teasingLines.length)];
    finalSubtextRef.current = finalSubtexts[Math.floor(Math.random() * finalSubtexts.length)];
    
    // Step 1: Freeze (1 second)
    setFinaleStep('freeze');
    
    setTimeout(() => {
      // Step 2: Flash
      setFinaleStep('flash');
      setShowFlash(true);
      
      setTimeout(() => {
        setShowFlash(false);
        
        // Step 3: WAIT. (1 second)
        setFinaleStep('wait');
        setPhase('finale');
        
        setTimeout(() => {
          // Step 4: Dark screen + glitch + shake
          setFinaleStep('dark-glitch');
          playGlitchSound();
          setScreenShake(true);
          
          setTimeout(() => {
            setScreenShake(false);
          }, 200);
          
          setTimeout(() => {
            // Step 5: But I won't. (2 seconds)
            setFinaleStep('but-i-wont');
            
            setTimeout(() => {
              // Step 6: Teasing line reveal
              setFinaleStep('teasing-line');
              
              setTimeout(() => {
                // Step 7: Final screen
                setFinaleStep('final-screen');
                startAmbientTone();
              }, 2000);
            }, 2000);
          }, 300);
        }, 1000);
      }, 300);
    }, 1000);
  };

  return (
    <div className={`app-container ${shake ? 'shake' : ''} ${screenShake ? 'screen-shake' : ''}`}>
      {/* Intro Phase */}
      {phase === 'intro' && (
        <div className="intro-phase">
          <div className="spotlight-overlay" />
          <div className="countdown-container">
            <div className="countdown">{countdown}</div>
          </div>
        </div>
      )}

      {/* Question Phase */}
      {phase === 'question' && (
        <div className="question-phase">
          <div className="question-content">
            <h1 className="question-title">Will you be my Valentine?</h1>
            
            {dramaticMessage && (
              <div className="dramatic-message">{dramaticMessage}</div>
            )}
            
            <div className="buttons-container" ref={buttonsContainerRef}>
              <Button
                size="lg"
                onClick={handleYes}
                disabled={finaleStarted}
                className="yes-button"
              >
                Yes
              </Button>
              
              <Button
                ref={noButtonRef}
                size="lg"
                variant="outline"
                onMouseEnter={handleNoHover}
                className="no-button"
                style={{
                  position: 'absolute',
                  left: `${noPosition.x}%`,
                  top: `${noPosition.y}%`,
                  transform: `translate(-50%, -50%) scale(${noScale})`,
                  transition: 'all 0.3s ease-out',
                }}
              >
                No
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Finale Phase - Troll Sequence */}
      {phase === 'finale' && (
        <div className={`finale-phase finale-step-${finaleStep}`}>
          {finaleStep === 'wait' && (
            <div className="finale-wait">
              <h1 className="wait-text">WAIT.</h1>
            </div>
          )}
          
          {finaleStep === 'dark-glitch' && (
            <div className="finale-dark-glitch">
              <div className="glitch-overlay" />
            </div>
          )}
          
          {finaleStep === 'but-i-wont' && (
            <div className="finale-but-i-wont">
              <h1 className="but-i-wont-text">But I won't.</h1>
            </div>
          )}
          
          {finaleStep === 'teasing-line' && (
            <div className="finale-teasing-line">
              <h1 className="teasing-line-text">{teasingLineRef.current}</h1>
            </div>
          )}
          
          {finaleStep === 'final-screen' && (
            <div className="finale-final-screen">
              <div className="grain-overlay" />
              <div className="final-content">
                <h1 className="final-main-text">You thought this was simple?</h1>
                <p className="final-subtext">{finalSubtextRef.current}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Flash overlay */}
      {showFlash && <div className="flash-overlay" />}

      {/* Footer */}
      <footer className="app-footer">
        <p>
          Built with love using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            caffeine.ai
          </a>
        </p>
        <p className="footer-year">© {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
