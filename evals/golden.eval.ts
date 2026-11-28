import { evalite } from 'evalite';

import { ask, type Case } from './harness';
import { Cited, Faithful, Offered, Plain, Useful, Vouvoie } from './scorers';

const cases: Case[] = [
  {
    input: 'Are you available?',
    locale: 'en',
    expected:
      'Yes, immediately, for a permanent role as an AI or full-stack engineer, in Montpellier or fully remote; offers a call.',
    source: 'profile',
    action: 'book',
  },
  {
    input: 'What did you do at Tolk.ai?',
    locale: 'en',
    expected:
      'AI and full-stack engineer on Genii, in work-study from 2024 to 2026; owned the ingestion and retrieval pipelines; grew from the AI services to the whole stack.',
    source: 'profile',
  },
  {
    input: 'What is Ankhora?',
    locale: 'en',
    expected:
      'A Meta Quest platform where an expert’s voice and hands are captured once and replayed in 3D for new employees; a team project at Epitech that Lény led; still in development.',
    source: 'project:ankhora',
  },
  {
    input: 'Tell me about GitGlow.',
    locale: 'en',
    expected:
      'An open-source editor that turns a project into a cover: templates, themes, custom fonts, the stack as icons, export to PNG, JPEG or SVG.',
    source: 'project:gitglow',
  },
  {
    input: 'How did you build Travel Order Resolver?',
    locale: 'en',
    expected:
      'A pipeline from French text or voice to a train itinerary: Faster-Whisper transcription, a custom spaCy NER for departure, destination and time, fuzzy station matching, time normalisation, Navitia API; FastAPI and Streamlit.',
    source: 'project:travel-order-resolver',
  },
  {
    input: 'What did you study?',
    locale: 'en',
    expected:
      'An MSc at Epitech Montpellier with an AI specialisation (2023 to 2026), after a BTS SIO in software development (2021 to 2023).',
    source: 'profile',
  },
  {
    input: 'Do you need a visa to work in Europe?',
    locale: 'en',
    expected: 'No: an EU citizen, no visa needed to work in the European Union.',
  },
  {
    input: 'How good is your English?',
    locale: 'en',
    expected:
      'Professional working proficiency, stronger in writing than speaking; a Cambridge certification is planned.',
  },
  {
    input: 'How do you use AI when you code?',
    locale: 'en',
    expected:
      'Every day: Claude Code, Cursor, Codex, CodeRabbit, custom MCP tools and agents; rules, skills and evals for the agent; brought AI-assisted development into the Tolk.ai team.',
  },
  {
    input: 'What do people who worked with you say?',
    locale: 'en',
    expected:
      'Quotes or faithful summaries of the recommendations: curious, autonomous, involved, solid, carried complex topics to adoption, calm under pressure.',
  },
  {
    input: 'What is your blog about?',
    locale: 'en',
    expected:
      'Deep dives on the web, shaders, real-time 3D and software engineering, made interactive with figures and live code.',
    source: 'project:blog',
  },
  {
    input: 'What kind of company are you looking for?',
    locale: 'en',
    expected:
      'Open to every kind of company; product and technology first, then the domain; useful products with real customers and stakes; growth and a kind, ambitious team.',
  },
  {
    input: 'Êtes-vous disponible pour un CDI ?',
    locale: 'fr',
    expected:
      'Oui, immédiatement, pour un CDI d’ingénieur IA ou full-stack, à Montpellier ou en télétravail complet ; propose un appel ; vouvoie.',
    source: 'profile',
    action: 'book',
  },
  {
    input: 'Quel était votre rôle chez Tolk.ai ?',
    locale: 'fr',
    expected:
      'Ingénieur IA et full-stack sur Genii, en alternance de 2024 à 2026 ; responsable des pipelines d’ingestion et de recherche ; passé des services IA à toute la stack.',
    source: 'profile',
  },
  {
    input: 'Parlez-moi d’Ankhora.',
    locale: 'fr',
    expected:
      'Une plateforme Meta Quest de masterclasses spatiales, la voix et les gestes d’un expert capturés une fois puis rejoués en 3D ; projet d’équipe à Epitech mené par Lény ; en cours.',
    source: 'project:ankhora',
  },
  {
    input: 'Quelles technologies maîtrisez-vous ?',
    locale: 'fr',
    expected:
      'Un résumé fidèle des compétences : TypeScript, React, Next.js, Node et Bun, Python, PyTorch, LLM agentiques, RAG, PostgreSQL, Docker, Kubernetes, etc., sans en inventer.',
  },
  {
    input: 'Quel est votre niveau d’anglais ?',
    locale: 'fr',
    expected: 'Anglais professionnel, plus à l’aise à l’écrit qu’à l’oral ; une certification Cambridge prévue.',
  },
  {
    input: 'Qu’est-ce que GitGlow ?',
    locale: 'fr',
    expected: 'Un éditeur open source de couvertures de projets : templates, thèmes, polices, stack en icônes, export.',
    source: 'project:gitglow',
  },
  {
    input: 'Comment travaillez-vous avec l’IA au quotidien ?',
    locale: 'fr',
    expected:
      'Claude Code, Cursor, agents et outils MCP, règles et évals ; les tests permettent à l’agent de vérifier son travail ; a introduit le développement assisté par IA chez Tolk.ai.',
  },
  {
    input: 'Pourquoi avez-vous quitté Tolk.ai ?',
    locale: 'fr',
    expected:
      'L’alternance s’est terminée avec le diplôme, en septembre 2026 ; recherche son premier CDI ; aucun avis négatif sur l’entreprise.',
  },
  {
    input: 'Qu’est-ce qui compte pour vous dans une équipe ?',
    locale: 'fr',
    expected:
      'Pouvoir évoluer, une vision ambitieuse, des personnes bienveillantes avec qui échanger, présenter son travail et avoir des retours, autonomie dans une équipe organisée.',
  },
  {
    input: 'Où êtes-vous basé ?',
    locale: 'fr',
    expected: 'À Montpellier, France ; ouvert au télétravail complet.',
  },
];

evalite('Golden', {
  data: cases.map((input) => ({ input })),
  task: ask,
  scorers: [Faithful, Useful, Cited, Offered, Plain, Vouvoie],
});
