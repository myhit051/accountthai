import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { DocType } from '@/db/schema'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Date Formatting ──────────────────────────────────────────────────────────
export function formatDateThai(date: Date | number): string {
  const d = typeof date === 'number' ? new Date(date * 1000) : date
  return d.toLocaleDateString('th-TH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function toUnixTimestamp(date: Date): number {
  return Math.floor(date.getTime() / 1000)
}

export function fromUnixTimestamp(ts: number): Date {
  return new Date(ts * 1000)
}

// ─── Currency Formatting ─────────────────────────────────────────────────────
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

// ─── Amount in Thai Words ─────────────────────────────────────────────────────
const ones = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า', 'สิบ']
const tens = ['', 'สิบ', 'ยี่สิบ', 'สามสิบ', 'สี่สิบ', 'ห้าสิบ', 'หกสิบ', 'เจ็ดสิบ', 'แปดสิบ', 'เก้าสิบ']
const millions = ['', 'ล้าน', 'สองล้าน']

function threeDigitWords(n: number): string {
  if (n === 0) return ''
  const h = Math.floor(n / 100)
  const t = Math.floor((n % 100) / 10)
  const o = n % 10
  let result = ''
  if (h > 0) result += ones[h] + 'ร้อย'
  if (t > 0) result += tens[t]
  if (o > 0) {
    if (t === 1 && o === 1) result += 'เอ็ด'
    else result += ones[o]
  }
  return result
}

export function amountInThaiWords(amount: number): string {
  const total = Math.round(amount * 100)
  const baht = Math.floor(total / 100)
  const satang = total % 100

  if (baht === 0 && satang === 0) return 'ศูนย์บาทถ้วน'

  let result = ''
  const mil = Math.floor(baht / 1000000)
  const remainder = baht % 1000000
  const thou = Math.floor(remainder / 1000)
  const hun = remainder % 1000

  if (mil > 0) result += threeDigitWords(mil) + 'ล้าน'
  if (thou > 0) result += threeDigitWords(thou) + 'พัน'
  if (hun > 0) result += threeDigitWords(hun)

  result += 'บาท'
  if (satang > 0) {
    result += threeDigitWords(satang) + 'สตางค์'
  } else {
    result += 'ถ้วน'
  }
  return result
}

// ─── Document Number Generation ───────────────────────────────────────────────
export function formatDocNumber(prefix: string, year: number, month: number, seq: number): string {
  const yy = year.toString()
  const mm = month.toString().padStart(2, '0')
  const nn = seq.toString().padStart(4, '0')
  return `${prefix}${yy}${mm}${nn}`
}

// ─── ID Generation ────────────────────────────────────────────────────────────
export function generateId(): string {
  return crypto.randomUUID()
}

// ─── VAT Calculation ─────────────────────────────────────────────────────────
export function calculateVat(subtotal: number, vatRate: number = 0.07) {
  const vat = Math.round(subtotal * vatRate * 100) / 100
  const total = Math.round((subtotal + vat) * 100) / 100
  return { vatAmount: vat, totalAmount: total }
}

// ─── Encryption for Drive tokens ────────────────────────────────────────────
import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'

export function encryptToken(text: string): string {
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex')
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted.toString('hex')
}

export function decryptToken(encryptedText: string): string {
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex')
  const [ivHex, tagHex, encryptedHex] = encryptedText.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const tag = Buffer.from(tagHex, 'hex')
  const encrypted = Buffer.from(encryptedHex, 'hex')
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
  return decrypted.toString('utf8')
}

// ─── PDF filename ─────────────────────────────────────────────────────────────
export function getPdfFilename(companyName: string, docNumber: string, partnerName: string): string {
  const sanitize = (s: string) => s.replace(/[^a-zA-Zก-๙0-9_-]/g, '_').substring(0, 30)
  return `${sanitize(companyName)}_${docNumber}_${sanitize(partnerName)}.pdf`
}
