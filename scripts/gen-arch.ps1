Add-Type -AssemblyName System.Drawing

$width = 1200
$height = 800
$bmp = New-Object System.Drawing.Bitmap($width, $height)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = 'HighQuality'

$white = [System.Drawing.Color]::White
$black = [System.Drawing.Color]::Black
$gray = [System.Drawing.Color]::FromArgb(245,245,245)

$pen = New-Object System.Drawing.Pen($black, 2)
$brushBg = New-Object System.Drawing.SolidBrush($white)
$brushBox = New-Object System.Drawing.SolidBrush($gray)
$brushText = New-Object System.Drawing.SolidBrush($black)

$font = New-Object System.Drawing.Font('Segoe UI', 12)
$titleFont = New-Object System.Drawing.Font('Segoe UI', 16, [System.Drawing.FontStyle]::Bold)
$smallFont = New-Object System.Drawing.Font('Segoe UI', 10)

$g.FillRectangle($brushBg, 0, 0, $width, $height)
$g.DrawString('Edu-Pay System Architecture — Basaveshwar Engineering College (BEC)', $titleFont, $brushText, 20, 20)

function Draw-Box {
  param(
    [int]$x, [int]$y, [int]$w, [int]$h,
    [string]$title,
    [string[]]$lines
  )
  $rect = New-Object System.Drawing.Rectangle($x, $y, $w, $h)
  $g.FillRectangle($brushBox, $rect)
  $g.DrawRectangle($pen, $rect)
  $g.DrawString($title, $font, $brushText, $x + 10, $y + 10)
  $yy = $y + 40
  foreach ($ln in $lines) {
    $g.DrawString($ln, $smallFont, $brushText, $x + 10, $yy)
    $yy += 18
  }
}

function Draw-Arrow {
  param([int]$x1, [int]$y1, [int]$x2, [int]$y2)
  $g.DrawLine($pen, $x1, $y1, $x2, $y2)
  $angle = [Math]::Atan2(($y2 - $y1), ($x2 - $x1))
  $len = 10
  $ax1 = $x2 - [Math]::Cos($angle - 0.3) * $len
  $ay1 = $y2 - [Math]::Sin($angle - 0.3) * $len
  $ax2 = $x2 - [Math]::Cos($angle + 0.3) * $len
  $ay2 = $y2 - [Math]::Sin($angle + 0.3) * $len
  $pts = @(
    [System.Drawing.PointF]::new($x2, $y2),
    [System.Drawing.PointF]::new($ax1, $ay1),
    [System.Drawing.PointF]::new($ax2, $ay2)
  )
  $g.FillPolygon($brushText, $pts)
}

Draw-Box 40 80 360 190 'Frontend (React + Vite, TS)' @(
  'Pages & Components: Admin/Student',
  'API Layer: backendFetch + JWT',
  'Tailwind UI, Recharts',
  'Dev at http://localhost:8080'
)

Draw-Box 440 80 360 240 'Backend (Flask API)' @(
  'Blueprints: Auth, Students, Payments, Reports',
  'JWT auth (flask-jwt-extended)',
  'CORS: allow frontend origin',
  'Dev at http://127.0.0.1:5000'
)

Draw-Box 840 80 300 180 'Services' @(
  'payments_service.py: order/verify/list',
  'receipt_generator.py: PDF (WeasyPrint), fallback ReportLab',
  'Razorpay client (mock if no keys)'
)

Draw-Box 440 360 360 180 'Data (SQLAlchemy ORM)' @(
  'SQLite: instance/edu_pay.db',
  'Models: Student, Invoice, Payment',
  'Student.outstanding = invoices - captured'
)

Draw-Box 840 300 300 120 'External' @(
  'Razorpay API',
  'Receipts directory'
)

Draw-Box 40 300 360 120 'Dev Proxy' @(
  'Vite proxies "/api" -> 5000'
)

Draw-Arrow 400 160 440 160
Draw-Arrow 620 320 840 320
Draw-Arrow 620 440 620 360
Draw-Arrow 1040 220 1040 300
Draw-Arrow 220 260 220 300

$outPath = Join-Path (Get-Location) 'architecture.png'
$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()
Write-Output "Saved: $outPath"