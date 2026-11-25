import type { Locale } from 'next-intl';

export interface Source {
  label: string;
  href: string;
}

export interface Reply {
  text: string;
  sources: Source[];
  action?: 'book' | 'resume';
}

interface Copy {
  placeholder: string;
  title: string;
  thinking: string;
  newChat: string;
  close: string;
  send: string;
  voice: string;
  book: string;
  resume: string;
  suggestions: string[];
  replies: { match: RegExp; reply: Reply }[];
  fallback: Reply;
}

const resume = (locale: Locale) => (locale === 'fr' ? '/fr/resume' : '/resume');

export const copy = (locale: Locale): Copy =>
  locale === 'fr'
    ? {
        placeholder: 'Demande-moi n’importe quoi…',
        title: 'Demander à Lény',
        thinking: 'Réflexion…',
        newChat: 'Nouvelle conversation',
        close: 'Fermer',
        send: 'Envoyer',
        voice: 'Dicter',
        book: 'Réserver un appel',
        resume: 'Télécharger le CV',
        suggestions: ['Ton rôle chez Tolk.ai\u202f?', 'Es-tu disponible\u202f?', 'Ton projet IA phare\u202f?'],
        replies: [
          {
            match: /dispo|libre|poste|cdi|freelance/i,
            reply: {
              text: 'Oui. Mon alternance chez Tolk.ai s’est terminée en septembre 2026 et je cherche maintenant un poste d’ingénieur IA ou full-stack, à Montpellier ou en télétravail. Le plus simple est d’en parler de vive voix.',
              sources: [{ label: 'CV · Expérience', href: resume('fr') }],
              action: 'book',
            },
          },
        ],
        fallback: {
          text: 'Chez Tolk.ai, j’ai pris en charge les pipelines d’ingestion et de recherche sur lesquels repose le produit : 600 millions de mots indexés et 4,3 millions de conversations servies. J’ai aussi ouvert le marché du e-commerce avec des bases de connaissances qui se mettent à jour seules, aujourd’hui 80 % de la base en production.',
          sources: [
            { label: 'CV · Tolk.ai', href: resume('fr') },
            { label: 'tolk.ai', href: 'https://tolk.ai' },
          ],
          action: 'resume',
        },
      }
    : {
        placeholder: 'Ask me anything…',
        title: 'Ask Lény',
        thinking: 'Thinking…',
        newChat: 'New chat',
        close: 'Close',
        send: 'Send',
        voice: 'Dictate',
        book: 'Book a call',
        resume: 'Download resume',
        suggestions: ['Your role at Tolk.ai?', 'Are you available?', 'Best AI project?'],
        replies: [
          {
            match: /availab|open to|hire|full-time|freelance|role/i,
            reply: {
              text: 'Yes. My work-study at Tolk.ai ended in September 2026, and I am now looking for an AI or full-stack engineering role, in Montpellier or remote. The quickest way forward is a short call.',
              sources: [{ label: 'Resume · Experience', href: resume('en') }],
              action: 'book',
            },
          },
        ],
        fallback: {
          text: 'At Tolk.ai, I owned the ingestion and retrieval pipelines the product rests on: 600 million indexed words and 4.3 million conversations served. I also opened e-commerce as a market, with knowledge bases that keep themselves current, now 80% of the live knowledge base.',
          sources: [
            { label: 'Resume · Tolk.ai', href: resume('en') },
            { label: 'tolk.ai', href: 'https://tolk.ai' },
          ],
          action: 'resume',
        },
      };

export const replyTo = (question: string, locale: Locale) => {
  const { replies, fallback } = copy(locale);
  return replies.find(({ match }) => match.test(question))?.reply ?? fallback;
};
