// type.ts
import { OptionalId } from "mongodb";

/* ===== Modelo Mongo ===== */
export type RestaurantModel = OptionalId<{
  nombre: string;
  direccion: string;
  ciudad: string;
  pais: string;        // nombre país (obtenido por la API Ninjas)
  telefono: string;    // con prefijo nacional
}>;

/* ===== Tipos API Ninjas ===== */
export type API_Phone = { is_valid: boolean; country: string };
export type API_Country = { name: string; capital: string; iso2: string };
export type API_City = { latitude: number; longitude: number };
export type API_Weather = { temp: number };
export type API_WorldTime = { hour: number; minute: number };
