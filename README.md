# 🌱 Horti - Garden Companion

A full-stack gardening application built with Clojure/Pedestal backend and React frontend, based on the score_me project architecture.

## Features

- **🎯 Interactive Garden Canvas**: Visual garden layout where you can place plant images by clicking on the canvas
- **📊 Daily Metrics Logging**: Click on any plant to log daily measurements:
  - **EC (Electrical Conductivity)**: Monitor nutrient levels in your growing medium
  - **pH Levels**: Track acidity/alkalinity for optimal plant health  
  - **Temperature**: Record environmental temperature conditions
  - **Humidity**: Monitor moisture levels in the air
  - **Notes**: Add daily observations and care notes
- **📈 Historical Data**: View metrics trends and averages over time
- **🌱 Plant Positioning**: Drag-and-drop style plant placement with visual coordinates
- **🔐 Google OAuth Authentication**: Secure login with Google accounts
- **🔑 JWT Token Management**: Secure API access with JWT tokens
- **💾 MongoDB Storage**: Persistent data storage with MongoDB
- **💄 Modern UI**: Beautiful Material-UI interface with gardening theme

## Tech Stack

### Backend
- **Clojure 1.11.2** - Functional programming language
- **Pedestal 0.7.2** - Web framework for APIs
- **Component** - Lifecycle management
- **MongoDB** - Document database with Monger client
- **JWT Authentication** - Google OAuth integration
- **Cheshire** - JSON parsing

### Frontend
- **React 19.1.0** - Modern UI framework
- **Material-UI 7.0.2** - Component library
- **React Router** - Client-side routing
- **Google OAuth** - Authentication
- **JWT Decode** - Token management

## Getting Started

### Prerequisites
- Java 11+
- Clojure CLI tools
- Node.js 18+
- MongoDB (local or cloud)

### Backend Setup

1. **Clone and navigate to the project:**
   ```bash
   cd horti_clj
   ```

2. **Install dependencies:**
   ```bash
   clojure -P  # Download dependencies
   ```

3. **Run tests:**
   ```bash
   clojure -M:test
   ```

4. **Start the development server:**
   ```bash
   clojure -M -m horti.core
   ```
   
   The API will be available at `http://localhost:8080`

### Frontend Setup

1. **Navigate to the UI directory:**
   ```bash
   cd horti-ui
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the `horti-ui` directory:
   ```
   REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here
   ```

4. **Start the development server:**
   ```bash
   npm start
   ```
   
   The UI will be available at `http://localhost:3000`

## Usage

### Getting Started with the Canvas

1. **Login** with your Google account
2. **Navigate to the Canvas** from the dashboard (featured card)
3. **Add Plants**: Click anywhere on the green canvas to place a plant
4. **Log Daily Metrics**: Click on any existing plant circle to record:
   - EC (Electrical Conductivity) 
   - pH levels
   - Temperature
   - Humidity
   - Daily notes and observations

### Best Practices for Daily Monitoring

- **Morning Routine**: Check and log pH/EC levels before any feedings
- **Consistent Timing**: Try to measure at the same time each day
- **Environmental Tracking**: Log temperature and humidity to correlate with plant health
- **Note Taking**: Record any changes, treatments, or observations

### Understanding the Metrics

- **EC (0.5-3.0)**: Measures nutrient concentration in your growing medium
- **pH (5.5-7.0)**: Optimal range for most plants' nutrient uptake  
- **Temperature (18-26°C)**: Ideal growing temperature range
- **Humidity (40-70%)**: Optimal moisture levels for healthy growth

### MongoDB Setup

1. **Local MongoDB:**
   ```bash
   # Install MongoDB and start the service
   mongod --dbpath /path/to/your/db
   ```

2. **Or use MongoDB Atlas (cloud):**
   Update the connection string in `src/horti/core.clj`:
   ```clojure
   {:mongo-uri "mongodb+srv://username:password@cluster.mongodb.net/horti"}
   ```

## API Endpoints

### Authentication
All endpoints except `/api/health` require JWT authentication via `Authorization: Bearer <token>` header.

### Plants
- `GET /api/plants` - Get user's plants with canvas positions
- `POST /api/plants` - Create a new plant with position (x, y coordinates)

### Daily Metrics  
- `POST /api/plants/:plant-id/metrics` - Log daily metrics (EC, pH, temperature, humidity)
- `GET /api/plants/:plant-id/metrics` - Get historical metrics for a plant
  - Query params: `startDate`, `endDate` for filtering

### Garden Logs
- `GET /api/garden-logs` - Get user's garden logs
- `POST /api/garden-logs` - Create a new garden log

### Health Check
- `GET /api/health` - Health check endpoint

## Project Structure

```
horti_clj/
├── deps.edn                 # Clojure dependencies
├── src/horti/
│   ├── core.clj            # Main entry point
│   ├── system.clj          # System components and routes
│   ├── jwt.clj             # JWT authentication
│   ├── http_resp.clj       # HTTP response utilities
│   └── db.clj              # Database operations
├── test/horti/             # Test files
├── horti-ui/               # React frontend
│   ├── package.json        # Node dependencies
│   ├── src/
│   │   ├── App.js          # Main React component
│   │   ├── components/     # React components
│   │   └── contexts/       # React contexts
│   └── public/             # Static files
└── README.md
```

## Development

### Running Tests
```bash
# Backend tests
clojure -M:test

# Frontend tests
cd horti-ui && npm test
```

### Code Style
- **Backend**: Follow functional programming principles with immutable data structures
- **Frontend**: Use functional React components with hooks
- **Clean Code**: Emphasize readability and maintainability

## Deployment

### Backend
```bash
# Build uberjar
clojure -M:uberjar

# Run production
java -jar target/horti.jar
```

### Frontend
```bash
cd horti-ui
npm run build
# Serve the build directory with your preferred web server
```

## Contributing

1. Follow functional programming principles
2. Write tests for new features
3. Use immutable data structures
4. Keep functions pure when possible
5. Follow the existing code style

## License

This project is based on the score_me architecture and adapted for gardening use cases. 