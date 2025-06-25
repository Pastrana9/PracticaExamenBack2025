export const typeDefs = `#graphql

    type Restaurant {
        id: ID!,
        name: String!,
        address: String!,
        phone: String!,
        temperature: Float!,
        localTime: String!
    }

    type Query {
        getRestaurant(id: ID!): Restaurant
        getRestaurants(city: String!): [Restaurant!]!
    }

    type Mutation {
        addRestaurant(
            name: String!,
            address: String!,
            city: String!,
            phone: String!
        ): Restaurant!
        deleteRestaurant(id: ID!): Boolean!
    }
`