import { copyFileSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

try {
  // Create public directory if it doesn't exist
  mkdirSync(join(__dirname, '../public'), { recursive: true })
  
  // Copy the PDF.js worker
  copyFileSync(
    join(__dirname, '../node_modules/pdfjs-dist/build/pdf.worker.min.mjs'),
    join(__dirname, '../public/pdf.worker.min.mjs')
  )
  
  console.log('✅ PDF.js worker copied to public directory')
} catch (error) {
  console.error('❌ Failed to copy PDF.js worker:', error.message)
  process.exit(1)
}