# Coincious: AI-Driven Adaptive Learning Platform for Neurodiverse Students

## Overview

Coincious is an AI-powered adaptive learning platform designed to help neurodiverse children learn Indian currency concepts and basic mathematics through an engaging, accessible, and personalized learning experience.

The platform combines gamified learning, Indian currency recognition, adaptive difficulty adjustment, voice-assisted interaction, and AI-driven personalization to improve financial literacy and mathematical understanding among children with Autism, ADHD, Dyslexia, and other cognitive differences.

---

## Problem Statement

Traditional methods of teaching Indian currency are often:

* Text-heavy
* Fast-paced
* Non-personalized
* Difficult for neurodiverse learners

Many learners struggle with:

* Currency recognition
* Number identification
* Basic arithmetic operations
* Real-life money handling
* Maintaining attention and engagement

Coincious addresses these challenges through adaptive learning and inclusive design principles.

---

## Features

### Authentication & User Management

* User Registration and Login
* Secure Password Reset using OTP
* User Profile Management
* Progress Tracking

### Currency Learning Module

* Learn Indian currency notes and coins
* Front and back view of currency
* Currency facts and information
* Interactive flashcard study mode

### Currency Identification Game

* Drag-and-drop currency recognition game
* Visual learning support
* Progressive mastery-based practice

### Mathematics Learning Modules

* Addition
* Subtraction
* Multiplication
* Division
* Word Problems

### Adaptive AI Learning

* Personalized difficulty prediction
* Dynamic question generation
* Infinite adaptive learning levels
* Learner behavior analysis

### Accessibility Features

* Text-to-Speech support
* Voice-assisted learning
* Speech-based interaction
* Neurodiverse-friendly UI design
* Reduced cognitive load interface

### Gamification

* Star-based scoring system
* Level progression
* Achievement tracking
* Unlockable modules

---

## AI Adaptive Learning Engine

The platform uses an LSTM (Long Short-Term Memory) neural network to personalize the learning experience.

### Input Features

The model analyzes:

* Time Spent
* Attempts Made
* Hints Used
* Stars Earned
* Performance Trend
* Learning Stability

### Difficulty Levels

The AI predicts one of the following difficulty levels:

| Level | Difficulty      |
| ----- | --------------- |
| 0     | easy-basic      |
| 1     | easy-moderate   |
| 2     | easy-high       |
| 3     | medium-basic    |
| 4     | medium-moderate |
| 5     | medium-high     |
| 6     | hard-basic      |
| 7     | hard-moderate   |
| 8     | hard-high       |

### Model Performance

* Model Type: LSTM Neural Network
* Framework: TensorFlow/Keras
* Accuracy: 87%
* Training Split: 70% Training / 30% Testing

---

## Technology Stack

### Frontend

* React 19
* Vite 7
* Tailwind CSS
* React Router DOM

### Backend

* Django
* Django REST Framework (DRF)
* Python

### Database

* MongoDB
* PyMongo

### AI & Machine Learning

* TensorFlow
* Keras
* NumPy
* Scikit-Learn
* Joblib

### Deployment

* Frontend: Vercel
* Backend: Render

---

## System Architecture

```text
React Frontend
       │
       ▼
Django REST APIs
       │
       ▼
MongoDB Database
       │
       ▼
AI Adaptive Engine (LSTM)
```

---




## Installation

### Clone Repository

```bash
git clone https://github.com/your-username/coincious.git

cd coincious
```

### Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

### Backend Setup

```bash
cd backend

pip install -r requirements.txt

python manage.py runserver
```

### Environment Variables

Create a `.env` file:

```env
MONGO_URI=your_mongodb_connection_string

EMAIL_HOST_USER=your_email

EMAIL_HOST_PASSWORD=your_password

SECRET_KEY=your_secret_key
```

---

## API Modules

### Authentication

```http
POST /api/signup/
POST /api/login/
POST /api/forgot-password/
GET  /api/profile/
```

### Progress Tracking

```http
POST /api/progress/save/
GET  /api/progress/load/
PUT  /api/progress/update/
```

### Currency Identification

```http
POST /api/identification/attempt/
GET  /api/stats/
GET  /api/history/
```

### Math Game

```http
GET  /api/math/question/
POST /api/math/attempt/save/
GET  /api/math/level-stars/
GET  /api/math/currencies/
```

---

## Future Enhancements

* JWT Authentication
* Teacher Dashboard
* Parent Dashboard
* Multilingual Support (Hindi, Marathi)
* Advanced Learning Analytics
* More Educational Modules
* Larger AI Training Dataset
* Improved Personalization Algorithms

---

## Research Impact

Coincious aims to:

* Improve financial literacy among neurodiverse learners
* Support independent money-handling skills
* Reduce cognitive overload
* Increase learner confidence
* Provide personalized educational experiences through AI

---

## Contributors

* Nausheen Gandhi
* Saloni Lad
* Janhvi Mahangade

### Guide

Prof. Prachi Dhanawat

---

## License

This project is developed as part of the Bachelor of Technology (Information Technology) Mini Project at Usha Mittal Institute of Technology, SNDT Women's University.
