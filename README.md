# AI Chatbot

## Project Description

This AI-powered chatbot allows users to engage in conversations, store chat history, and manage user authentication. It features a frontend built with Next.js and a backend using Django Rest Framework (DRF) with PostgreSQL as the database.

---

## ✅👩🏻‍💻 Accomplishments List

### ❗Mandatory Features (Completed)

#### Frontend (Next.js) – User Interface
- ✅ **Chat Interface** – Users can send messages and receive AI responses.
- ✅ **Conversation History** – Stored in the database and displayed on the UI.
- ✅ **Dark Mode & Responsive Design** – Implemented for a better user experience.

#### Backend (Django) – REST API + PostgreSQL
- ✅ **Chat Endpoint** – Sends user messages to the AI and returns responses.
- ✅ **Conversation History Storage (PostgreSQL)** –
  - Users, conversations, messages, and file uploads are stored in PostgreSQL.
  - Chat history is linked to individual users for personalized conversation tracking.
  - **Main tables:**
    - `api_conversation` – Tracks user conversations.
    - `api_message` – Stores user prompts and AI responses.
    - `auth_user` – Manages registered users.
    - `api_fileattachment` – Stores file and image uploads linked to conversations.

---

## 🔄 Optional Features (Bonus Points) – Implemented
- ✅ **Dark Mode & Responsive Design** – Extra effort put into styling and user experience.
- ✅ **User Profiles** – Implemented authentication with JWT.
- ✅ **Delete Conversation** – Added option to remove conversation history in both frontend & backend.
- ✅ **Better Session Management** – Handled JWT authentication securely with refresh tokens.
- ✅ **Multi-Language Support** – The model detects language automatically to offer multilingual responses.
- ✅❌ **File Upload Feature (90%)** – Implemented backend & frontend support, but the AI model used (DeepSeek V3) does not process files, only text. *(To support file processing, switching to OpenAI API would work, but it requires an API key.)*

### ❌ Optional Features (Not Implemented)
- ❌ **Personalized AI Settings for Users** – No custom AI settings per user.

---


## ⚙️ Project Setup and Technologies Used

- **Frontend:** Next.js (React), Tailwind CSS, JWT Authentication, Lucid UI, AutoPrefix, js-cookies
- **Backend:** Django, Django Rest Framework (DRF), PostgreSQL, JWT Authentication, CORS handling
- **AI Model:** DeepSeek V3 (via OpenRouter API)
- **Database:** PostgreSQL
- **Development Tools:** Git, Postman (for API testing), VS Code

---

## 🚀 Project Setup and Execution

### Backend Setup

Clone the repository and navigate to the backend folder:
```sh
git clone https://github.com/imanebelhaj/chatbot
cd chatbot
code .
cd chatbot_backend
```

Create and activate a virtual environment:
```sh
python -m venv venv
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate  # Windows
```

Install dependencies:
```sh
pip install -r ../requirements.txt
```

#### Set up the PostgreSQL database:
**Note:** Ensure you have the latest version of PostgreSQL installed.

Create your database:
```sql
CREATE DATABASE chatbotdb;
```

Configure database settings in `chatbot_backend/chatbot_backend/settings.py`:
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'yourdbname',
        'USER': 'yourusername',
        'PASSWORD': 'yourpassword',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

Apply migrations:
```sh
python manage.py makemigrations
python manage.py migrate
```

#### Create a `.env` file for API keys:
Generate your API key by visiting OpenRouter API keys page.
In the backend directory, create a `.env` file and add your OpenRouter API key:
```sh
KEY=your_api_key_here
```

Run the Django development server:
```sh
python manage.py runserver
```

The backend runs on `localhost:8000/api/`. Ensure you provide the JWT Bearer Token for all protected endpoints if testing with Postman.

#### API Endpoints:
```plaintext
path('chat/',
path('chat_history/<str:conversation_id>/',
path('login/',
path('register/',
path('logout/',
path('profile/',
path('conversation_delete/<str:conversation_id>/',
path('delete_profile/',
```

---

### Frontend Setup

Navigate to the frontend folder:
```sh
cd chatbot_frontend
```

Install dependencies:
```sh
npm install
```

Start the Next.js development server:
```sh
npm run dev
```

Open `localhost:3000/auth/login` in your browser to start.

❗If you change the port number 3000 make sure to allow in settings.py Cors policies allowed origins

#### Install VS Code extension for PostCSS (optional but recommended):
- Install **PostCSS Language Support** (it has a triangular logo).

---
