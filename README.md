#  Mangrove Monitoring System

## Prerequisites (Install these first)

### 1. **Node.js** (for frontend)
- Download from: https://nodejs.org/
- Install the LTS version (recommended)
- Verify installation: Open terminal and run `node --version`

### 2. **PHP** (for backend)
- Download from: https://www.php.net/downloads
- OR use XAMPP (includes PHP + MySQL): https://www.apachefriends.org/
- If using XAMPP, it will also install MySQL
- Verify installation: Open terminal and run `php --version`

### 3. **MySQL** (for database)
- If using XAMPP, it's included
- Otherwise download from: https://dev.mysql.com/downloads/mysql/
- Verify installation: Open terminal and run `mysql --version`

### 4. **Composer** (for PHP dependencies)
- Download from: https://getcomposer.org/
- Verify installation: Open terminal and run `composer --version`

---

## Step-by-Step Setup

### **Step 1: Transfer Files**
1. Copy the entire `LeoWorks` folder to your new PC/laptop
2. Place it in a location like `C:\xampp\htdocs\LeoWorks` (if using XAMPP) or any folder you prefer

### **Step 2: Install Node.js Dependencies**
1. Open terminal/command prompt
2. Navigate to the project folder:
   ```bash
   cd C:\xampp\htdocs\LeoWorks
   ```
3. Install all frontend dependencies:
   ```bash
   npm install
   ```
   (This will install all the libraries including React, Leaflet, leaflet.heat, etc.)

### **Step 3: Install PHP Dependencies**
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install PHP dependencies:
   ```bash
   composer install
   ```

### **Step 4: Set Up Database**
1. Open MySQL (via phpMyAdmin if using XAMPP, or command line)
2. Create a new database:
   ```sql
   CREATE DATABASE leoworks;
   ```
3. Import the database schema:
   - Find the SQL file in `backend/database/schema.sql`
   - Import it using phpMyAdmin or command line:
     ```bash
     mysql -u root -p leoworks < backend/database/schema.sql
     ```

### **Step 5: Configure Database Connection**
1. Open `backend/src/config.php`
2. Update the database credentials:
   ```php
   return [
       'host' => 'localhost',
       'dbname' => 'leoworks',
       'username' => 'root',
       'password' => '', // Your MySQL password
   ];
   ```

### **Step 6: Run the Application**
1. Go back to the project root:
   ```bash
   cd C:\xampp\htdocs\LeoWorks
   ```
2. Run the development server:
   ```bash
   npm run dev
   ```
   This will start both:
   - PHP backend on http://127.0.0.1:8787
   - Vite frontend (will open automatically in browser)

---

## Alternative: Run Separately

If the combined command doesn't work, run them separately:

### Terminal 1 (Backend):
```bash
cd C:\xampp\htdocs\LeoWorks\backend
php -S 127.0.0.1:8787 -t public
```

### Terminal 2 (Frontend):
```bash
cd C:\xampp\htdocs\LeoWorks
npm run dev:vite
```

---

## Troubleshooting

**If npm install fails:**
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` folder and try again

**If PHP doesn't work:**
- Make sure PHP is in your system PATH
- Try using full path to PHP executable

**If database connection fails:**
- Check MySQL is running
- Verify credentials in `backend/src/config.php`
- Make sure the database exists

---

## Features

- **Dashboard Overview**: Real-time monitoring statistics and notifications
- **Mapping Areas**: Interactive Leaflet map with heatmap visualization for mangrove health
- **Monitoring Records**: Track and manage planting site monitoring data
- **Analytics Dashboard**: Charts and analytics for survival rates and species distribution
- **User Management**: Admin and worker role-based access control

---

## Technologies Used

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: PHP, MySQL
- **Maps**: Leaflet, React Leaflet, Leaflet.heat (for heatmap visualization)
- **UI Components**: Radix UI, Lucide Icons
- **Charts**: Recharts 
