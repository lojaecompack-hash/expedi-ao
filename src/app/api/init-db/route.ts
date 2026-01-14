import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST() {
  try {
    // Executar prisma db push para criar tabelas
    const { stdout, stderr } = await execAsync('npx prisma db push --accept-data-loss')
    
    return NextResponse.json({
      ok: true,
      message: 'Database initialized successfully',
      stdout,
      stderr
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({
      ok: false,
      error: message
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST to initialize database',
    endpoint: '/api/init-db',
    method: 'POST'
  })
}
