// main.ts
import { MongoClient } from "mongodb";
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { typeDefs } from "./typeDefs.ts";
import { resolvers } from "./resolvers.ts";
import { RestaurantModel } from "./type.ts";

const MONGO_URL = Deno.env.get("MONGO_URL");
if (!MONGO_URL) throw new Error("Error con MONGO_URL");

const client = new MongoClient(MONGO_URL);
await client.connect();
console.log("Conectado a MongoDB");

const db = client.db("agenda"); // Puedes poner nombre "restaurantes" si prefieres
const RestaurantCollection = db.collection<RestaurantModel>("restaurants");

const server = new ApolloServer({ typeDefs, resolvers });
const { url } = await startStandaloneServer(server, {
  context: async () => ({ RestaurantCollection }),
});

console.log(`🚀  Server ready at: ${url}`);
