import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.ts";
import "dotenv/config";

const globalForPrisma = globalThis;

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });

export const db = globalForPrisma.prisma || new PrismaClient({ adapter });

if(process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;