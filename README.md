 Shamba-Smart — Smart Crop Monitoring Dashboard

Shamba-Smart is a responsive smart-farming web application that simulates real-time environmental conditions to monitor crop health, irrigation needs, and environmental stress. The platform demonstrates how digital agriculture systems can model farm conditions and support decision-making before integrating physical sensors or external data sources.

The application allows users to manage crops, define environmental requirements, monitor simulated soil moisture and temperature, and automate irrigation decisions through a live dashboard. Shamba-Smart is designed as a functional prototype of a smart agriculture monitoring platform, ready for future integration with IoT sensors or agricultural APIs.



OVERVIEW

Shamba-Smart provides a modern agricultural dashboard where users can add crops, configure environmental thresholds, and observe how environmental changes affect crop health. The system simulates real-time sensor data such as soil moisture, temperature, and weather conditions, and translates these environmental variables into crop health scores, alerts, and smart insights.

The dashboard continuously updates environmental values and recalculates crop health, creating a live monitoring experience similar to real smart-farming systems. Irrigation logic is included through both manual watering controls and automatic watering triggers based on crop-specific moisture thresholds.

The platform is fully responsive and usable across desktop, tablet, and mobile devices.


FEATURES

Shamba-Smart includes crop management, environmental monitoring, automation logic, and responsive dashboard visualization.

Users can add crops with growth stages, assign recommended environmental profiles, or customize moisture and temperature ranges manually. Crops can be set as the current monitored crop, edited, or removed. Preset agronomic profiles are available for common crops such as maize, tomato, beans, and sukuma wiki, while unknown crops automatically receive a generic fallback profile that can be customized.

The dashboard displays simulated real-time soil moisture, temperature, and weather conditions. Crop health is computed dynamically based on how current environmental conditions compare to the crop’s ideal ranges. Alerts are generated when conditions fall outside safe thresholds, and a smart insights panel explains environmental stress factors affecting the crop.

Irrigation support includes a manual “Water Now” control and an automatic irrigation mode that triggers watering when soil moisture drops below the crop’s target minimum. Watering improves crop health and resets irrigation timing indicators.

The interface adapts to different screen sizes through responsive layout rules, stacked controls, and mobile-friendly interaction patterns.



FEATURES
Shamba-Smart includes crop management, environmental monitoring, automation logic, and responsive dashboard visualization.

Users can add crops with growth stages, assign recommended environmental profiles, or customize moisture and temperature ranges manually. Crops can be set as the current monitored crop, edited, or removed. Preset agronomic profiles are available for common crops such as maize, tomato, beans, and sukuma wiki, while unknown crops automatically receive a generic fallback profile that can be customized.

The dashboard displays simulated real-time soil moisture, temperature, and weather conditions. Crop health is computed dynamically based on how current environmental conditions compare to the crop’s ideal ranges. Alerts are generated when conditions fall outside safe thresholds, and a smart insights panel explains environmental stress factors affecting the crop.

Irrigation support includes a manual “Water Now” control and an automatic irrigation mode that triggers watering when soil moisture drops below the crop’s target minimum. Watering improves crop health and resets irrigation timing indicators.

The interface adapts to different screen sizes through responsive layout rules, stacked controls, and mobile-friendly interaction patterns.


SMART FARMING MODELS

Shamba-Smart models the relationship between environmental conditions and crop health. Soil moisture represents water availability, temperature represents climate stress, and weather provides environmental context. Each crop defines acceptable ranges for moisture and temperature. When conditions fall outside these ranges, crop health decreases; when conditions are optimal, health improves.

Alerts indicate when environmental stress is present, and smart insights describe the cause of the stress, such as low moisture or excessive temperature. This approach mirrors how real farmers monitor crops and make irrigation decisions based on environmental observations.


REAL-TIME SIMULATION

The dashboard uses a time-based simulation loop to emulate live sensor updates. Soil moisture, temperature, and weather values change continuously over time, and crop health recalculates automatically in response to these changes. This creates a real-time monitoring experience without requiring physical sensors.

The simulation architecture mirrors real IoT dashboards, allowing the data source to be replaced later by external APIs or hardware sensors without changing the UI or crop logic.


FUTURE INTERGRATION PATH

Shamba-Smart is designed to support real environmental data sources. The current simulation layer can be replaced with data from weather services, soil sensors, or agricultural IoT devices. Because the dashboard already expects environmental inputs such as moisture and temperature, integrating external data would require only replacing the simulation source with API or sensor data streams.

This design makes the project suitable as a prototype for real smart-farming platforms.


TECH STACK

The application is built using React with functional components and hooks, React Router for navigation, and custom responsive CSS styling. State-driven architecture is used to manage crops, environmental conditions, and dashboard behavior.


RESPONSIVENESS

The interface adapts across desktop, tablet, and mobile devices. Dashboard cards collapse into single-column layouts on small screens, crop editor controls stack vertically, navigation wraps cleanly, and action buttons expand to full width for mobile usability. The responsive design ensures accessibility for farmers using phones or tablets in field environments.

Architecture

The application follows a clean state architecture where the main application component manages crop data and passes it to the Crops management page and Dashboard monitoring page. Environmental simulation feeds the crop health model, which generates alerts and insights that drive the dashboard interface.

Each crop maintains its own environmental profile, health score, irrigation status, and timing data, allowing the dashboard to dynamically respond when the user switches between crops.

Crop Model

Each crop contains its name, growth stage, health score, irrigation status, last-watered timing, and environmental profile consisting of ideal moisture and temperature ranges. A profile label indicates whether the crop uses a recommended preset or a custom configuration.

This structure allows crops to behave differently under the same environmental conditions, reflecting real agronomic variability.


Project Structure

The project is organized into reusable components, page views, and style modules. Components include navigation, statistic cards, and footer elements. Pages include the dashboard and crop management interface. Styles are separated into dashboard, crops, navigation, and global style files for maintainability and scalability.


Setup

Install dependencies and start the development server:

npm install
npm run dev

The application will run locally in the browser.


Use Cases

Shamba-Smart can serve as a smart agriculture prototype, farm monitoring concept, IoT dashboard simulation, agritech UX demonstration, or crop decision-support model. It is suitable for showcasing real-time dashboard design, environmental modeling, and automation logic in agricultural technology contexts.


Learning Outcomes

The project demonstrates real-time state updates, environmental simulation, crop health modeling, responsive layout engineering, domain-driven data design, automation logic implementation, and dashboard-style UI architecture in React.


Vision

Shamba-Smart explores how digital platforms can help farmers monitor crops, anticipate environmental stress, and make irrigation decisions through environmental intelligence. The system illustrates how simulated sensor data can support smart-farming interfaces and evolve into real sensor-integrated platforms.

Author:Macharia

License:MIT License
