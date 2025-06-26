// typeDefs.ts
export const typeDefs = `#graphql
  type Restaurante {
    id: ID!
    nombre: String!
    direccion: String!
    ciudad: String!
    pais: String!
    telefono: String!
    direccionCompleta: String!   # dirección + ciudad + país
    temperatura: Float           # temperatura actual en °C
    horaLocal: String            # formato hh:mm
  }

  type Query {
    getRestaurant(id: ID!): Restaurante!
    getRestaurants(ciudad: String!): [Restaurante!]!
  }

  type Mutation {
    addRestaurant(
      nombre: String!
      direccion: String!
      ciudad: String!
      telefono: String!
    ): Restaurante!

    deleteRestaurant(id: ID!): Boolean!
  }
`;

