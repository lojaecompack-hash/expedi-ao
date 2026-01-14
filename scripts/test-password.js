// Teste com diferentes encodings da senha
const passwords = [
  '@Bruno0154',           // Original
  '%40Bruno0154',         // URL encoded
  encodeURIComponent('@Bruno0154'), // JS encoded
]

passwords.forEach((pwd, i) => {
  const url = `postgresql://postgres:${pwd}@db.lholkeljnuevtcu.supabase.co:5432/postgres`
  console.log(`\nTeste ${i + 1}:`)
  console.log('Senha:', pwd)
  console.log('URL length:', url.length)
  console.log('URL:', url.substring(0, 60) + '...')
})

console.log('\n\nURL atual no .env.local:')
require('dotenv').config({ path: '.env.local' })
console.log('Length:', process.env.DATABASE_URL?.length)
console.log('URL:', process.env.DATABASE_URL)
