# Past Service — Defunct Fast-Food Archive

**Past Service** is a full-stack web application that documents fast-food restaurant chains that have closed, merged, or stopped operating under their original brand names.

The project combines a professional multi-page frontend with a Node.js and Express backend and a MongoDB database. Restaurant records can be searched, filtered, created, edited, and deleted through the website, and every database change can be inspected in MongoDB Compass.

## Project purpose

The goal of this project is to demonstrate how a modern web application can organize and present historical information stored as MongoDB documents.

Each restaurant record contains information such as:

- Restaurant name
- Founding and closing years
- Headquarters and country
- Peak number of locations
- Signature menu items
- Closure reason
- Historical summary

## Technology stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | HTML5 | Page structure and semantic content |
| Frontend | CSS3 | Responsive layout, visual design, and animations |
| Frontend | JavaScript | Interactivity and Fetch API requests |
| Backend | Node.js | JavaScript server runtime |
| Backend | Express | Web server and REST API routing |
| Database | MongoDB | Document-based restaurant storage |
| Database tool | MongoDB Compass | Visual database management and inspection |
| Configuration | dotenv | Environment-variable management |

## Application architecture

```text
Web browser
   ↓
HTML, CSS, and JavaScript frontend
   ↓ Fetch API requests
Node.js and Express REST API
   ↓ MongoDB queries
MongoDB restaurants collection
```

The Express server also serves the static frontend files from the `public` directory.

## Main features

- Professional multi-page website
- Responsive desktop, tablet, and mobile layouts
- Live MongoDB connection indicator
- Restaurant photograph gallery
- Photo lightbox with previous and next controls
- Dashboard with database summary cards
- MongoDB aggregation results grouped by closure decade
- Search by restaurant name, city, history, or menu item
- Filter by closure decade
- Sort by name, founding year, closing year, or peak locations
- Create, read, update, and delete operations
- Modal form for adding and editing restaurant records
- Confirmation before deleting a document
- Input validation and duplicate-name protection
- Toast notifications and loading states
- Mobile navigation menu
- Scroll progress and back-to-top controls
- Accessible labels, keyboard focus styles, and semantic HTML

## Website pages

| Page | File | Purpose |
|---|---|---|
| Home | `public/index.html` | Introduces the project and links to the main sections |
| Overview | `public/overview.html` | Displays dashboard statistics and aggregation results |
| Photos | `public/photos.html` | Displays historical restaurant photographs and credits |
| Archive | `public/archive.html` | Displays and manages MongoDB restaurant documents |

When the server is running locally, the pages are available at:

```text
http://localhost:3000/
http://localhost:3000/overview.html
http://localhost:3000/photos.html
http://localhost:3000/archive.html
```

## MongoDB data model

Each restaurant is stored as a MongoDB document using a structure similar to the following:

```json
{
  "name": "Burger Chef",
  "foundedYear": 1954,
  "closedYear": 1996,
  "headquarters": "Indianapolis, Indiana",
  "country": "United States",
  "peakLocations": 1050,
  "signatureItems": [
    "Big Shef",
    "Super Shef",
    "Funmeal"
  ],
  "closureReason": "The chain was sold and many locations were converted to other brands.",
  "history": "Burger Chef grew into a major American hamburger chain.",
  "sourceNote": "Historical figures should be verified against reliable sources.",
  "createdAt": "MongoDB Date",
  "updatedAt": "MongoDB Date"
}
```

The local database configuration is:

```text
Database: defunct_fast_food
Collection: restaurants
```

## Project structure

```text
defunct-fast-food-mongodb/
├── config/
│   └── db.js
├── controllers/
│   └── restaurantsController.js
├── data/
│   └── restaurants.json
├── public/
│   ├── images/
│   │   └── archive/
│   ├── index.html
│   ├── overview.html
│   ├── photos.html
│   ├── archive.html
│   ├── styles.css
│   ├── site.js
│   ├── home.js
│   ├── overview.js
│   ├── photos.js
│   ├── archive.js
│   ├── favicon.svg
│   └── manifest.webmanifest
├── routes/
│   └── restaurants.js
├── .env
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── seed.js
├── server.js
└── README.md
```

## Local installation on Windows

### 1. Install the required software

Install the following:

- Node.js 20 or newer
- MongoDB Community Server
- MongoDB Compass

MongoDB Compass is the visual interface used to inspect the database, but MongoDB Community Server must be running for the local connection to work.

### 2. Open the correct project folder

Open PowerShell in the folder that contains `package.json` and `server.js`.

Example:

```powershell
cd "C:\Users\tyler\OneDrive\Desktop\defunct-fast-food-mongodb\defunct-fast-food-mongodb"
```

Confirm the location:

```powershell
dir
```

### 3. Install the Node.js packages

```powershell
npm.cmd install
```

`npm.cmd` can be used when PowerShell blocks the `npm.ps1` script because of the Windows execution policy.

### 4. Create the environment file

Copy `.env.example` and name the copy `.env`:

```powershell
Copy-Item .env.example .env
```

For a local MongoDB database, the file should contain:

```env
MONGODB_URI=mongodb://127.0.0.1:27017
DB_NAME=defunct_fast_food
PORT=3000
```

Do not commit `.env` to a public repository because production connection strings can contain private credentials.

### 5. Create the database with MongoDB Compass

1. Open MongoDB Compass.
2. Connect using:

```text
mongodb://127.0.0.1:27017
```

3. Create a database named:

```text
defunct_fast_food
```

4. Create its first collection named:

```text
restaurants
```

### 6. Add sample records

Choose one of the following approaches.

#### Option A: Run the seed script

```powershell
npm.cmd run seed
```

#### Option B: Import through MongoDB Compass

Import this file into the `restaurants` collection:

```text
data/restaurants.json
```

Do not use both options unless duplicate records have been removed first.

### 7. Start the application

```powershell
npm.cmd start
```

Expected output:

```text
Connected to MongoDB database: defunct_fast_food
Server running at http://localhost:3000
```

Open the website at:

```text
http://localhost:3000
```

Keep the PowerShell window open while using the application. Press `Ctrl+C` to stop the server.

## Available npm commands

| Command | Purpose |
|---|---|
| `npm.cmd start` | Starts the Express server |
| `npm.cmd run dev` | Starts Node.js in watch mode |
| `npm.cmd run seed` | Inserts the sample restaurant records |
| `npm.cmd run check` | Checks the JavaScript files for syntax errors |

## REST API routes

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/health` | Confirms that the server is running |
| `GET` | `/api/restaurants` | Returns restaurant documents |
| `GET` | `/api/restaurants/:id` | Returns one restaurant document |
| `POST` | `/api/restaurants` | Creates a restaurant document |
| `PATCH` | `/api/restaurants/:id` | Updates selected fields |
| `DELETE` | `/api/restaurants/:id` | Deletes a restaurant document |
| `GET` | `/api/restaurants/stats/summary` | Returns aggregation statistics |

## Query examples

Search for a restaurant, location, or menu item:

```text
GET /api/restaurants?search=burger
```

Show restaurants that closed during the 1980s:

```text
GET /api/restaurants?decade=1980
```

Sort by largest peak location count:

```text
GET /api/restaurants?sort=peakLocations&order=desc
```

Combine multiple filters:

```text
GET /api/restaurants?search=chicken&decade=1980&sort=name&order=asc
```

## CRUD operations

CRUD represents the four main database operations demonstrated by the project:

| Operation | Website action | MongoDB result |
|---|---|---|
| Create | Submit the Add Restaurant form | Inserts a document |
| Read | Open or filter the archive | Retrieves documents |
| Update | Select Edit and save changes | Updates a document |
| Delete | Confirm a restaurant deletion | Removes a document |

After making a change through the website, refresh the collection in MongoDB Compass to verify the result.

## Dashboard and aggregation

The Overview page retrieves live summary data from:

```text
/api/restaurants/stats/summary
```

The backend uses a MongoDB aggregation pipeline to calculate information such as:

- Total number of restaurant documents
- Average restaurant lifespan
- Latest closure decade
- Number of closures grouped by decade
- Largest chain based on peak location count

The displayed values update when the database records change.

## How the website was developed

The project was built in several stages:

1. **Database planning** — Defined the fields required for each historical restaurant document.
2. **MongoDB setup** — Created the `defunct_fast_food` database and `restaurants` collection.
3. **Backend development** — Built the Express server, database connection, controllers, API routes, validation, and error handling.
4. **CRUD implementation** — Added endpoints for creating, reading, updating, and deleting documents.
5. **Frontend development** — Built the website using HTML, CSS, and JavaScript and connected it to the API with `fetch()`.
6. **Dashboard development** — Added MongoDB aggregation statistics and charts.
7. **Multi-page organization** — Separated the homepage, Overview, Photos, and Archive into dedicated pages.
8. **Visual design** — Added responsive layouts, dark green and gold branding, historical photographs, cards, modals, animations, and navigation.
9. **Testing and troubleshooting** — Tested API requests, form validation, filtering, database updates, browser caching, PowerShell commands, and MongoDB Compass synchronization.

## Problems solved during development

### PowerShell blocked npm

PowerShell initially blocked `npm.ps1` because script execution was disabled. The project was started successfully by using:

```powershell
npm.cmd install
npm.cmd start
```

### Commands were run from the wrong folder

The correct folder is the one containing `package.json`, `server.js`, `.env`, and `public`. Running npm from `C:\Windows\System32` or from the outer extracted folder will not start the project correctly.

### Updated files did not immediately appear

The browser sometimes displayed an older cached interface after frontend files were replaced. The solution was to restart the server and perform a hard refresh:

```text
Ctrl + F5
```

### Frontend and database synchronization

The frontend, Express API, and MongoDB database had to use matching field names and the same database connection. Successful website changes were verified by refreshing the collection in MongoDB Compass.

## Testing checklist

Before presenting or submitting the project, confirm that:

- MongoDB Community Server is running
- MongoDB Compass can connect
- The Express server starts without errors
- The homepage loads
- All navigation links work
- Dashboard statistics load
- Restaurant photographs display
- Search, filters, and sorting work
- A restaurant can be created
- A restaurant can be edited
- A restaurant can be deleted
- Database changes appear in MongoDB Compass
- The layout works on a narrow browser window
- No private connection strings are committed

## Suggested demonstration

1. Introduce Past Service and explain its purpose.
2. Show the `restaurants` collection in MongoDB Compass.
3. Open the website homepage.
4. Show the Overview dashboard and aggregation chart.
5. Browse the historical Photos page.
6. Search and filter the Archive page.
7. Add a demonstration restaurant.
8. Refresh Compass and show the new document.
9. Edit the record and verify the update.
10. Delete the demonstration record.

## Possible public deployment

The current application uses a local MongoDB connection. A public deployment would require:

1. Moving the database to MongoDB Atlas.
2. Deploying the Node.js and Express project to a compatible web host.
3. Adding the Atlas connection string as a protected environment variable.
4. Pointing a domain or subdomain to the deployed application.

The application should never use `mongodb://127.0.0.1:27017` after being deployed to an external server because that address refers to the server itself, not the MongoDB database on the developer's computer.

## Historical information and image credits

The restaurant records are intended for a software demonstration. Historical sources may disagree about founding dates, closing dates, peak location counts, successor brands, and the final independently operated location.

Before using the project as a formal historical source:

- Verify restaurant facts with reliable references.
- Preserve image attribution and licensing information.
- Do not present generated illustrations as authentic historical photographs.
- Clearly distinguish estimated information from confirmed information.

## License

The application source code is provided under the MIT License unless otherwise stated. Historical photographs and other media may have separate licenses and attribution requirements.
