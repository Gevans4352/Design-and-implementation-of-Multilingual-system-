# FluentRoot

FluentRoot is a multilingual AI-powered chatbot that enables users to communicate and learn across five languages: English, French, Yoruba, Igbo, and Hausa. Built as a final-year capstone project, it focuses on bridging the gap in natural language processing support for Nigerian indigenous languages.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Language Support](#language-support)
- [Acknowledgements](#acknowledgements)

---

## Overview

FluentRoot addresses a significant gap in NLP tooling: the underrepresentation of Nigerian languages in conversational AI. By combining modern AI APIs with a clean, accessible interface, FluentRoot allows users to hold conversations and receive responses in their preferred language, including Yoruba, Igbo, and Hausa alongside English and French.

---

## Features

- Multilingual chat interface supporting English, French, Yoruba, Igbo, and Hausa
- AI-powered responses using OpenAI and Google Gemini APIs
- Real-time language switching within conversations
- User authentication and session management via Supabase
- Clean, responsive UI built with React and TypeScript
- FastAPI backend for efficient request handling

---

## Tech Stack

**Frontend**
- React
- TypeScript

**Backend**
- FastAPI (Python)

**Database and Auth**
- Supabase (PostgreSQL + authentication)

**AI APIs**
- OpenAI API
- Google Gemini API

---

## Getting Started

### Prerequisites

- Node.js (v18 or above)
- Python 3.10 or above
- A Supabase project
- OpenAI API key
- Google Gemini API key

### Installation

1. Clone the repository:

```bash
git clone https://github.com/your-username/fluentroot.git
cd fluentroot
```

2. Install frontend dependencies:

```bash
cd frontend
npm install
```

3. Install backend dependencies:

```bash
cd backend
pip install -r requirements.txt
```

4. Set up your environment variables (see below).

5. Start the backend:

```bash
uvicorn main:app --reload
```

6. Start the frontend:

```bash
npm run dev
```

---

## 

---

## Language Support

| Language | Code |
|----------|------|
| English  | en   |
| French   | fr   |
| Yoruba   | yo   |
| Igbo     | ig   |
| Hausa    | ha   |

Support for Nigerian languages is an intentional design priority, addressing the limited availability of conversational AI tools for these language communities.

---

## Acknowledgements

This project was developed as a final-year capstone project at Babcock University, Department of Software Engineering. Special thanks to the project supervisors and reviewers who provided guidance throughout the research and development process.

---

## License

This project is licensed under the MIT License.
