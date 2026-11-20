import { describe, expect, it } from 'vitest';

import { PERSON_ID, serialize, structuredData } from './structured-data';

describe('structuredData', () => {
  const graph = structuredData()['@graph'];
  const person = graph.find((node) => node['@type'] === 'Person')!;

  it('names the person under every spelling a search may use and ties their profiles to them', () => {
    expect(person).toMatchObject({ name: 'Lény Sauzet', alternateName: expect.arrayContaining(['Leny Sauzet']) });
    expect(person.sameAs).toEqual(expect.arrayContaining(['https://github.com/LenySauzet', 'https://blog.lenysauzet.com']));
  });

  it('makes the page a profile of that person', () => {
    expect(graph.find((node) => node['@type'] === 'ProfilePage')).toMatchObject({ mainEntity: { '@id': PERSON_ID } });
  });

  it('cannot close its script tag', () => {
    expect(serialize({ name: '</script><script>alert(1)</script>' })).not.toContain('</script>');
  });
});
