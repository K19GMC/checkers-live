'use client';

import Link from 'next/link';
import GradientButton from '@/components/kokonutui/gradient-button';
import ParticleButton from '@/components/kokonutui/particle-button';

export default function Showcase() {
  return (
    <main className="c">
      <h1>Kokonut UI</h1>
      <p>Components installed from the @kokonutui registry.</p>

      <div className="card">
        <p className="avatar-note">Gradient button — three colour variants</p>
        <div className="flex flex-wrap justify-center gap-3">
          <GradientButton className="w-auto" variant="emerald">Emerald</GradientButton>
          <GradientButton className="w-auto" variant="purple">Purple</GradientButton>
          <GradientButton className="w-auto" variant="orange">Orange</GradientButton>
        </div>
      </div>

      <div className="card">
        <p className="avatar-note">
          Particle button — click it, returns a promise for 1.4s
        </p>
        <ParticleButton
          className="mx-auto w-auto"
          onClick={() => new Promise((resolve) => setTimeout(resolve, 1400))}
        >
          Save changes
        </ParticleButton>
      </div>

      <Link className="home-link" href="/">Back to Checkers Live</Link>
    </main>
  );
}