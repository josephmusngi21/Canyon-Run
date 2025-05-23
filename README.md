# 🏞️ Canyon Run

**Canyon Run** is a modern React Native app for runners who want to track, manage, and visualize their running routes—complete with altitude and location data. Whether you're training for a marathon or exploring new trails, Canyon Run helps you map your journey.

---

## 🚀 Features

- **Add Runs:** Easily input start/end coordinates, altitude, and location for each run.
- **Track Progress:** View, edit, and manage your run history in one place.
- **Interactive Maps:** Visualize your routes and see your progress on a map.
- **Altitude Insights:** Analyze elevation changes for every run.

---

## 🗂️ Project Structure

```
Canyon-Run/
└── client/
    ├── App.js                  # Main entry point of the app
    ├── assets/                 # Static assets and data
    │   ├── csv/
    │   │   ├── 10_MetersCSV.csv
    │   │   └── jsonCanyon.json # JSON data for canyon routes
    │   └── convertJson.js
    ├── components/             # React components
    │   ├── api/
    │   │   └── timer.js        # Timer utility
    │   ├── authorization/
    │   │   └── authorization.js
    │   ├── pages/
    │   │   ├── Add/
    │   │   │   └── AddRun.jsx      # Add run page
    │   │   ├── Login/
    │   │   │   └── Login.jsx
    │   │   ├── Maps/
    │   │   │   ├── Altitude.jsx
    │   │   │   ├── canyon.json
    │   │   │   ├── example2.json
    │   │   │   └── Maps.jsx
    │   │   ├── Register/
    │   │   │   └── Register.jsx
    │   │   └── Tracker/
    │   │       └── Track.jsx       # Run tracker page
    ├── .expo/                  # Expo configuration files
    ├── package.json            # Project dependencies
    └── README.md               # Project documentation
```

- **App.js**: Main entry point of the app.
- **assets/**: Contains static files and sample data.
- **components/**: All React components, organized by feature.
- **.expo/**: Expo-specific configuration files.
- **package.json**: Lists project dependencies.
- **README.md**: Project documentation.


## 🛠️ Installation

1. **Clone the repository:**
    ```bash
    git clone https://github.com/josephmusngi21/Canyon-Run.git
    cd canyon-run/client
    ```
2. **Install dependencies:**
    ```bash
    npm install
    ```
3. **Start the development server:**
    ```bash
    npx expo start
    ```
4. **Run the app:**  
    Use the [Expo Go](https://expo.dev/client) app or an emulator to preview Canyon Run on your device.

---

## 📱 Usage

- **Add a Run:**  
  Go to the **Add Run** page, enter your route details, and save to track your progress.
- **Track Runs:**  
  Browse your run history and view detailed stats on the **Track** page.
- **View Maps:**  
  Head to the **Maps** page to see your routes and altitude profiles.

---

## 📊 Data

Canyon Run uses sample JSON data from `assets/csv/jsonCanyon.json` to provide example routes and altitude information.

---

## 🤝 Contributing

Contributions are welcome! To get started:

1. **Fork** the repository.
2. **Create a new branch:**  
    `git checkout -b feature/your-feature`
3. **Commit your changes:**  
    `git commit -m "Add your feature"`
4. **Push to your branch:**  
    `git push origin feature/your-feature`
5. **Open a pull request** and describe your changes.

---

## 🙏 Acknowledgments

- [React Native](https://reactnative.dev/)
- [Expo](https://expo.dev/)

---
