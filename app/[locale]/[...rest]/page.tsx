import { notFound } from 'next/navigation';

export const dynamicParams = true;

export default function Unknown() {
  notFound();
}
