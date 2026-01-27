import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// DELETE - Excluir operador (soft delete - desativa)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verificar se operador existe
    const operator = await prisma.operator.findUnique({
      where: { id }
    })

    if (!operator) {
      return NextResponse.json(
        { ok: false, error: 'Operador não encontrado' },
        { status: 404 }
      )
    }

    // Soft delete - apenas desativa o operador
    await prisma.operator.update({
      where: { id },
      data: { isActive: false }
    })

    console.log('[Operators API] Operador desativado:', id)

    return NextResponse.json({
      ok: true,
      message: 'Operador excluído com sucesso'
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[Operators API] Erro ao excluir:', message)

    return NextResponse.json(
      { ok: false, error: 'Erro ao excluir operador', details: message },
      { status: 500 }
    )
  }
}

// PATCH - Atualizar operador
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    const { name, email, phone, isActive } = body

    // Verificar se operador existe
    const operator = await prisma.operator.findUnique({
      where: { id }
    })

    if (!operator) {
      return NextResponse.json(
        { ok: false, error: 'Operador não encontrado' },
        { status: 404 }
      )
    }

    // Atualizar operador
    const updatedOperator = await prisma.operator.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(isActive !== undefined && { isActive })
      }
    })

    console.log('[Operators API] Operador atualizado:', id)

    return NextResponse.json({
      ok: true,
      operator: updatedOperator
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[Operators API] Erro ao atualizar:', message)

    return NextResponse.json(
      { ok: false, error: 'Erro ao atualizar operador', details: message },
      { status: 500 }
    )
  }
}
