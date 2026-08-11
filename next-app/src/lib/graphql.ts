const ENDPOINT = process.env.NEXT_PUBLIC_HASURA_ENDPOINT || 'http://localhost:8080/v1/graphql';
const ADMIN_SECRET = process.env.NEXT_PUBLIC_HASURA_ADMIN_SECRET || 'myadminsecret';

export async function gqlQuery(query: string, variables?: Record<string, any>) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': ADMIN_SECRET,
    },
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
}

export function getWsUrl() {
  return ENDPOINT.replace('http://', 'ws://').replace('https://', 'wss://');
}