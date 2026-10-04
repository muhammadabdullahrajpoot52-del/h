import React, { useState, useEffect, useRef, Component } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Caught error in AppErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="text-5xl mb-4">🙈</div>
          <h2 className="text-xl font-bold text-emerald-400 mb-2">WhatsApp Tactical Chat Recovered</h2>
          <p className="text-xs text-slate-400 max-w-md mb-6">
            A temporary sync glitch was safely captured. Click below to reload the chat interface cleanly.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg transition-all text-sm"
          >
            Restart Chat Session
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const IconMic = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
  </svg>
);

const IconSend = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
  </svg>
);

const IconShieldAlert = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const IconCheckCheck = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7M5 7l4 4" />
  </svg>
);

const IconPalette = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4c0-2.5 3-6 4-7a3 3 0 013 3c0 2 2 3 3 3h1a4 4 0 014 4c0 2.5-3 6-4 7a4 4 0 01-7-2z" />
  </svg>
);

const IconLogOut = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const IconVolume2 = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z" />
  </svg>
);

const IconVolumeX = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
  </svg>
);

const IconSparkles = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const IconLock = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);

const IconKeyRound = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 2l-2 2m-2-2l2 2m2 2l-3 3m-2-2l1.5 1.5M15.5 11a5.5 5.5 0 10-7.778 7.778 5.5 5.5 0 007.778-7.778z" />
  </svg>
);

const IconRadio = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <circle cx="12" cy="12" r="2" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.24 7.76a6 6 0 010 8.49m-12.73 0a6 6 0 010-8.49m15.56-2.83a10 10 0 010 14.14m-18.38 0a10 10 0 010-14.14" />
  </svg>
);

const IconUsers = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

let firebaseConfig;
try {
  firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
} catch (e) {
  firebaseConfig = null;
}

if (!firebaseConfig || !firebaseConfig.apiKey) {
  firebaseConfig = {
    apiKey: "demo-api-key",
    authDomain: "demo-app.firebaseapp.com",
    projectId: "demo-app",
    storageBucket: "demo-app.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
  };
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'whatsapp-spy-hider-game';

const HIDDEN_EMOJI = "🙈";

const ROLES = {
  hunter: {
    id: 'hunter',
    name: 'Hunter',
    pass: '11',
    badge: '🎯 HUNTER',
    color: 'bg-red-500 text-white',
    avatar: HIDDEN_EMOJI,
    desc: 'Track and eliminate the hiders and spy.'
  },
  spy: {
    id: 'spy',
    name: 'Spy',
    pass: '22',
    badge: '🕵️ SPY',
    color: 'bg-purple-600 text-white',
    avatar: HIDDEN_EMOJI,
    desc: 'Infiltrate communications and report secrets.'
  },
  hider1: {
    id: 'hider1',
    name: 'Hider 1',
    pass: '33',
    badge: '🙈 HIDER 1',
    color: 'bg-emerald-600 text-white',
    avatar: HIDDEN_EMOJI,
    desc: 'Stay hidden and coordinate with Hider 2.'
  },
  hider2: {
    id: 'hider2',
    name: 'Hider 2',
    pass: '44',
    badge: '🥷 HIDER 2',
    color: 'bg-blue-600 text-white',
    avatar: HIDDEN_EMOJI,
    desc: 'Stay hidden and survive the hunt.'
  }
};

const THEMES = [
  { id: 'whatsapp-dark', name: 'WhatsApp Dark', bg: 'bg-[#0b141a]', header: 'bg-[#202c33]', sidebar: 'bg-[#111b21]', bubbleSelf: 'bg-[#005c4b]', bubbleOther: 'bg-[#202c33]', text: 'text-[#e9edef]', textSec: 'text-[#8696a0]', border: 'border-[#222d34]', accent: '#00a884' },
  { id: 'whatsapp-light', name: 'WhatsApp Light', bg: 'bg-[#efeae2]', header: 'bg-[#008069]', sidebar: 'bg-[#ffffff]', bubbleSelf: 'bg-[#d9fdd3]', bubbleOther: 'bg-[#ffffff]', text: 'text-[#111b21]', textSec: 'text-[#667781]', border: 'border-[#e9edef]', accent: '#008069' },
  { id: 'cyberpunk', name: 'Cyberpunk Neon', bg: 'bg-[#090a0f]', header: 'bg-[#121526]', sidebar: 'bg-[#0d0f1d]', bubbleSelf: 'bg-[#ff0055]', bubbleOther: 'bg-[#1a1e36]', text: 'text-[#00f0ff]', textSec: 'text-[#8b9bb4]', border: 'border-[#00f0ff]/30', accent: '#ff0055' },
  { id: 'ocean', name: 'Ocean Blue', bg: 'bg-[#0f172a]', header: 'bg-[#1e293b]', sidebar: 'bg-[#0f172a]', bubbleSelf: 'bg-[#0284c7]', bubbleOther: 'bg-[#334155]', text: 'text-[#f8fafc]', textSec: 'text-[#94a3b8]', border: 'border-[#334155]', accent: '#38bdf8' },
  { id: 'emerald', name: 'Forest Emerald', bg: 'bg-[#062016]', header: 'bg-[#0c3827]', sidebar: 'bg-[#08291d]', bubbleSelf: 'bg-[#059669]', bubbleOther: 'bg-[#114733]', text: 'text-[#ecfdf5]', textSec: 'text-[#6ee7b7]', border: 'border-[#114733]', accent: '#10b981' },
  { id: 'sunset', name: 'Sunset Amber', bg: 'bg-[#1a0c0c]', header: 'bg-[#2e1415]', sidebar: 'bg-[#210e0f]', bubbleSelf: 'bg-[#ea580c]', bubbleOther: 'bg-[#3d1e1f]', text: 'text-[#fff7ed]', textSec: 'text-[#fdba74]', border: 'border-[#3d1e1f]', accent: '#f97316' },
  { id: 'midnight', name: 'Midnight Purple', bg: 'bg-[#120b1f]', header: 'bg-[#211438]', sidebar: 'bg-[#180e2b]', bubbleSelf: 'bg-[#7c3aed]', bubbleOther: 'bg-[#2d1b4d]', text: 'text-[#f5f3ff]', textSec: 'text-[#c4b5fd]', border: 'border-[#2d1b4d]', accent: '#8b5cf6' },
  { id: 'rose', name: 'Rose Gold', bg: 'bg-[#1f0e14]', header: 'bg-[#381925]', sidebar: 'bg-[#29111b]', bubbleSelf: 'bg-[#e11d48]', bubbleOther: 'bg-[#4a2232]', text: 'text-[#fff1f2]', textSec: 'text-[#fecdd3]', border: 'border-[#4a2232]', accent: '#f43f5e' },
  { id: 'solar', name: 'Solar Light', bg: 'bg-[#fefce8]', header: 'bg-[#ca8a04]', sidebar: 'bg-[#fef9c3]', bubbleSelf: 'bg-[#fde047]', bubbleOther: 'bg-[#ffffff]', text: 'text-[#713f12]', textSec: 'text-[#a16207]', border: 'border-[#fef08a]', accent: '#ca8a04' },
  { id: 'matrix', name: 'Matrix Green', bg: 'bg-[#000000]', header: 'bg-[#051a05]', sidebar: 'bg-[#020d02]', bubbleSelf: 'bg-[#15803d]', bubbleOther: 'bg-[#0a2e0a]', text: 'text-[#22c55e]', textSec: 'text-[#15803d]', border: 'border-[#15803d]/40', accent: '#22c55e' }
];

const getMillis = (ts) => {
  if (!ts) return Date.now();
  try {
    if (typeof ts.toMillis === 'function') return ts.toMillis();
    if (typeof ts.toDate === 'function') return ts.toDate().getTime();
    if (ts.seconds) return ts.seconds * 1000;
    if (typeof ts === 'number') return ts;
    if (ts instanceof Date) return ts.getTime();
  } catch (e) {
    return Date.now();
  }
  return Date.now();
};

function WhatsAppSpyApp() {
  const [user, setUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('hunter');
  const [passwordInput, setPasswordInput] = useState('');
  const [passError, setPassError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [activeTheme, setActiveTheme] = useState(THEMES[0]);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [activeChannel, setActiveChannel] = useState('global');
  const [isListening, setIsListening] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showThemePicker, setShowThemePicker] = useState(false);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const baseTextRef = useRef('');
  const prevMessagesCount = useRef(0);

  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.warn("Auth initialization note:", err);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (isMounted) setUser(currentUser);
    });
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          
          recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';
            
            for (let i = 0; i < event.results.length; i++) {
              const transcript = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                finalTranscript += transcript;
              } else {
                interimTranscript += transcript;
              }
            }

            const base = baseTextRef.current;
            const prefix = base ? base.trim() + ' ' : '';
            setInputText(prefix + finalTranscript + interimTranscript);
          };

          recognition.onerror = () => setIsListening(false);
          recognition.onend = () => setIsListening(false);

          recognitionRef.current = recognition;
        }
      }
    } catch (err) {
      console.warn("Speech recognition unavailable:", err);
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsListening(false);
    } else {
      try {
        baseTextRef.current = inputText;
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        setIsListening(false);
      }
    }
  };

  useEffect(() => {
    if (!user || !isLoggedIn) return;

    // Presence update
    try {
      const userPresenceRef = doc(db, 'artifacts', appId, 'public', 'presence', selectedRole);
      setDoc(userPresenceRef, {
        role: selectedRole,
        uid: user.uid,
        lastSeen: serverTimestamp(),
        online: true
      }, { merge: true }).catch(() => {});
    } catch (e) {}

    // Firestore listener for real-time messages across phones
    const messagesCol = collection(db, 'artifacts', appId, 'public', 'data', 'messages');
    const unsubMessages = onSnapshot(messagesCol, (snapshot) => {
      const msgList = [];
      snapshot.forEach((docSnap) => {
        msgList.push({ id: docSnap.id, ...docSnap.data() });
      });

      // Safe sorting by timestamp
      msgList.sort((a, b) => getMillis(a.createdAt) - getMillis(b.createdAt));

      setMessages(msgList);

      if (soundEnabled && msgList.length > prevMessagesCount.current && prevMessagesCount.current > 0) {
        const lastMsg = msgList[msgList.length - 1];
        if (lastMsg.role !== selectedRole) {
          playBeep();
        }
      }
      prevMessagesCount.current = msgList.length;
    }, (err) => console.error("Firestore sync error handled:", err));

    return () => unsubMessages();
  }, [user, isLoggedIn, selectedRole, soundEnabled]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChannel]);

  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {}
  };

  const handleLogin = (e) => {
    e?.preventDefault();
    const targetRole = ROLES[selectedRole] || ROLES.hunter;
    if (passwordInput === targetRole.pass) {
      setPassError('');
      setIsLoggedIn(true);
    } else {
      setPassError(`Incorrect password! For ${targetRole.name}, use password: "${targetRole.pass}"`);
    }
  };

  const autofillRole = (roleKey) => {
    setSelectedRole(roleKey);
    setPasswordInput(ROLES[roleKey]?.pass || '');
    setPassError('');
  };

  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() || !user) return;

    const currentRole = ROLES[selectedRole] || ROLES.hunter;
    const textToSend = inputText.trim();
    setInputText('');

    try {
      const messagesCol = collection(db, 'artifacts', appId, 'public', 'data', 'messages');
      await addDoc(messagesCol, {
        text: textToSend,
        role: selectedRole,
        roleBadge: currentRole.badge,
        roleColor: currentRole.color,
        channel: activeChannel,
        senderUid: user.uid,
        createdAt: serverTimestamp(),
        timeStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    } catch (err) {
      console.error("Message send error handled:", err);
    }
  };

  const filteredMessages = messages.filter(msg => {
    if (msg.channel === 'global') return true;
    if (activeChannel === 'global') return true;
    return msg.channel === activeChannel;
  });

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans relative overflow-hidden select-none">
        <div className="bg-slate-900 border border-slate-800 backdrop-blur-lg rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl z-10">
          
          <div className="flex flex-col items-center mb-6 text-center">
            <div className="w-16 h-16 bg-emerald-500/20 text-4xl rounded-full flex items-center justify-center mb-2 ring-4 ring-emerald-500/10">
              {HIDDEN_EMOJI}
            </div>
            <h1 className="text-2xl font-extrabold tracking-wide text-white flex items-center gap-2">
              WhatsApp Tactical Spy
            </h1>
            <p className="text-xs text-slate-400 mt-1">Real-Time Phone Multi-Device Network</p>
          </div>

          <div className="mb-6">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
              ⚡ Quick Select Role (Auto-Fill):
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.keys(ROLES).map((key) => {
                const r = ROLES[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => autofillRole(key)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                      selectedRole === key 
                        ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-lg ring-1 ring-emerald-500' 
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800/50'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1">
                        <span className="text-base">{r.avatar}</span> {r.name}
                      </div>
                      <div className="text-[10px] text-slate-400">Pass: <span className="font-mono text-emerald-400 font-bold">{r.pass}</span></div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Selected Role Info:
              </label>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-sm font-bold flex items-center gap-3">
                <span className="text-3xl">{ROLES[selectedRole]?.avatar || HIDDEN_EMOJI}</span>
                <div>
                  <div className="text-emerald-400">{ROLES[selectedRole]?.name}</div>
                  <div className="text-[11px] text-slate-400 font-normal">{ROLES[selectedRole]?.desc}</div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Security Passcode:
              </label>
              <div className="relative">
                <IconKeyRound className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder={`Enter Password (${ROLES[selectedRole]?.pass})`}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
              {passError && (
                <p className="text-xs text-red-400 mt-2 flex items-center gap-1 font-medium">
                  <IconShieldAlert className="w-3.5 h-3.5" /> {passError}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <IconLock className="w-4 h-4" /> Connect To Chat
            </button>
          </form>

        </div>
      </div>
    );
  }

  const currentRoleObj = ROLES[selectedRole] || ROLES.hunter;

  return (
    <div className={`h-screen w-screen flex flex-col font-sans select-none ${activeTheme.bg} transition-colors duration-200 overflow-hidden`}>
      <div className="flex-1 flex h-full max-w-[1600px] w-full mx-auto shadow-2xl relative">

        {/* ================= LEFT SIDEBAR ================= */}
        <div className={`w-80 sm:w-96 flex flex-col border-r ${activeTheme.sidebar} ${activeTheme.border} ${activeTheme.text}`}>
          
          {/* Header with Hidden Emoji Avatar */}
          <div className={`p-3 sm:p-4 flex items-center justify-between ${activeTheme.header} border-b ${activeTheme.border}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-2xl border border-slate-700 shadow-inner">
                {HIDDEN_EMOJI}
              </div>
              <div>
                <h2 className="font-bold text-sm flex items-center gap-1.5">
                  {currentRoleObj.name}
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">ACTIVE</span>
                </h2>
                <p className={`text-[11px] ${activeTheme.textSec}`}>{currentRoleObj.badge}</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button 
                onClick={() => setSoundEnabled(!soundEnabled)} 
                title="Toggle Beep Sounds"
                className={`p-2 rounded-full hover:bg-white/10 ${activeTheme.textSec}`}
              >
                {soundEnabled ? <IconVolume2 className="w-5 h-5 text-emerald-400" /> : <IconVolumeX className="w-5 h-5" />}
              </button>

              <button 
                onClick={() => setShowThemePicker(!showThemePicker)} 
                title="10 WhatsApp Themes"
                className={`p-2 rounded-full hover:bg-white/10 ${activeTheme.textSec}`}
              >
                <IconPalette className="w-5 h-5 text-emerald-400" />
              </button>

              <button 
                onClick={() => setIsLoggedIn(false)} 
                title="Switch Role"
                className={`p-2 rounded-full hover:bg-white/10 ${activeTheme.textSec}`}
              >
                <IconLogOut className="w-5 h-5 text-red-400" />
              </button>
            </div>
          </div>

          {/* Theme Selector (10 Themes) */}
          {showThemePicker && (
            <div className={`p-3 border-b ${activeTheme.border} bg-slate-900 text-white animate-fadeIn`}>
              <div className="text-xs font-bold mb-2 flex items-center gap-1 text-emerald-400">
                <IconSparkles className="w-4 h-4" /> Pick Theme (10 Styles):
              </div>
              <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setActiveTheme(t); setShowThemePicker(false); }}
                    className={`text-left text-xs p-2 rounded flex items-center justify-between ${
                      activeTheme.id === t.id ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    <span>{t.name}</span>
                    <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: t.accent }}></span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Channel Selector */}
          <div className="p-2 border-b border-white/5 bg-black/10">
            <div className="text-[11px] font-semibold text-slate-400 px-2 mb-1.5 uppercase tracking-wider">
              Communication Frequencies
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setActiveChannel('global')}
                className={`py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                  activeChannel === 'global' ? 'bg-emerald-600 text-white shadow' : 'bg-slate-800/40 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <IconRadio className="w-3.5 h-3.5" /> Global
              </button>
              <button
                onClick={() => setActiveChannel('hunter')}
                className={`py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                  activeChannel === 'hunter' ? 'bg-red-600 text-white shadow' : 'bg-slate-800/40 text-slate-300 hover:bg-slate-800'
                }`}
              >
                🎯 Hunter
              </button>
              <button
                onClick={() => setActiveChannel('spy')}
                className={`py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                  activeChannel === 'spy' ? 'bg-purple-600 text-white shadow' : 'bg-slate-800/40 text-slate-300 hover:bg-slate-800'
                }`}
              >
                🕵️ Spy
              </button>
              <button
                onClick={() => setActiveChannel('hiders')}
                className={`py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                  activeChannel === 'hiders' ? 'bg-blue-600 text-white shadow' : 'bg-slate-800/40 text-slate-300 hover:bg-slate-800'
                }`}
              >
                🙈 Hiders
              </button>
            </div>
          </div>

          {/* Role list with Hidden Emoji icons */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between mb-2">
              <span className="flex items-center gap-1"><IconUsers className="w-3.5 h-3.5" /> Role Passwords</span>
              <span className="text-[10px] text-emerald-400 font-mono">Live</span>
            </div>

            {Object.keys(ROLES).map((roleKey) => {
              const r = ROLES[roleKey];
              const isUserRole = selectedRole === roleKey;
              return (
                <div 
                  key={roleKey} 
                  className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                    isUserRole ? 'bg-slate-800/80 border-emerald-500/50' : 'bg-slate-900/30 border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-lg border border-slate-700">
                      {HIDDEN_EMOJI}
                    </div>
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        {r.name}
                        {isUserRole && <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1 rounded">You</span>}
                      </div>
                      <div className="text-[10px] text-slate-400">{r.badge}</div>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    Pass: {r.pass}
                  </span>
                </div>
              );
            })}
          </div>

        </div>

        {/* ================= MAIN CHAT AREA ================= */}
        <div className={`flex-1 flex flex-col ${activeTheme.bg} relative overflow-hidden`}>

          {/* Active Chat Header with Hidden Emoji Avatar */}
          <div className={`p-3 sm:p-4 flex items-center justify-between ${activeTheme.header} border-b ${activeTheme.border} z-10 shadow-sm`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-2xl border border-slate-700">
                {HIDDEN_EMOJI}
              </div>
              <div>
                <h3 className={`font-bold text-sm sm:text-base ${activeTheme.text} capitalize flex items-center gap-2`}>
                  {activeChannel} Frequency
                </h3>
                <p className={`text-xs ${activeTheme.textSec}`}>
                  Real-Time sync active • Messages show instantly on all phones
                </p>
              </div>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 relative">
            {filteredMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-3 text-slate-500 text-3xl">
                  {HIDDEN_EMOJI}
                </div>
                <p className={`text-sm font-semibold ${activeTheme.text}`}>No messages yet</p>
                <p className={`text-xs ${activeTheme.textSec} max-w-xs mt-1`}>
                  Send a message from any phone or browser to see it update live everywhere!
                </p>
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isMe = msg.role === selectedRole;
                const roleConfig = ROLES[msg.role] || ROLES.hunter;
                const badgeText = typeof msg.roleBadge === 'string' ? msg.roleBadge : roleConfig.badge;
                const messageText = typeof msg.text === 'string' ? msg.text : String(msg.text || '');
                const messageTime = typeof msg.timeStr === 'string' ? msg.timeStr : 'Just now';

                return (
                  <div
                    key={msg.id || Math.random().toString()}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[70%] ${isMe ? 'ml-auto' : 'mr-auto'}`}
                  >
                    {!isMe && (
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${roleConfig.color}`}>
                          {badgeText}
                        </span>
                        <span className={`text-[10px] ${activeTheme.textSec}`}>{roleConfig.name}</span>
                      </div>
                    )}

                    {/* WhatsApp Bubble */}
                    <div
                      className={`p-3 rounded-2xl relative shadow-md break-words max-w-full ${
                        isMe 
                          ? `${activeTheme.bubbleSelf} ${activeTheme.text} rounded-tr-none` 
                          : `${activeTheme.bubbleOther} ${activeTheme.text} rounded-tl-none border ${activeTheme.border}`
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{messageText}</p>
                      
                      <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${activeTheme.textSec} font-mono`}>
                        <span>{messageTime}</span>
                        {isMe && <IconCheckCheck className="w-3.5 h-3.5 text-emerald-400 inline" />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Voice Dictation Indicator */}
          {isListening && (
            <div className="bg-red-500 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between animate-pulse">
              <span className="flex items-center gap-2">
                <IconMic className="w-4 h-4 animate-bounce" />
                Listening... Speak your message now!
              </span>
              <button onClick={toggleListening} className="underline text-[10px] font-bold">Stop</button>
            </div>
          )}

          {/* Message Input Controls */}
          <div className={`p-3 sm:p-4 ${activeTheme.header} border-t ${activeTheme.border} z-10`}>
            <form onSubmit={sendMessage} className="flex items-center gap-2">
              <button 
                type="button" 
                onClick={toggleListening}
                className={`p-2.5 rounded-full transition-all ${
                  isListening 
                    ? 'bg-red-600 text-white animate-pulse' 
                    : `${activeTheme.textSec} hover:text-emerald-400 hover:bg-white/5`
                }`}
                title="Voice Dictation"
              >
                <IconMic className="w-5 h-5" />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={isListening ? "Listening to speech..." : "Type message or click mic to speak..."}
                className={`flex-1 ${activeTheme.sidebar} ${activeTheme.text} rounded-full py-2.5 px-4 text-sm focus:outline-none border ${activeTheme.border} focus:border-emerald-500 transition-all`}
              />

              <button
                type="submit"
                disabled={!inputText.trim()}
                className={`p-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white transition-all disabled:opacity-40 flex items-center justify-center shadow-md`}
              >
                <IconSend className="w-5 h-5" />
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppErrorBoundary>
      <WhatsAppSpyApp />
    </AppErrorBoundary>
  );
}