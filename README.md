# 🎟️ Event Booking System

A production-ready, cloud-deployed event management platform that enables societies to create, publish, and manage events while allowing users to register and provide feedback.

The backend is built using **Node.js + Express** and deployed serverlessly on **AWS Lambda** with automated CI/CD. The system uses **Amazon RDS (MySQL)** for persistent storage and is exposed via **API Gateway** to serve the frontend.

🔗 **Live Frontend:** https://society-event-booking-system.vercel.app/

---

## 🚀 Key Highlights

- ⚡ Serverless backend deployed on AWS Lambda  
- 🔁 Automatic deployment via GitHub Actions on every push  
- 🔐 Secure JWT-based authentication  
- 🏢 Society and event lifecycle management  
- 🎟️ Event registration workflow  
- ⭐ Feedback collection system  
- 🌐 API Gateway integration for scalable access  
- 🗄️ Amazon RDS (MySQL) for managed database  
- 🧩 Frontend deployed on Vercel  

---

## 🧱 System Architecture


Frontend (Vercel)
│
▼
API Gateway (AWS)
│
▼
AWS Lambda (Node.js + Express)
│
▼
Amazon RDS (MySQL)


---

## 🛠️ Tech Stack

### Backend
- Node.js
- Express.js
- MySQL (mysql2)

### Cloud & DevOps
- AWS Lambda
- AWS API Gateway
- Amazon RDS
- GitHub Actions (CI/CD)
- Serverless deployment via YAML workflow

### Security & Validation
- JSON Web Tokens (JWT)
- bcrypt
- zod

### Frontend
- React (deployed on Vercel)

### Utilities
- dotenv
- cookie-parser
- cors
- nodemon

---

## 📁 Project Structure


Event-Booking-System/
│
├── src/
│ ├── config/ # Database configuration
│ ├── middlewares/ # Error handling middleware
│ ├── routers/ # API route handlers
│ ├── app.js # Express app setup
│ ├── index.js # Local server entry
│ └── lambda.js # AWS Lambda handler
│
├── .github/workflows/ # CI/CD pipeline (YAML)
├── .env.example
├── package.json
└── README.md
---

## 🔄 CI/CD Pipeline

This project includes automated deployment:

- ✅ Trigger: Every push to repository  
- ✅ Builds the Node.js application  
- ✅ Packages Lambda artifact  
- ✅ Deploys to AWS Lambda  
- ✅ API Gateway automatically serves latest version  

**Result:** Zero-manual deployment workflow.

---

## ⚙️ Environment Variables

Create a `.env` file:

```env
PORT=5000
CORS_ORIGIN=your_frontend_url

DB_HOST=your_rds_endpoint
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name

JWT_SECRET=your_secret_key
▶️ Local Development
1. Clone repository
git clone https://github.com/Gurkirat900/Event-Booking-System.git
cd Event-Booking-System
2. Install dependencies
npm install
3. Run locally
npm run dev

Server runs at: http://localhost:5000

📡 API Base Routes
/api/v1/users
/api/v1/society
/api/v1/event-draft
/api/v1/event
/api/v1/event-register
/api/v1/event-feedback
🎯 Use Cases

College society event management systems

University internal platforms

Scalable serverless backend reference

Full-stack portfolio demonstration

🔮 Future Enhancements

Role-Based Access Control (RBAC)

Payment gateway integration

Swagger/OpenAPI documentation

Unit & integration tests

Event analytics dashboard

👤 Author

Gurkirat Singh
