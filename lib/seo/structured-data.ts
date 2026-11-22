import siteConfig from '@/config/site';
import { clients } from '@/content/clients';

const { url, blogUrl, author, profiles } = siteConfig;

export const PERSON_ID = `${url}/#person`;

interface Page {
  locale: string;
  url: string;
  role: string;
  description: string;
}

export function structuredData(page: Page) {
  const employer = clients.find((client) => client.employer);

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': PERSON_ID,
        name: author.name,
        alternateName: ['Leny Sauzet', author.handle],
        givenName: 'Lény',
        familyName: 'Sauzet',
        jobTitle: page.role,
        description: page.description,
        url,
        image: `${url}/opengraph-image`,
        email: `mailto:${siteConfig.email}`,
        address: { '@type': 'PostalAddress', addressLocality: author.city, addressCountry: 'FR' },
        worksFor: employer && { '@type': 'Organization', name: employer.name, url: employer.href },
        alumniOf: { '@type': 'EducationalOrganization', name: 'Epitech', url: 'https://www.epitech.eu' },
        knowsAbout: ['Artificial intelligence', 'Conversational AI', 'Software architecture', 'Web development'],
        sameAs: [...profiles.map((profile) => profile.url), blogUrl],
      },
      {
        '@type': 'ProfilePage',
        '@id': `${page.url}#profile`,
        url: page.url,
        name: `${author.name} · ${page.role}`,
        mainEntity: { '@id': PERSON_ID },
        inLanguage: page.locale,
      },
      {
        '@type': 'WebSite',
        '@id': `${url}/#website`,
        url,
        name: author.name,
        publisher: { '@id': PERSON_ID },
      },
    ],
  };
}

export const serialize = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c');
