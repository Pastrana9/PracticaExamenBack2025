import { Collection, ObjectId } from "mongodb";
import { GraphQLError } from "graphql";
import { RestaurantModel } from "./type.ts";
import { validatePhone, getWeather, getTimezone } from "./utils.ts";

type Context = {
    RestaurantCollection: Collection<RestaurantModel>;
};

// Argumentos de Mutación
type MutationAddArgs = {
    name: string;
    address: string;
    city: string;
    phone: string;
};
type MutationDeleteArgs = {
    id: string;
};
type QueryGetByIdArgs = {
    id: string;
};
type QueryGetByCityArgs = {
    city: string;
};

export const resolvers = {
    Restaurant: {
        id: (parent: RestaurantModel) => parent._id?.toString(),
        address: (parent: RestaurantModel) =>
            `${parent.address}, ${parent.city}, ${parent.country}`,
        // Los campos temperature y localTime se resuelven en los resolvers de queries
    },
    Query: {
        getRestaurant: async (
            _: unknown,
            args: QueryGetByIdArgs,
            context: Context
        ) => {
            const rest = await context.RestaurantCollection.findOne({ _id: new ObjectId(args.id) });
            if (!rest) throw new GraphQLError("Restaurante no encontrado");
            const temperature = await getWeather(rest.city, rest.country);
            const localTime = await getTimezone(rest.city, rest.country);
            return {
                ...rest,
                temperature,
                localTime
            };
        },
        getRestaurants: async (
            _: unknown,
            args: QueryGetByCityArgs,
            context: Context
        ) => {
            const rests = await context.RestaurantCollection.find({ city: args.city }).toArray();
            // Para cada restaurante, obtener clima y hora local
            return await Promise.all(
                rests.map(async (rest) => ({
                    ...rest,
                    temperature: await getWeather(rest.city, rest.country),
                    localTime: await getTimezone(rest.city, rest.country)
                }))
            );
        }
    },
    Mutation: {
        addRestaurant: async (
            _: unknown,
            args: MutationAddArgs,
            context: Context
        ) => {
            // Verifica número de teléfono válido y obtiene país
            const country = await validatePhone(args.phone);

            // Verifica si ya existe ese teléfono
            const exists = await context.RestaurantCollection.findOne({ phone: args.phone });
            if (exists) throw new GraphQLError("Ya existe un restaurante con ese número de teléfono");

            // Inserta restaurante
            const { insertedId } = await context.RestaurantCollection.insertOne({
                ...args,
                country
            });
            const inserted = await context.RestaurantCollection.findOne({ _id: insertedId });
            if (!inserted) throw new GraphQLError("Error creando restaurante");

            // Incluye temperatura y hora local
            const temperature = await getWeather(inserted.city, country);
            const localTime = await getTimezone(inserted.city, country);
            return {
                ...inserted,
                temperature,
                localTime
            };
        },
        deleteRestaurant: async (
            _: unknown,
            args: MutationDeleteArgs,
            context: Context
        ) => {
            const { deletedCount } = await context.RestaurantCollection.deleteOne({ _id: new ObjectId(args.id) });
            return deletedCount === 1;
        }
    }
};