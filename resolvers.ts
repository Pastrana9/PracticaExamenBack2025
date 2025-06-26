// resolvers.ts
import { Collection, ObjectId, MongoServerError } from "mongodb";
import { GraphQLError } from "graphql";
import { RestaurantModel } from "./type.ts";
import {
  validatePhone,
  getCountryData,
  getLatLon,
  getTemperature,
  getLocalTime,
} from "./utils.ts";

type Context = { RestaurantCollection: Collection<RestaurantModel> };

type MutationAddArgs = {
  nombre: string;
  direccion: string;
  ciudad: string;
  telefono: string;
};

type QueryIdArgs = { id: string };
type QueryCityArgs = { ciudad: string };

export const resolvers = {
  Restaurante: {
    id: (parent) => parent._id!.toString(),
    direccionCompleta: (parent) =>
      `${parent.direccion}, ${parent.ciudad}, ${parent.pais}`,

    temperatura: async (parent) => {
      try {
        const { lat, lon } = await getLatLon(parent.ciudad);
        const temp = await getTemperature(lat, lon);
        return temp;
      } catch {
        return null;
      }
    },

    horaLocal: async (parent) => {
      try {
        const { lat, lon } = await getLatLon(parent.ciudad);
        const hora = await getLocalTime(lat, lon);
        return hora;
      } catch {
        return null;
      }
    },
  },

  Query: {
    getRestaurant: async (
      _: unknown,
      { id }: QueryIdArgs,
      { RestaurantCollection }: Context,
    ): Promise<RestaurantModel> => {
      const restaurante = await RestaurantCollection.findOne({
        _id: new ObjectId(id),
      });
      if (!restaurante) throw new GraphQLError("Restaurante no encontrado");
      return restaurante;
    },

    getRestaurants: async (
      _: unknown,
      { ciudad }: QueryCityArgs,
      { RestaurantCollection }: Context,
    ): Promise<RestaurantModel[]> => {
      return await RestaurantCollection.find({ ciudad }).toArray();
    },
  },

  Mutation: {
    addRestaurant: async (
      _: unknown,
      { nombre, direccion, ciudad, telefono }: MutationAddArgs,
      { RestaurantCollection }: Context,
    ): Promise<RestaurantModel> => {
      // Validar teléfono y país
      const { is_valid, pais } = await validatePhone(telefono);
      if (!is_valid) throw new GraphQLError("El teléfono no es válido");

      // Evitar duplicados por teléfono
      const existing = await RestaurantCollection.findOne({ telefono });
      if (existing) throw new GraphQLError("Teléfono ya registrado");

      // Obtener datos país para guardar nombre país limpio
      const countryData = await getCountryData(pais);

      try {
        const { insertedId } = await RestaurantCollection.insertOne({
          nombre,
          direccion,
          ciudad,
          pais: countryData.nombre,
          telefono,
        });

        return {
          _id: insertedId,
          nombre,
          direccion,
          ciudad,
          pais: countryData.nombre,
          telefono,
        };
      } catch (err) {
        if (err instanceof MongoServerError && err.code === 11000) {
          throw new GraphQLError("Teléfono ya registrado");
        }
        throw err;
      }
    },

    deleteRestaurant: async (
      _: unknown,
      { id }: QueryIdArgs,
      { RestaurantCollection }: Context,
    ): Promise<boolean> => {
      const { deletedCount } = await RestaurantCollection.deleteOne({
        _id: new ObjectId(id),
      });
      return deletedCount === 1;
    },
  },
};
