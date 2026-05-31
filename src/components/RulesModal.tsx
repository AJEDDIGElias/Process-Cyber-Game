import { motion, AnimatePresence } from 'framer-motion';

type Props = { open: boolean; onClose: () => void };

export default function RulesModal({ open, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 30, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-cyber-panel border border-cyber-border rounded-3xl p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs uppercase tracking-widest text-cyber-cyan mb-1">Process Cyber</p>
                <h2 className="text-2xl font-bold text-white">Règles du jeu</h2>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-cyber-bg border border-cyber-border text-slate-400 hover:text-white hover:border-cyber-cyan transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5 text-sm text-slate-300">
              <Section title="🎯 Objectif">
                <p>Compléter le maximum de projets cybersécurité avant votre adversaire. Premier à <strong className="text-white">10 points</strong> ou à compléter <strong className="text-white">3 projets S3</strong> gagne. La partie dure <strong className="text-white">20 tours</strong>.</p>
              </Section>

              <Section title="🔁 Déroulement d'un tour">
                <ol className="list-decimal list-inside space-y-1.5 text-slate-400">
                  <li><strong className="text-white">Pioche</strong> — 1 Atout + 1 Preuve (+ 1 Projet si slot dispo)</li>
                  <li><strong className="text-white">Action principale</strong> — Avancer un projet, poser une preuve ou jouer un atout</li>
                  <li><strong className="text-white">Action bonus</strong> — 1 action supplémentaire optionnelle</li>
                  <li><strong className="text-white">Résolution</strong> — Effets retardés, risques calculés</li>
                </ol>
              </Section>

              <Section title="🚫 Limites par tour">
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  <li>Max <strong className="text-white">3 projets actifs</strong> simultanément</li>
                  <li>Max <strong className="text-white">5 cartes en main</strong></li>
                  <li><strong className="text-white">1 preuve</strong> posée par tour</li>
                  <li><strong className="text-white">1 atout</strong> joué par tour</li>
                </ul>
              </Section>

              <Section title="📁 Types de cartes">
                <div className="space-y-2">
                  <CardRule color="text-cyber-purple" label="Projet S3 (Critique)" desc="6 étapes, récompense 6–8 pts, risque élevé" />
                  <CardRule color="text-cyber-red" label="Projet S2 (Complexe)" desc="5 étapes, récompense 3–4 pts" />
                  <CardRule color="text-cyber-yellow" label="Projet S1 (Standard)" desc="3 étapes, récompense 2 pts" />
                  <CardRule color="text-slate-400" label="Projet S0 (Simple)" desc="2 étapes, récompense 1 pt" />
                  <CardRule color="text-cyber-green" label="Preuve" desc="S'attache à un projet pour satisfaire ses exigences" />
                  <CardRule color="text-blue-400" label="Atout Personnel" desc="Boost de progression ou pioche" />
                  <CardRule color="text-cyber-red" label="Atout Sabotage" desc="Attaque les projets adverses" />
                  <CardRule color="text-cyber-yellow" label="Atout Organisation" desc="Protection et réduction de risque" />
                  <CardRule color="text-cyber-purple" label="Atout Événementiel" desc="Effets globaux sur la partie" />
                </div>
              </Section>

              <Section title="⚠️ Risk Meter">
                <p className="text-slate-400">Chaque projet accumule du risque quand il avance. Si le risque dépasse le seuil maximum, le projet passe automatiquement en <strong className="text-cyber-red">NO GO</strong>. Utilisez des preuves et des atouts Organisation pour le réduire.</p>
              </Section>

              <Section title="🌍 Événements globaux">
                <p className="text-slate-400">Déclenchés automatiquement tous les <strong className="text-white">4 tours</strong>. Ils affectent tous les joueurs. Exemples : hausse de risque globale, preuves supplémentaires requises, gel budgétaire.</p>
              </Section>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-cyber-border/50 rounded-xl p-4 bg-cyber-bg/50">
      <h3 className="font-bold text-white mb-2">{title}</h3>
      {children}
    </div>
  );
}

function CardRule({ color, label, desc }: { color: string; label: string; desc: string }) {
  return (
    <div className="flex gap-2 items-start">
      <span className={`font-semibold text-[11px] min-w-[130px] ${color}`}>{label}</span>
      <span className="text-slate-500 text-[11px]">— {desc}</span>
    </div>
  );
}
