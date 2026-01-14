import { NextResponse } from 'next/server'

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || 'NOT_SET'
  
  return NextResponse.json({
    DATABASE_URL_present: Boolean(process.env.DATABASE_URL),
    DATABASE_URL_length: dbUrl.length,
    DATABASE_URL_start: dbUrl.substring(0, 30),
    DATABASE_URL_contains_5432: dbUrl.includes(':5432'),
    DATABASE_URL_contains_6543: dbUrl.includes(':6543'),
  })
}
