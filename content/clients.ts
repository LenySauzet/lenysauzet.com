export interface Client {
  name: string;
  logo: string;
  href: string;
  employer?: boolean;
}

export const clients: Client[] = [
  { name: 'Tolk.ai', logo: 'clients/tolk-ai.svg', href: 'https://www.tolk.ai', employer: true },
];
