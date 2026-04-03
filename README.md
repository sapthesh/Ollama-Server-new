# Ollama Service monitoring system



This is a system for monitoring and detecting the availability and performance of Ollama services. It provides a modern web interface, supports multiple languages ​​(English), and has real-time detection and data display capabilities.

---

## Features

- 🔍 Service Monitoring
- Supports batch monitoring of Ollama services
- Real-time display of monitoring status and results
- Supports exporting monitoring results
- Supports automatic FOFA scanning
- 📊 Performance Monitoring
- Tests service response time and TPS
- Displays a list of available models
- Visualizes performance data
- 🌐 Multi-language Support
- English interface
- One-click language switching
- 🎯 Advanced Filtering
- Model filtering
- TPS/update time sorting
- Paginated display

## Technology Stack

- ⚡️ Next.js 14 - React Framework
- 🔥 TypeScript - Type Safety
- 🎨 Tailwind CSS - Style Framework
- 🌍 next-intl - Internationalization
- 🔄 Server Components - Server-Side Components
- 📱 Responsive Design - Mobile Adaptation

## Quick Start

### Prerequisites

- Node.js 18.0 or higher
- npm or yarn package manager

### Installation

```bash
# Clone project
git clone https://github.com/forrany/Awesome-Ollama-Server.git
cd Awesome-Ollama-Server

# Install dependencies
npm install
# or
yarn install
```

### Development Environment

```bash
# Start the development server
npm run dev
# or
yarn dev
```

Visit [http://localhost:3000](http://localhost:3000/) to view the application.

### Production Environment

```bash
# Build the project
npm run build
# or
yarn build

# Start the service
npm start
# or
yarn start
```

## Instructions

### Testing Service

1. Click the "Test Service" button
2. In the dialog box that pops up, enter the Ollama service address (one per line)
3. Click "Start Testing"
4. Wait for the test to complete and view the results
5. Optionally download the test results

### Filtering and Sorting

- Use the model filter to select a specific model
- Sort by TPS or update time
- Use the search box to quickly find a model

### Language Switching

- Click the language switch button in the upper right corner
- Select English

## Project Structure

```
src/
├── app/ # Next.js application directory
├── components/ # React components
├── i18n/ # Internationalization files
├── lib/ # Utility functions
├── types/ # TypeScript type definitions
└── config/ # Configuration files
```

## Environment Variables

Create a `.env` file and set the following variables. Github Actions will automatically monitor and upload.

```
# Optional: Redis configuration (if used)

UPSTASH_REDIS_URL=your-redis-url

UPSTASH_REDIS_TOKEN=your-redis-token

# Optional: FOFA scan country list (if used)

COUNTRYS=US,CN,RU
```

## Contribution Guidelines

1. Fork the project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a pull request

## License

This project is open source under the MIT License - see the [LICENSE](https://github.com/sapthesh/Ollama-Server/blob/main/LICENSE) file for details.

## Author

Vincent Ko (@forrany) - [GitHub](https://github.com/forrany)

## Disclaimer

1. This project is for security research and educational purposes only.
2. This project may not be used for any illegal purposes.
3. The author is not responsible for any losses caused by the use of this project.
4. Data is sourced from the internet. If there is any infringement, please contact the author to remove it.

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=sapthesh/Ollama-Server&type=Date)](https://star-history.com/#sapthesh/Ollama-Server&Date)

## Docker Deployment

The project supports Docker deployment, making it easy to quickly set up in various environments.

### Deployment with Docker Compose (Recommended)

1. Ensure [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) are installed.

2. Clone the repository and navigate to the project directory.

```bash
git clone https://github.com/forrany/Awesome-Ollama-Server.git
cd Awesome-Ollama-Server
```

3. Create an environment variable file (if using Upstash Redis data storage)

```bash
cp .env.example .env
```

Then edit the `.env` file and fill in the Upstash Redis credentials:

```
UPSTASH_REDIS_URL=your_redis_url
UPSTASH_REDIS_TOKEN=your_redis_token
```

4. Start the Services

```bash
docker-compose up -d
```

This will start two services:
- `ollama-monitor`: A web application, viewable at http://localhost:3000
- `monitor-service`: A background monitoring service that automatically collects Ollama service data

### Deploying with Docker Only

If you only need to deploy a web application and don't need a backend monitoring service:

```bash
# Build the image
docker build -t ollama-monitor .

# Run the container
docker run -d -p 3000:3000 --name ollama-monitor \
-e UPSTASH_REDIS_URL=your_redis_url \
-e UPSTASH_REDIS_TOKEN=your_redis_token \
ollama-monitor
```

Visit [http://localhost:3000](http://localhost:3000/) to view the application.
