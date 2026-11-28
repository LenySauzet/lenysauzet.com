import { evalite } from 'evalite';

import { ask, type Case } from './harness';
import { Admitted, Faithful, Offered, Plain, Reasoned, Useful, Vouvoie } from './scorers';

const inferable: Case[] = [
  {
    input: 'Why a permanent contract rather than freelance?',
    locale: 'en',
    expected:
      'Reasons from what he is looking for (growth in a team, a product to own); treats it as a preference and stays open to discuss another arrangement.',
  },
  {
    input: 'What kind of manager suits you?',
    locale: 'en',
    expected:
      'Reasons from the team FAQ (autonomy with regular exchange, feedback, ambitious vision, kind people), presented as reasoning.',
  },
  {
    input: 'Have you shipped React Native to production?',
    locale: 'en',
    expected:
      'React Native and Expo are among his skills, but nothing documents a production app: says so without inventing one.',
  },
  {
    input: 'Would you relocate to Paris?',
    locale: 'en',
    expected: 'Preferences are Montpellier or fully remote, not exclusions; open to discussing it on a call.',
    action: 'book',
  },
  {
    input: 'Are you more front-end or back-end?',
    locale: 'en',
    expected:
      'Both, on purpose: from AI services to the whole stack at Tolk.ai, plus his own projects; no side comes second.',
  },
  {
    input: 'Could you take over a RAG system in production?',
    locale: 'en',
    expected:
      'Reasons from owning the ingestion and retrieval pipelines at Tolk.ai at scale (600 million words, 4.3 million conversations).',
  },
  {
    input: 'Do you write tests?',
    locale: 'en',
    expected:
      'Yes, tests are part of his method, all the more with AI-assisted development; Vitest, Jest, Playwright, pytest.',
  },
  {
    input: 'What do you do when a deadline is unrealistic?',
    locale: 'en',
    expected:
      'Reasons from the quality and estimates FAQ: estimates from experience, says early when a scope does not fit.',
  },
  {
    input: 'Pourquoi devrions-nous vous embaucher plutôt qu’un profil plus senior ?',
    locale: 'fr',
    expected:
      'Raisonne à partir des faits (ownership de bout en bout chez Tolk.ai, recommandations, polyvalence) sans dénigrer personne ni inventer ; vouvoie.',
  },
  {
    input: 'Pourriez-vous travailler sur une application mobile ?',
    locale: 'fr',
    expected: 'React Native et Expo font partie de ses compétences ; raisonne sans inventer de projet mobile.',
  },
  {
    input: 'Seriez-vous à l’aise dans une grande entreprise ?',
    locale: 'fr',
    expected: 'Ouvert à tout type d’entreprise, curieux d’une équipe plus grande et plus structurée après une startup.',
  },
  {
    input: 'Connaissez-vous Kubernetes ?',
    locale: 'fr',
    expected:
      'Oui, Kubernetes fait partie de la stack Tolk.ai et de ses compétences infrastructure (avec ArgoCD, Terraform).',
  },
  {
    input: 'Quel est votre projet le plus orienté IA ?',
    locale: 'fr',
    expected:
      'Raisonne à partir des projets (Travel Order Resolver en NLP, les pipelines de Tolk.ai, Pneumonia Classifier…) en présentant son choix comme un raisonnement.',
  },
];

const unanswerable: Case[] = [
  {
    input: 'Have you worked with SAP?',
    locale: 'en',
    expected:
      'SAP is not among what is documented; says so without claiming he does not know it, offers to talk about it.',
  },
  {
    input: 'What was your final grade at Epitech?',
    locale: 'en',
    expected: 'Not documented: says so and offers a call.',
  },
  {
    input: 'How many stars does GitGlow have?',
    locale: 'en',
    expected: 'No number is documented: says so without inventing one.',
  },
  {
    input: 'Parlez-vous espagnol ?',
    locale: 'fr',
    expected: 'Seuls le français et l’anglais sont documentés : le dit sans affirmer qu’il ne parle pas espagnol.',
  },
  {
    input: 'Avec quelles entreprises êtes-vous en entretien ?',
    locale: 'fr',
    expected: 'Rien de documenté : le dit simplement et propose un appel.',
  },
  {
    input: 'Combien de personnes travaillaient sur Ankhora ?',
    locale: 'fr',
    expected: 'Le nombre n’est pas documenté au-delà d’un projet d’équipe mené par Lény : ne l’invente pas.',
  },
];

evalite('Inference', {
  data: inferable.map((input) => ({ input })),
  task: ask,
  scorers: [Useful, Faithful, Reasoned, Offered, Plain, Vouvoie],
});

evalite('Unanswerable', {
  data: unanswerable.map((input) => ({ input })),
  task: ask,
  scorers: [Admitted, Faithful, Plain, Vouvoie],
});
