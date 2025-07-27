# Development Guide

## Running the Application

### Frontend Only (Development Mode)

The app can run without the backend using mock data for development and testing:

```bash
cd frontend
npm install
npm run dev
```

The app will automatically use mock authentication and data when the backend is not available.

### With Backend

To run the full application with the backend:

1. **Set up Backend**:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. **Set up Database** (PostgreSQL required):
```bash
# Create database
createdb macrolens

# Run migrations
alembic upgrade head
```

3. **Start Backend**:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

4. **Configure Frontend**:
Edit `frontend/.env.local`:
```env
NEXT_PUBLIC_USE_REAL_API=true
NEXT_PUBLIC_API_URL=http://localhost:8000
```

5. **Start Frontend**:
```bash
cd frontend
npm run dev
```

## Configuration

### Environment Variables

**Frontend (.env.local):**
- `NEXT_PUBLIC_USE_REAL_API`: Set to `true` to use real backend, `false` for mock data
- `NEXT_PUBLIC_API_URL`: Backend API URL (default: http://localhost:8000)

**Backend:**
- See `backend/app/core/config.py` for all configuration options
- Database, Redis, and API keys configuration

## Features

### Mock Mode Features
- ✅ Authentication (login/register)
- ✅ User profiles
- ✅ Food and exercise logging
- ✅ Progress tracking
- ✅ Charts and analytics
- ✅ Goal management
- ✅ All dashboard features

### Backend-Only Features
- Recipe URL import
- AI-powered nutrition analysis
- Advanced OCR processing
- Real-time data sync

## Development Tips

1. **Mock Data**: The app automatically generates realistic mock data for testing
2. **Data Persistence**: All data is stored in browser localStorage
3. **Reset Data**: Clear browser localStorage to reset all data
4. **Backend Status**: Check console for "Using mock auth" messages

## Error Resolution

### "Failed to fetch" Error
This indicates the frontend can't connect to the backend. Solutions:
1. Use mock mode (default in development)
2. Start the backend server
3. Check backend URL in environment variables

### Database Connection Issues
1. Ensure PostgreSQL is running
2. Check database connection string in config
3. Run database migrations

### Dependencies Issues
1. Clear node_modules and reinstall: `rm -rf node_modules && npm install`
2. Update dependencies: `npm update`
3. Check Node.js version compatibility