import { GraphQLClient } from 'graphql-request';

const endpoint = process.env.HASURA_GRAPHQL_ENDPOINT || 'http://localhost:8080/v1/graphql';
const adminSecret = process.env.HASURA_ADMIN_SECRET || 'myadminsecret';

export const adminGraphQL = new GraphQLClient(endpoint, {
  headers: {
    'x-hasura-admin-secret': adminSecret,
  },
});
