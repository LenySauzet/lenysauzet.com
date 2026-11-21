const NETWORK_GROUPS = 4;

const expand = (address: string) => {
  const [head = '', tail] = address.split('::');
  const groups = (part: string) => (part ? part.split(':') : []);
  const known = [...groups(head), ...groups(tail ?? '')];
  return tail === undefined ? known : [...groups(head), ...Array(8 - known.length).fill('0'), ...groups(tail)];
};

export const networkOf = (address: string) =>
  address.includes(':')
    ? expand(address)
        .slice(0, NETWORK_GROUPS)
        .map((group) => group.toLowerCase().replace(/^0+(?=.)/, ''))
        .join(':')
    : address;
