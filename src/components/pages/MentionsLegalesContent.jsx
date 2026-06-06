'use client';
import { C, FONT } from '@/lib/tokens';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const Section = ({ title, children }) => (
  <div style={{ marginBottom: '2.5rem' }}>
    <h2 style={{ fontFamily: FONT.alt, fontSize: '1.5rem', fontWeight: 600, color: C.greenDeep, marginBottom: '1rem', paddingBottom: '0.4rem', borderBottom: `2px solid ${C.accent}` }}>{title}</h2>
    <div style={{ fontSize: '0.93rem', color: C.inkMuted, lineHeight: 1.8 }}>{children}</div>
  </div>
);

export default function MentionsLegalesContent() {
  useScrollReveal();
  return (
    <div style={{ paddingTop: '6rem', minHeight: '100vh' }}>
      <section style={{ background: C.greenDeep, color: '#fff', padding: '4rem 1.5rem 3rem', textAlign: 'center' }}>
        <div className="reveal" style={{ maxWidth: 700, margin: '0 auto' }}>
          <p style={{ fontSize: '0.7rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: C.accent, marginBottom: '0.75rem' }}>Légal</p>
          <h1 style={{ fontFamily: FONT.alt, fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 600 }}>Mentions légales</h1>
          <p style={{ marginTop: '1rem', opacity: 0.75 }}>Politique de confidentialité &amp; conditions d&apos;utilisation</p>
        </div>
      </section>

      <section style={{ maxWidth: 860, margin: '0 auto', padding: '4rem 1.5rem' }}>
        <Section title="Éditeur du site">
          <p><strong>Association Palmeraies Tighremt TATA</strong><br />
          Association loi 1901 à but non lucratif<br />
          Fondée en mars 2010<br />
          Siège social : rue Nobel, 62410 Hulluch, France<br />
          Email : <a href="mailto:palmeraies.tighremt.tata@gmail.com" style={{ color: C.ochre }}>palmeraies.tighremt.tata@gmail.com</a><br />
          Téléphone : 06 35 99 63 89</p>
        </Section>

        <Section title="Hébergement">
          <p>Ce site est hébergé par <strong>Vercel Inc.</strong><br />
          440 N Barranca Ave #4133, Covina, CA 91723, États-Unis<br />
          <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" style={{ color: C.ochre }}>vercel.com</a></p>
        </Section>

        <Section title="Politique de confidentialité">
          <p><strong>Données collectées</strong><br />
          Ce site collecte uniquement les données que vous nous transmettez volontairement via :</p>
          <ul style={{ paddingLeft: '1.5rem', margin: '0.75rem 0', listStyle: 'disc !important' }}>
            <li style={{ listStyle: 'disc', marginBottom: '0.4rem' }}>Le formulaire de contact (nom, email, message)</li>
            <li style={{ listStyle: 'disc', marginBottom: '0.4rem' }}>Le formulaire de candidature bénévole (nom, email, message)</li>
            <li style={{ listStyle: 'disc', marginBottom: '0.4rem' }}>L&apos;inscription à la newsletter (email uniquement)</li>
          </ul>
          <p><strong>Utilisation des données</strong><br />
          Vos données sont utilisées exclusivement pour répondre à vos demandes et vous envoyer nos actualités si vous y avez consenti. Elles ne sont jamais vendues ni transmises à des tiers.</p>
          <p style={{ marginTop: '0.75rem' }}><strong>Durée de conservation</strong><br />
          Les données de contact sont conservées 3 ans maximum. Les données de newsletter sont conservées jusqu&apos;à désinscription.</p>
          <p style={{ marginTop: '0.75rem' }}><strong>Vos droits (RGPD)</strong><br />
          Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement et de portabilité de vos données. Pour exercer ces droits : <a href="mailto:palmeraies.tighremt.tata@gmail.com" style={{ color: C.ochre }}>palmeraies.tighremt.tata@gmail.com</a></p>
        </Section>

        <Section title="Cookies">
          <p>Ce site utilise uniquement des cookies techniques nécessaires à son fonctionnement (préférences de thème, langue, consentement cookies). Aucun cookie publicitaire ou de tracking n&apos;est utilisé.</p>
        </Section>

        <Section title="Propriété intellectuelle">
          <p>L&apos;ensemble du contenu de ce site (textes, images, logos) est la propriété de l&apos;Association Palmeraies Tighremt TATA ou de ses membres. Toute reproduction sans autorisation est interdite.</p>
        </Section>

        <Section title="Responsabilité">
          <p>L&apos;association s&apos;efforce de maintenir les informations de ce site à jour. Elle ne peut être tenue responsable d&apos;éventuelles erreurs ou omissions.</p>
        </Section>

        <p style={{ fontSize: '0.8rem', color: C.inkLight, marginTop: '2rem' }}>Dernière mise à jour : avril 2026</p>
      </section>
    </div>
  );
}
