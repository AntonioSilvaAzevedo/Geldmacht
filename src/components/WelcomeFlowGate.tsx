'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import OnboardingModal from './OnboardingModal';
import ReleaseNotesModal from './ReleaseNotesModal';
import { api, type ReleaseNote } from '@/lib/api';

/**
 * Coordena os modais de boas-vindas após login na Dashboard.
 *
 * Prioridade (nunca mostra os dois ao mesmo tempo):
 *   1. **Onboarding** (`OnboardingModal`) — para usuários que ainda não viram
 *      o overview inicial do app.
 *   2. **Release notes acumulativas** (`ReleaseNotesModal`) — depois que o
 *      onboarding for fechado/concluído (ou se o usuário já viu o onboarding).
 *
 * Estado interno:
 *   - `phase`: 'loading' | 'onboarding' | 'releases' | 'done'
 *
 * Carregamento:
 *   - Após `useSession()` virar 'authenticated', dispara em paralelo:
 *       - GET /api/onboarding/status
 *       - GET /api/release-notes/pending
 *   - Quando ambos respondem, decide a fase.
 *
 * Falhas individuais não travam o fluxo — Dashboard segue normal.
 */

type Phase = 'loading' | 'onboarding' | 'releases' | 'done';

export default function WelcomeFlowGate() {
  const { status } = useSession();
  const [phase, setPhase] = useState<Phase>('loading');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [pendingReleases, setPendingReleases] = useState<ReleaseNote[]>([]);

  // Carrega ambos em paralelo após autenticação
  useEffect(() => {
    if (status !== 'authenticated') return;
    let cancelled = false;

    const onboardingP = api.getOnboardingStatus().catch(() => null);
    const releasesP = api.getPendingReleaseNotes().catch(() => ({ releases: [] as ReleaseNote[] }));

    void Promise.all([onboardingP, releasesP]).then(([onboarding, releases]) => {
      if (cancelled) return;
      const needsOnboarding = !!(onboarding?.should_show_onboarding);
      const releasesList = releases?.releases ?? [];
      setShowOnboarding(needsOnboarding);
      setPendingReleases(releasesList);

      if (needsOnboarding) setPhase('onboarding');
      else if (releasesList.length > 0) setPhase('releases');
      else setPhase('done');
    });

    return () => { cancelled = true; };
  }, [status]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function dismissOnboarding() {
    setShowOnboarding(false);
    try {
      await api.markOnboardingSeen();
    } catch {
      // Backend continua sendo a verdade — se falhar, próxima sessão refaz
    }
    // Após onboarding, mostrar release notes pendentes (se houver)
    if (pendingReleases.length > 0) {
      setPhase('releases');
    } else {
      setPhase('done');
    }
  }

  async function dismissReleases() {
    if (pendingReleases.length === 0) {
      setPhase('done');
      return;
    }
    const ids = pendingReleases.map(r => r.id);
    setPendingReleases([]);
    setPhase('done');
    try {
      await api.markReleaseNotesSeen(ids);
    } catch {
      // Mantém pendência no backend; volta na próxima sessão.
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (status !== 'authenticated' || phase === 'loading' || phase === 'done') {
    return null;
  }

  if (phase === 'onboarding' && showOnboarding) {
    return (
      <OnboardingModal
        onClose={dismissOnboarding}
        onComplete={dismissOnboarding}
      />
    );
  }

  if (phase === 'releases' && pendingReleases.length > 0) {
    return (
      <ReleaseNotesModal
        releases={pendingReleases}
        onClose={dismissReleases}
        onConfirm={dismissReleases}
      />
    );
  }

  return null;
}
