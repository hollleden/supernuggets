import { createHmac, createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? ''

function verifyTelegramAuth(params: Record<string, string>): boolean {
  const { hash, ...data } = params
  if (!hash || !BOT_TOKEN) return false

  const authDate = Number(data.auth_date ?? 0)
  if (Date.now() / 1000 - authDate > 86400) return false

  const checkString = Object.keys(data)
    .sort()
    .map((k) => `${k}=${data[k]}`)
    .join('\n')

  const secretKey = createHash('sha256').update(BOT_TOKEN).digest()
  const hmac = createHmac('sha256', secretKey).update(checkString).digest('hex')
  return hmac === hash
}

export async function GET(req: NextRequest) {
  const params: Record<string, string> = {}
  req.nextUrl.searchParams.forEach((v, k) => {
    params[k] = v
  })

  if (!verifyTelegramAuth(params)) {
    return NextResponse.redirect(new URL('/?error=auth_failed', req.url))
  }

  const telegramUserId = Number(params.id)
  if (!telegramUserId) {
    return NextResponse.redirect(new URL('/?error=auth_failed', req.url))
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .select('token')
    .eq('user_id', telegramUserId)
    .maybeSingle()

  if (error || !data) {
    return NextResponse.redirect(
      new URL('/?error=no_vault', req.url)
    )
  }

  return NextResponse.redirect(
    new URL(`/u/${data.token}/`, req.url)
  )
}
