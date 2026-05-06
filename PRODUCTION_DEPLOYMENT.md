# Production Deployment Guide

## Al-Khwarizmi (HTI) Attendance Management System

### Prerequisites

- Python 3.11+
- PostgreSQL 15+ (recommended for production)
- Redis (optional, for Celery tasks)
- Nginx (for production reverse proxy)

### Quick Start (Development)

```bash
# Install dependencies
pip install -r requirements.txt

# Copy environment variables
cp .env.example .env
# Edit .env with your settings

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run development server
python manage.py runserver
```

### Production Deployment

#### Option 1: Docker (Recommended)

```bash
# Start the application
docker-compose up -d

# Run migrations
docker-compose exec web python manage.py migrate

# Create superuser
docker-compose exec web python manage.py createsuperuser
```

#### Option 2: Traditional

```bash
# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with:
#   - SECRET_KEY (generate a secure key)
#   - DEBUG=False
#   - ALLOWED_HOSTS=yourdomain.com
#   - DB_ENGINE=django.db.backends.postgresql_psycopg2
#   - DB_NAME, DB_USER, DB_PASSWORD

# Install PostgreSQL and create database
sudo apt-get install postgresql
sudo -u postgres createuser hti
sudo -u postgres createdb hti_vip

# Run migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic

# Run with Gunicorn
gunicorn --bind 0.0.0.0:8000 --workers 4 HTI.wsgi:application
```

### Production Checklist

- [ ] Set `DEBUG=False` in environment
- [ ] Configure `SECRET_KEY` (at least 50 characters)
- [ ] Configure `ALLOWED_HOSTS` with your domain
- [ ] Use PostgreSQL instead of SQLite
- [ ] Configure proper `ALLOWED_HOSTS` for CORS
- [ ] Set up SSL/HTTPS
- [ ] Configure regular database backups
- [ ] Set up log rotation
- [ ] Configure static file serving (Nginx/WhiteNoise)
- [ ] Set up health check monitoring at `/health/`

### Health Check

The system provides a health check endpoint:

```
GET /health/
```

Response:
```json
{
    "status": "healthy",
    "service": "Al-Khwarizmi Attendance System",
    "version": "1.0.0"
}
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SECRET_KEY` | Django secret key | Required |
| `DEBUG` | Debug mode | False |
| `ALLOWED_HOSTS` | Allowed hosts (comma-separated) | localhost |
| `DB_ENGINE` | Database engine | sqlite3 |
| `DB_NAME` | Database name | hti_vip |
| `DB_USER` | Database user | hti |
| `DB_PASSWORD` | Database password | - |
| `DB_HOST` | Database host | localhost |
| `DB_PORT` | Database port | 5432 |
| `CELERY_BROKER_URL` | Celery broker URL | redis://localhost:6379/0 |

### Running Tests

```bash
python manage.py test Attendance.tests
```

### Troubleshooting

#### Database Connection Issues
- Verify PostgreSQL is running: `pg_isready`
- Check firewall rules for port 5432
- Verify credentials in .env

#### Static Files Not Loading
- Run: `python manage.py collectstatic`
- Check Nginx configuration for static file serving

#### Biometric Device Sync Issues
- Verify device IP and port are correct
- Check network connectivity to device
- Ensure pyzk library is installed