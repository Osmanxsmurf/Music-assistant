# Music Assistant Projesi Kurulum Betiği
Write-Host "Music Assistant Projesi Kurulumu Başlatılıyor..." -ForegroundColor Green

# Python sanal ortamı kurulumu
if (-not (Test-Path ".\venv")) {
    Write-Host "Python sanal ortamı oluşturuluyor..." -ForegroundColor Yellow
    python -m venv venv
}

# Sanal ortamı etkinleştirme
Write-Host "Sanal ortam etkinleştiriliyor..." -ForegroundColor Yellow
.\venv\Scripts\Activate.ps1

# Python paketlerini yükleme
Write-Host "Python paketleri yükleniyor..." -ForegroundColor Yellow
pip install datasets whoosh fastapi uvicorn motor python-jose[cryptography] passlib[bcrypt]

# Node.js paketlerini yükleme
Write-Host "Node.js paketleri yükleniyor..." -ForegroundColor Yellow
npm install

# Veritabanı kurulumu
Write-Host "Veritabanı oluşturuluyor..." -ForegroundColor Yellow
node create_users_db.js

Write-Host "Kurulum tamamlandı!" -ForegroundColor Green
Write-Host "Backend başlatmak için: cd api && uvicorn main:app --reload" -ForegroundColor Cyan
Write-Host "Frontend başlatmak için: npm run dev" -ForegroundColor Cyan
