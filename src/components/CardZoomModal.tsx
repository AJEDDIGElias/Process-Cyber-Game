import { useEffect, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { Card, AtoutCard, PreuveCard, AtoutSubtype, ProjetCard, EvenementCard } from '../types';

type Cfg = { border: string; glow: string; badge: string; icon: string; accent: string; foil: string; label: string };

const ATOUT_CFG: Record<AtoutSubtype, Cfg> = {
  bonus:     { border: '#00d4ff', glow: 'rgba(0,212,255,0.7)',    badge: 'bg-cyan-900/70 text-cyan-200',      icon: '⭐', accent: '#00d4ff', foil: 'from-cyan-500/20 via-transparent to-cyan-500/10',     label: 'Bonus' },
  malus:     { border: '#ff3b3b', glow: 'rgba(255,59,59,0.7)',    badge: 'bg-red-900/70 text-red-200',        icon: '💣', accent: '#ff3b3b', foil: 'from-red-500/20 via-transparent to-red-500/10',       label: 'Offensive' },
  bluff:     { border: '#f97316', glow: 'rgba(249,115,22,0.7)',   badge: 'bg-orange-900/70 text-orange-200',  icon: '🃏', accent: '#f97316', foil: 'from-orange-500/20 via-transparent to-orange-500/10',  label: 'Bluff' },
  politique: { border: '#facc15', glow: 'rgba(250,204,21,0.6)',   badge: 'bg-yellow-900/70 text-yellow-200',  icon: '🏛️', accent: '#facc15', foil: 'from-yellow-500/20 via-transparent to-yellow-500/10',  label: 'Politique' },
  risque:    { border: '#8b5cf6', glow: 'rgba(139,92,246,0.7)',   badge: 'bg-purple-900/70 text-purple-200',  icon: '⚠️', accent: '#8b5cf6', foil: 'from-purple-500/20 via-transparent to-purple-500/10',   label: 'Risque' },
  reaction:  { border: '#6b7280', glow: 'rgba(107,114,128,0.7)',  badge: 'bg-gray-900/70 text-gray-200',      icon: '⚡', accent: '#6b7280', foil: 'from-gray-500/15 via-transparent to-gray-500/5',        label: 'Réaction' },
};

const CRITICITE_CFG: Record<string, Cfg> = {
  S0: { border: '#64748b', glow: 'rgba(100,116,139,0.6)', badge: 'bg-slate-800/70 text-slate-300',  icon: '📁', accent: '#64748b', foil: 'from-slate-500/15 via-transparent to-slate-500/5',  label: 'S0 – Standard' },
  S1: { border: '#22c55e', glow: 'rgba(34,197,94,0.6)',   badge: 'bg-green-900/70 text-green-200',  icon: '📁', accent: '#22c55e', foil: 'from-green-500/15 via-transparent to-green-500/5',  label: 'S1 – Sensible' },
  S2: { border: '#eab308', glow: 'rgba(234,179,8,0.6)',   badge: 'bg-yellow-900/70 text-yellow-200',icon: '📁', accent: '#eab308', foil: 'from-yellow-500/15 via-transparent to-yellow-500/5', label: 'S2 – Critique' },
  S3: { border: '#ef4444', glow: 'rgba(239,68,68,0.6)',   badge: 'bg-red-900/70 text-red-200',      icon: '📁', accent: '#ef4444', foil: 'from-red-500/15 via-transparent to-red-500/5',      label: 'S3 – Vital' },
};

const SEVERITY_CFG: Record<string, Cfg> = {
  low:    { border: '#22c55e', glow: 'rgba(34,197,94,0.6)',  badge: 'bg-green-900/70 text-green-200',  icon: '📢', accent: '#22c55e', foil: 'from-green-500/15 via-transparent to-green-500/5',  label: 'Faible' },
  medium: { border: '#eab308', glow: 'rgba(234,179,8,0.6)', badge: 'bg-yellow-900/70 text-yellow-200',icon: '⚡', accent: '#eab308', foil: 'from-yellow-500/15 via-transparent to-yellow-500/5', label: 'Moyen' },
  high:   { border: '#ef4444', glow: 'rgba(239,68,68,0.6)', badge: 'bg-red-900/70 text-red-200',      icon: '🔥', accent: '#ef4444', foil: 'from-red-500/15 via-transparent to-red-500/5',      label: 'Élevé' },
};

const PREUVE_CFG: Cfg = {
  border: '#00ff88', glow: 'rgba(0,255,136,0.6)', badge: 'bg-emerald-900/70 text-emerald-200',
  icon: '📋', accent: '#00ff88', foil: 'from-emerald-500/20 via-transparent to-emerald-500/10', label: 'Preuve',
};

function getConfig(card: Card): Cfg {
  if (card.type === 'Atout')     return ATOUT_CFG[(card as AtoutCard).subtype];
  if (card.type === 'Preuve')    return { ...PREUVE_CFG, icon: (card as PreuveCard).icon ?? '📋' };
  if (card.type === 'Projet')    return CRITICITE_CFG[(card as ProjetCard).criticite] ?? CRITICITE_CFG.S0;
  if (card.type === 'Événement') return SEVERITY_CFG[(card as EvenementCard).severity] ?? SEVERITY_CFG.medium;
  return PREUVE_CFG;
}

function getDescription(card: Card): ReactNode {
  if (card.type === 'Atout')  return (card as AtoutCard).description;
  if (card.type === 'Preuve') return 'Preuve de conformité — attachez-la à un projet actif pour valider une exigence.';
  if (card.type === 'Projet') {
    const p = card as ProjetCard;
    return `${p.etapes.length} étapes · ${p.preuvesRequises.length} preuve${p.preuvesRequises.length > 1 ? 's' : ''} requise${p.preuvesRequises.length > 1 ? 's' : ''} · ${p.valeur} pts`;
  }
  if (card.type === 'Événement') return (card as EvenementCard).description;
  return '';
}

type Props = { card: Card; onClose: () => void; showIllustrationToggle?: boolean };

export default function CardZoomModal({ card, onClose, showIllustrationToggle = false }: Props) {
  const [illustOnly, setIllustOnly] = useState(false);

  const cfg = getConfig(card);
  const cardImage = ((card as any).image as string | undefined) || '';
  const description = getDescription(card);
  const isProjet = card.type === 'Projet';
  const isAtout  = card.type === 'Atout';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'z' || e.key === 'Z') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[800] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}
    >
      {/*
        Card dimensions: ratio Pokémon 63 × 88 mm
        Height = 100svh, Width = 100svh × (63/88) ≈ 71.6svh
        max-width: 96vw pour les écrans étroits
      */}
      <motion.div
        initial={{ scale: 0.55, opacity: 0, rotateY: -15 }}
        animate={{ scale: 1,    opacity: 1, rotateY: 0 }}
        exit={{ scale: 0.55,    opacity: 0, rotateY: 15 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        onClick={e => e.stopPropagation()}
        className="relative overflow-hidden select-none flex-shrink-0"
        style={{
          height: '100svh',
          width: 'calc(100svh * 63 / 88)',
          maxWidth: '96vw',
          borderRadius: '2.2vh',
          border: `0.4vh solid ${cfg.border}`,
          boxShadow: `0 0 8vh ${cfg.glow}, 0 0 18vh ${cfg.glow.replace(/[\d.]+\)$/, '0.2)')}, 0 4vh 10vh rgba(0,0,0,0.9)`,
        }}
      >
        {/* ── Full-bleed background ── */}
        {cardImage ? (
          <img
            src={cardImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ zIndex: 0 }}
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ zIndex: 0, background: `radial-gradient(ellipse at 50% 35%, ${cfg.accent}22, #050510)` }}
          >
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: `radial-gradient(circle, ${cfg.accent} 1px, transparent 1px)`,
              backgroundSize: '2vh 2vh',
            }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span style={{ fontSize: '18vh', opacity: 0.28 }}>{cfg.icon}</span>
            </div>
          </div>
        )}

        {/* ── Holographic foil ── */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${cfg.foil} pointer-events-none`}
          style={{ zIndex: 1, mixBlendMode: 'screen' }}
        />

        {/* ── Info overlays (masqués en mode illustration) ── */}
        {!illustOnly && (
          <>
            {/* Vignette haut */}
            <div className="absolute top-0 left-0 right-0 pointer-events-none" style={{
              zIndex: 2,
              height: '22vh',
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.78) 0%, transparent 100%)',
            }} />

            {/* Vignette bas */}
            <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{
              zIndex: 2,
              height: showIllustrationToggle ? '44vh' : '40vh',
              background: 'linear-gradient(to top, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.7) 50%, transparent 100%)',
            }} />

            {/* Badge + icône */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between" style={{
              zIndex: 3,
              padding: '2.5vh 3vh',
            }}>
              <span
                className={`font-black uppercase tracking-widest rounded-xl backdrop-blur-sm ${cfg.badge}`}
                style={{
                  fontSize: '1.4vh',
                  padding: '0.8vh 1.6vh',
                  border: `0.15vh solid ${cfg.border}60`,
                }}
              >
                {cfg.label}
              </span>
              <span style={{ fontSize: '4vh' }}>{cfg.icon}</span>
            </div>

            {/* Texte bas */}
            <div
              className="absolute bottom-0 left-0 right-0 flex flex-col"
              style={{
                zIndex: 3,
                padding: `1.5vh 4vh ${showIllustrationToggle ? '7vh' : '4.5vh'}`,
                gap: '1.2vh',
              }}
            >
              {/* Séparateur */}
              <div style={{
                height: '0.15vh',
                background: `linear-gradient(90deg, transparent, ${cfg.border}, transparent)`,
                opacity: 0.7,
                marginBottom: '0.4vh',
              }} />

              {/* Nom */}
              <h2
                className="text-white font-black text-center leading-tight"
                style={{
                  fontSize: '3.8vh',
                  textShadow: '0 0 3vh rgba(0,0,0,1), -0.15vh -0.15vh 0 #000, 0.15vh -0.15vh 0 #000, -0.15vh 0.15vh 0 #000, 0.15vh 0.15vh 0 #000',
                }}
              >
                {card.nom}
              </h2>

              {/* Description */}
              <p
                className="text-white text-center leading-snug"
                style={{
                  fontSize: '1.8vh',
                  textShadow: '-0.12vh -0.12vh 0 #000, 0.12vh -0.12vh 0 #000, -0.12vh 0.12vh 0 #000, 0.12vh 0.12vh 0 #000',
                }}
              >
                {description}
              </p>

              {/* Tags preuves requises (Projet) */}
              {isProjet && (
                <div className="flex flex-wrap justify-center" style={{ gap: '0.8vh' }}>
                  {(card as ProjetCard).preuvesRequises.map(pr => (
                    <span
                      key={pr}
                      className="rounded-full"
                      style={{
                        fontSize: '1.2vh',
                        padding: '0.4vh 1.2vh',
                        background: `${cfg.accent}28`,
                        border: `0.12vh solid ${cfg.accent}55`,
                        color: cfg.accent,
                      }}
                    >
                      {pr}
                    </span>
                  ))}
                </div>
              )}

              {/* Tag effet (Atout) */}
              {isAtout && (
                <p
                  className="text-center font-mono"
                  style={{ fontSize: '1.3vh', color: `${cfg.accent}cc` }}
                >
                  {(card as AtoutCard).effet}
                </p>
              )}

              {/* Points de rareté */}
              <div className="flex justify-center" style={{ gap: '1.2vh', marginTop: '0.4vh' }}>
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="rounded-full"
                    style={{
                      width: '1vh', height: '1vh',
                      background: i === 1 ? cfg.border : `${cfg.border}55`,
                      boxShadow: i === 1 ? `0 0 1.2vh ${cfg.border}` : 'none',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Coins décoratifs */}
            {[
              { top: '1.5vh', left: '1.5vh',   borderTop:    `0.3vh solid ${cfg.border}80`, borderLeft:  `0.3vh solid ${cfg.border}80` },
              { top: '1.5vh', right: '1.5vh',  borderTop:    `0.3vh solid ${cfg.border}80`, borderRight: `0.3vh solid ${cfg.border}80` },
              { bottom: '1.5vh', left: '1.5vh',  borderBottom: `0.3vh solid ${cfg.border}80`, borderLeft:  `0.3vh solid ${cfg.border}80` },
              { bottom: '1.5vh', right: '1.5vh', borderBottom: `0.3vh solid ${cfg.border}80`, borderRight: `0.3vh solid ${cfg.border}80` },
            ].map((s, i) => (
              <div
                key={i}
                className="absolute pointer-events-none"
                style={{ ...s, width: '3vh', height: '3vh', zIndex: 4 }}
              />
            ))}

            {/* Hint fermeture */}
            {!showIllustrationToggle && (
              <p
                className="absolute left-0 right-0 text-center pointer-events-none"
                style={{ bottom: '0.8vh', fontSize: '1.1vh', color: `${cfg.border}80`, zIndex: 5 }}
              >
                Clic / Échap / Z pour fermer
              </p>
            )}
          </>
        )}

        {/* ── Bouton toggle illustration ── */}
        {showIllustrationToggle && (
          <button
            onClick={e => { e.stopPropagation(); setIllustOnly(v => !v); }}
            className="absolute flex items-center gap-1.5 font-bold rounded-xl transition-all"
            style={{
              bottom: '1.8vh',
              right: '2vh',
              zIndex: 10,
              fontSize: '1.4vh',
              padding: '0.8vh 1.6vh',
              background: illustOnly ? `${cfg.border}35` : 'rgba(0,0,0,0.7)',
              border: `0.15vh solid ${cfg.border}${illustOnly ? 'cc' : '50'}`,
              color: illustOnly ? cfg.border : '#94a3b8',
              backdropFilter: 'blur(8px)',
            }}
          >
            {illustOnly ? '📄 Infos' : '🖼 Illustration'}
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}
