# Docker Setup for Harmony Exercise Solver

## Quick Start

### Prerequisites
- Docker
- Docker Compose

### Running the Application

1. **Build and start all services:**
   ```bash
   docker-compose up --build
   ```

2. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

3. **Stop the application:**
   ```bash
   docker-compose down
   ```

## Development

### Backend Development
```bash
# Run backend only
docker-compose up backend

# View logs
docker-compose logs -f backend
```

### Frontend Development
```bash
# Run frontend only
docker-compose up frontend

# View logs
docker-compose logs -f frontend
```

## Features

### Web Interface
- **2 or 4 staves** - Toggle between 2-staff (piano) and 4-staff (SATB) views
- **Tempo** - Set tempo in BPM
- **Time Signature** - Choose from 4/4, 3/4, 2/4, 6/8
- **Key Signature** - Select any major key
- **Display Options:**
  - Show/hide Roman numerals (chord analysis)
  - Show/hide inversions
  - Show/hide figured bass
- **Note Input** - Click on staff to add notes
- **Multiple Exercise Lines** - Original and solution displayed side by side
- **PDF Export** - Export both original and solution to PDF

### Exercise Types
- Bass line harmonization
- Melody harmonization
- Counterpoint (species 1)
- Error checking and correction

## API Endpoints

- `POST /api/harmonize` - Harmonize a bass line
- `POST /api/harmonize-melody` - Harmonize a melody
- `POST /api/counterpoint` - Generate counterpoint
- `POST /api/check-errors` - Check for errors
- `POST /api/export-pdf` - Export to PDF

## Troubleshooting

### Port conflicts
If ports 3000 or 8000 are already in use, modify `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Change frontend port
  - "8001:8000"  # Change backend port
```

### Rebuild after code changes
```bash
docker-compose up --build
```

### View container logs
```bash
docker-compose logs -f [service_name]
```

