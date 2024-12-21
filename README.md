<div align="center">
  <img src="assets/images/logo.webp" alt="Lexify Logo" width="200" height="200"/>
</div>

# Lexify - Your Virtual Courtroom Buddy 🏛️

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-brightgreen.svg)](https://github.com/suyash101101/lexify/releases)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Made with Love](https://img.shields.io/badge/Made%20with-❤️-red.svg)](https://github.com/suyash101101/lexify)

> Transform your legal practice with AI-powered courtroom simulations

## Table of Contents

- [✨ Overview](#overview)
- [🚀 Key Features](#key-features)
- [💻 System Requirements](#system-requirements)
- [⚙️ Installation](#installation)
- [🏗️ Architecture](#architecture)
- [📖 Usage Guide](#usage-guide)
- [📄 License](#license)

## Overview

Lexify revolutionizes legal education and practice through an innovative virtual courtroom simulation platform. By combining advanced AI technology with immersive 3D environments, we provide legal professionals, law students, and practitioners with a powerful training ground for developing and refining their courtroom skills.

### Why Choose Lexify?

- 🎯 **Practice Makes Perfect**: Experience real court scenarios in a risk-free environment
- 🤖 **AI-Powered Feedback**: Get instant, objective performance analysis
- 📚 **Comprehensive Learning**: Access an extensive database of legal precedents and case studies
- 🌐 **Learn Anywhere**: Practice and improve from any location with internet access

## Key Features

### Core Functionality

* **🤖 AI Agents**
  - Advanced AI lawyer for realistic argument simulation
  - Impartial AI judge ensuring fair evaluation
  - Dynamic response system based on legal precedents

* **💡 Consultant Agent**
  - Deep expertise in Constitution and IPC
  - Real-time legal insights and guidance
  - Personalized feedback system

* **📊 Live Score System**
  - Real-time performance metrics
  - Comprehensive feedback reports
  - Progress tracking dashboard

* **✅ Content Verifier**
  - Robust document authenticity verification
  - Evidence validation system
  - Automated legal citation checking

## System Requirements

### Minimum Specifications

```yaml
Operating System: Windows 10+, macOS 10.15+, or Linux (Ubuntu 20.04+)
Processor: Intel Core i5 or equivalent
Memory: 8GB RAM
Storage: 1GB available space
Internet: 10 Mbps+ broadband connection
Browser: Chrome 90+, Firefox 88+, Safari 14+
```

### Recommended Specifications

```yaml
Processor: Intel Core i7 or equivalent
Memory: 16GB RAM
Internet: 25 Mbps+ high-speed connection
```

## Installation

### 🖥️ Frontend Setup

```bash
# Clone repository
git clone https://github.com/suyash101101/Lexify.git
cd lexify/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 🛠️ Backend Setup

```bash
# Clone repository
git clone https://github.com/suyash101101/Lexify.git
cd lexify/backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start server
uvicorn main:app --reload
```

### 🐳 Docker Deployment

```bash
docker-compose up --build
```

### 🔐 Environment Variables

Create `.env` files in both frontend and backend directories:

```env
# Frontend (.env)
REACT_APP_API_URL=http://localhost:8000
REACT_APP_GEMINI_API_KEY=your_gemini_api_key
REACT_APP_ENVIRONMENT=development

# Backend (.env)
DATABASE_URL=postgresql://user:password@localhost:5432/lexify
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
```

## Architecture

### 🛠️ Tech Stack

#### Frontend
- React 18.0+
- Three.js
- Redux Toolkit
- TailwindCSS

#### Backend
- FastAPI
- PostgreSQL
- Redis

#### AI/ML
- Gemini
- LlamaIndex
- PhiData
- HuggingFace
  
### 📐 System Architecture

```mermaid
graph TD
    A[Frontend] -->|API Requests| B[Backend]
    B -->|Data Storage| C[Database]
    B -->|Caching| D[Redis]
    B -->|AI Processing| E[AI Agents]
    E -->|File Management| F[File Storage]
```

## Usage Guide

### 1️⃣ Getting Started
- Create your account
- Complete legal credentials
- Verify your profile

### 2️⃣ Case Setup
- Upload case materials
- Choose simulation type
- Configure AI participants

### 3️⃣ Simulation
- Enter virtual courtroom
- Present your case
- Interact with AI participants

### 4️⃣ Performance Review
- Review performance metrics
- Analyze AI feedback
- Download session reports

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Made with ❤️ by the Lexify Team

</div>
