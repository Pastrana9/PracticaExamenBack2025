import { OptionalId, ObjectId } from "mongodb";

// Modelo de restaurante
export type RestaurantModel = OptionalId<{
    name: string,
    address: string,
    city: string,
    phone: string,
    country: string
}>;

// Validación de teléfono (API Ninjas)
export type API_Phone = {
    is_valid: boolean;
    country: string;
};

// Clima actual (API Ninjas)
export type API_Weather = {
    temp: number;
    city: string;
    country: string;
};

// Hora local (API Ninjas)
export type API_Timezone = {
    datetime: string; // formato "2024-06-25 19:31:06"
};