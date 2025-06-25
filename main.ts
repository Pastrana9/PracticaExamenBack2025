import 'https://deno.land/std@0.223.0/dotenv/load.ts'
import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import { MongoClient } from 'npm:mongodb'

// ====== VARIABLES DE ENTORNO ======
const MONGO_URL = Deno.env.get('MONGO_URL')!
const API_KEY = Deno.env.get('API_KEY')!

// ====== CONEXIÓN CON MONGO ======
const client = new MongoClient(MONGO_URL)
const db = client.db('restaurantes')
const RestaurantCollection = db.collection('restaurants')

// ====== TYPEDEFS ======
const typeDefs = `
  type Restaurant {
    id: ID!
    name: String!
    address: String!
    city: String!
    phone: String!
    temperature: String
    localTime: String
  }

  type Query {
    getRestaurant(id: ID!): Restaurant
    getRestaurants(city: String!): [Restaurant!]!
  }

  type Mutation {
    addRestaurant(
      name: String!
      address: String!
      city: String!
      phone: String!
    ): Restaurant
    deleteRestaurant(id: ID!): Boolean
  }
`

// ====== MAPEADO DE CIUDADES A ZONAS HORARIAS PARA API NINJAS ======
const cityToTimezone: Record<string, string> = {
  "Madrid": "Europe/Madrid",
  "Barcelona": "Europe/Madrid",
  "London": "Europe/London",
  "Paris": "Europe/Paris",
  "New York": "America/New_York",
  "Los Angeles": "America/Los_Angeles",
  "Tokyo": "Asia/Tokyo",
  "Berlin": "Europe/Berlin",
  "Rome": "Europe/Rome",
  "Lisbon": "Europe/Lisbon"
  // Añade más según necesidades
}

// ====== FUNCIONES AUXILIARES ======
// Obtiene latitud y longitud de la ciudad usando OpenStreetMap (gratuito, sin API key)
async function fetchLatLon(city: string) {
  const url = `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(city)}&format=json&limit=1`
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'EjercicioExamen2025/1.0 (pastrana9@ejemplo.com)'
    }
  })
  if (!res.ok) {
    const error = await res.text()
    console.log("Nominatim error:", error)
    return null
  }
  const data = await res.json()
  if (data.length === 0) {
    console.log(`No se encontró lat/lon para la ciudad: ${city}`)
    return null
  }
  return {
    lat: data[0].lat,
    lon: data[0].lon,
  }
}

// Obtiene temperatura usando API Ninjas con lat/lon (permite uso gratuito)
async function fetchTemperature(city: string) {
  const coords = await fetchLatLon(city)
  if (!coords) return null
  const { lat, lon } = coords
  const res = await fetch(
    `https://api.api-ninjas.com/v1/weather?lat=${lat}&lon=${lon}`,
    { headers: { 'X-Api-Key': API_KEY } }
  )
  if (!res.ok) {
    const error = await res.text()
    console.log("API Ninjas Weather error:", error)
    return null
  }
  const data = await res.json()
  console.log("API Ninjas Weather:", data)
  return data.temp ? `${data.temp} °C` : null
}

// Obtiene la hora local usando API Ninjas (GRATIS usando timezone)
async function fetchLocalTime(city: string) {
  const timezone = cityToTimezone[city]
  if (!timezone) {
    console.log(`No hay zona horaria conocida para la ciudad: ${city}`)
    return null
  }
  const res = await fetch(
    `https://api.api-ninjas.com/v1/worldtime?timezone=${encodeURIComponent(timezone)}`,
    { headers: { 'X-Api-Key': API_KEY } }
  )
  if (!res.ok) {
    const error = await res.text()
    console.log("API Ninjas WorldTime error:", error)
    return null
  }
  const data = await res.json()
  console.log("API Ninjas WorldTime:", data)
  return data.datetime ? data.datetime : null
}

// Validación simple de teléfono español internacional
async function validatePhone(phone: string) {
  return /^\+34\d{9}$/.test(phone)
}

// ====== RESOLVERS ======
const resolvers = {
  Query: {
    getRestaurant: async (_: any, { id }: { id: string }) => {
      const r = await RestaurantCollection.findOne({ _id: { $oid: id } })
      if (!r) return null
      return {
        id: r._id.toString(),
        ...r,
      }
    },
    getRestaurants: async (_: any, { city }: { city: string }) => {
      const cursor = RestaurantCollection.find({ city })
      const arr = []
      for await (const r of cursor) {
        arr.push({
          id: r._id.toString(),
          ...r,
        })
      }
      return arr
    },
  },
  Mutation: {
    addRestaurant: async (
      _: any,
      { name, address, city, phone }: { name: string; address: string; city: string; phone: string }
    ) => {
      const isValid = await validatePhone(phone)
      if (!isValid) throw new Error('Teléfono no válido. Debe ser tipo +34XXXXXXXXX')
      const temperature = await fetchTemperature(city)
      const localTime = await fetchLocalTime(city)
      const insertResult = await RestaurantCollection.insertOne({
        name,
        address,
        city,
        phone,
        temperature,
        localTime,
      })
      return {
        id: insertResult.insertedId.toString(),
        name,
        address,
        city,
        phone,
        temperature,
        localTime,
      }
    },
    deleteRestaurant: async (_: any, { id }: { id: string }) => {
      const res = await RestaurantCollection.deleteOne({ _id: { $oid: id } })
      return res.deletedCount === 1
    },
  },
}

// ====== ARRANQUE ======
try {
  await client.connect()
  console.log('Conectado a MongoDB')
} catch (e) {
  console.error('Error conectando a MongoDB:', e)
}

const server = new ApolloServer({ typeDefs, resolvers })
const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
})

console.log(`Servidor listo en: ${url}`)