import { GraphQLError } from "graphql";
import { API_Phone, API_Weather, API_Timezone } from "./type.ts";

const API_KEY = Deno.env.get("API_KEY");

export const validatePhone = async (phone: string) => {
    if (!API_KEY) throw new Error("API_KEY no está definida");
    const url = `https://api.api-ninjas.com/v1/validatephone?number=${phone}`;
    const data = await fetch(url, {
        headers: { "X-Api-Key": API_KEY }
    });
    if (data.status !== 200) throw new GraphQLError("Error con la API de teléfono");
    const result: API_Phone = await data.json();
    if (!result.is_valid) throw new GraphQLError("El número de teléfono no es válido");
    return result.country;
};

export const getWeather = async (city: string, country: string) => {
    if (!API_KEY) throw new Error("API_KEY no está definida");
    const url = `https://api.api-ninjas.com/v1/weather?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}`;
    const data = await fetch(url, {
        headers: { "X-Api-Key": API_KEY }
    });
    if (data.status !== 200) throw new GraphQLError("Error obteniendo clima");
    const result = await data.json();
    if (!result.temp) throw new GraphQLError("No se pudo obtener la temperatura");
    return result.temp as number;
};

export const getTimezone = async (city: string, country: string) => {
    if (!API_KEY) throw new Error("API_KEY no está definida");
    const url = `https://api.api-ninjas.com/v1/timezone?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}`;
    const data = await fetch(url, {
        headers: { "X-Api-Key": API_KEY }
    });
    if (data.status !== 200) throw new GraphQLError("Error obteniendo zona horaria");
    const result: API_Timezone = await data.json();
    if (!result.datetime) throw new GraphQLError("No se pudo obtener la hora local");
    // retorna solo hh:mm
    return result.datetime.slice(11, 16);
};