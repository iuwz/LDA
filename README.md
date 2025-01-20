# LDA
 Legal Document Analyzer (LDA) our graduation project 

Development Environment Setup for Legal Document Analyzer
Prerequisites:
Before setting up the environment, ensure you have the following installed on your system:

Python (v3.8 or above)
Node.js (v16 or above)
VS Code: Download VS Code
MongoDB: Install MongoDB locally or use MongoDB Atlas.

Step 2: Set Up the Backend Environment
1. Create a Virtual Environment:
Navigate to the backend directory: cd backend
Create a virtual environment: python -m venv env
Activate the virtual environment: 
Windows: .\env\Scripts\activate
macOS/Linux: source env/bin/activate

2. Install Dependencies
Install required Python packages: pip install -r requirements.txt
Download and install the spaCy model: python -m spacy download en_core_web_sm

3. Set Up Environment Variables
Create a .env file in the backend directory: touch .env

Step 3: Set Up the Frontend Environment
1. Navigate to the Frontend Directory
Go back to the root directory and navigate to the frontend folder: cd ../frontend
Install Node.js packages: npm install


Front-end setup
1- create frontend folder in the LDA project
2- cd frontend
3- npm init -y
4-npm install react react-dom react-router-dom
5- npm install -D vite
6- npm install -D tailwindcss postcss autoprefixer
7- npx tailwindcss init -p
8- open tailwind.config.js and put:

module.exports = {
  content: ['./index.html', './src/*/.{js,jsx,ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};

9- in frontend, npm create vite@latest
 9.1- choose . as project name, then ignore the files
 9.2- select React
 9.3- select typescript
 9.4- npm install
 9.5- npm run dev

10- go to index.css in src and import the following:
@tailwind base;
@tailwind components;
@tailwind utilities;


