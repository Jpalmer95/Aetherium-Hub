Aetherium Hub, by Jonathan Korstad
 - Aetherium Hub contains Aetherium Studio, plus future expansions and tools for generating and precise control over next gen games, media, immersive experiences, and more.

Project Concept: "Aetherium Studio"


  Aetherium Studio is not a new game engine, but a unified development environment and asset pipeline manager. It acts as a
  central hub that connects to and orchestrates a suite of best-in-class, open-source tools and AI services. The core philosophy
  is to automate the tedious aspects of game asset creation while empowering developers with powerful, editable results.

  ---

  Core Architecture

  The application will be built on a client-server model, allowing for flexibility and heavy-lifting to be done on a powerful
  machine or in the cloud.


   1. The Hub (Frontend): A web-based application (likely built with React or Vue and packaged with Electron for a native desktop
      feel).
       * Dashboard: Main project view, showing recent assets, tasks, and project status.
       * Asset Library: A unified browser for all generated assets (3D models, textures, audio, scenes). It will feature rich
         previews (a Three.js viewer for .glb/.gltf files, audio players for SFX/music).
       * Generator Interfaces: Dedicated UI sections for each creation task:
           * 3D Asset Prompting: Text/image input that sends requests to 3D generation APIs.
           * Audio Prompting: Text input for generating music and sound effects.
           * Environment Prompting: Text/parameter input for landscape generation.
       * Workflow Manager: A node-based or step-by-step UI to chain operations together (e.g., Prompt Mesh -> Auto-Rig -> Apply
         Animation -> Export to Godot). This manager will also support integration with ComfyUI workflows, allowing users to
         incorporate complex image and video processing pipelines. An AI-powered "Workflow Building Agent" will assist users by
         suggesting nodes, translating natural language to workflow steps, and helping configure parameters.


   2. The Core (Backend): A Python (FastAPI/Flask) server that acts as the brains of the operation.
       * API Gateway: Manages all external API calls to Hugging Face Spaces, Suno, etc., securely storing API keys. This gateway
         will also be enhanced to serve as an "MCP (Multi-Creator Protocol) Server," exposing a secure API (e.g., REST/GraphQL
         with API key/OAuth2 authentication) for external agents or applications to submit jobs and manage assets. This enables
         broader integration and utilization of Aetherium's capabilities.
       * Job Queue: Manages long-running tasks like 3D rendering, rigging, ComfyUI pipeline execution, and scene generation. This
         is crucial so the UI remains responsive.
       * File & Database Management:
           * Metadata: Stores project data, asset metadata, version history, and user settings in a relational database
             (PostgreSQL recommended, SQLite for local/desktop use).
           * Binary Assets: Manages large binary files (meshes, textures, audio, video, etc.) through a structured local file
             system (e.g., `PROJECT_ROOT/aetherium_assets/`) and/or cloud storage solutions (e.g., AWS S3, Google Cloud
             Storage) for scalability and collaboration. This includes basic versioning for assets.
       * The "Agent" Controller: Dispatches tasks to specialized "Worker" scripts based on the job type.


   3. The Agents & Workers (Automation Layer): These are not a single AI, but a collection of specialized, headless scripts that
      Aetherium Core calls upon. This layer is designed to be extensible for new tools and modalities.
       * Blender Worker (`bpy`): The primary workhorse for 3D tasks (importing, cleaning, rigging, animation, exporting).
       * ComfyUI Worker: Executes ComfyUI workflows (JSON-defined graphs) by programmatically running a ComfyUI instance or
         calling its API, managing inputs and outputs.
       * Landscaping Worker: Generates terrain components (heightmaps, splat maps) using AI models, which can then be used by
         Blender or game engines.
       * Engine-Specific Workers: Scripts for direct interaction with game engine project files (Godot, Unity, etc.).
       * Future Workers: This layer can be expanded with workers for video processing (e.g., using `ffmpeg`, AI video models),
         advanced audio manipulation, text generation, and more.

  ---

  Proposed Workflows

  Workflow 1: Creating a Game-Ready Character


   1. Prompting (Hub): User types "A sci-fi soldier in powered armor, cyberpunk style" into the 3D Asset Generator.
   2. Generation (Core -> API): The Core backend sends a formatted request to the TripoSR or TRELLIS Hugging Face Space API.
   3. Ingestion (Core -> Asset Library): The raw 3D mesh (.obj or .glb) is returned. The Core saves it to the project's _raw_assets
      folder and adds it to the Asset Library with a "Needs Rigging" tag. The user can preview it in the Hub's 3D viewer.
   4. Rigging (Hub -> Core -> Blender Worker): User selects the asset and clicks "Auto-Rig & Animate."
       * The Core queues a job for the Blender Worker.
       * The worker launches a headless Blender instance, imports the mesh, and runs a script that could use a tool similar to
         Rigify or an AI-powered placement predictor to create a skeleton.
       * The script then binds the mesh to the skeleton (automatic weights).
   5. Animation (Core -> Blender Worker): The script could then be instructed to fetch a standard "T-Pose" and "Idle Animation"
      from a local library or an external service.
   6. Export (Blender Worker -> Asset Library): The Blender worker exports the final rigged and animated character as
      soldier_v1.glb into the main asset folder. The Hub UI updates, showing the asset as "Ready."
   7. Integration: The user can now drag this asset from the Hub directly into their Godot/Unity editor, or the Hub can have a
      button "Send to Godot" which copies the file to the correct project subfolder.

  Workflow 2: Generating an Environment


   1. Prompting (Hub): User goes to the Environment Generator and types "A volcanic wasteland with jagged black rocks and rivers of
      lava." They can set parameters like size (e.g., 2km x 2km).
   2. Map Generation (Core -> AI Worker): The Core dispatches a job to a worker that uses a diffusion model to generate a 16-bit
      heightmap PNG for the terrain shape and a texture mask for lava rivers.
   3. Scene Construction (Core -> Blender/Godot Worker):
       * Another worker takes these images. It opens a Blender template scene with a pre-configured Geometry Nodes setup.
       * It applies the heightmap to a plane to create the landscape mesh and uses the lava mask to apply an emissive lava material
         in the specified areas.
       * It could also scatter pre-made "jagged black rock" assets (which could themselves be AI-generated) across the terrain.
   4. Export & Tweak (Worker -> Asset Library): The worker exports the entire scene as volcanic_level_v1.glb. The user can import
      this into their engine, or for maximum editability, the worker can save a .blend file that the user can open to manually
      tweak the Geometry Node parameters.

  ---

  Proposed Technology Stack


  | Category              | Technology
    | Purpose                                                              |
  | --------------------- |
  ------------------------------------------------------------------------------------------------------ |
  -------------------------------------------------------------------- |
  | Frontend/Hub      | React/Vue.js + Electron                                                                        | User
  Interface, Desktop Application Shell                            |
  |                       | Three.js                                                                                           |
  In-app 3D asset previews                                             |
  | Backend/Core      | Python with FastAPI or Flask                                                               | API server,
  job management, business logic                           |
  |                       | Celery & Redis                                                                                 |
  Asynchronous task queue for handling long jobs                       |
  | 3D Generation     | Hugging Face Spaces API (TripoSR, TRELLIS, etc.)                                                   |
  Text/Image-to-3D Mesh Generation                                     |
  | Audio Generation  | Suno API, AudioCraft (Hugging Face)                                                            | Music
  and Sound Effect Generation                                    |
  | Image/Video       | ComfyUI                                                                                        |
  Flexible image and video processing via node-based workflows     |
  | 3D Manipulation   | Blender (headless) with Python (`bpy`)                                                         | The
  primary tool for rigging, animation, and procedural modeling     |
  | Game Engines      | Godot, Unity, Unreal Engine, Blender                                                     | Final targets
  for the generated assets                               |
  | Database          | PostgreSQL (primary), SQLite (local option)                                                    | Storing
  project metadata, asset info, user settings                  |
  | Asset Storage     | Local File System, AWS S3 (or other cloud providers)                                           | Storing
  large binary assets (models, textures, audio, video)       |
  | AI Assistance     | LLM Integration (e.g., OpenAI API, Hugging Face Models)                                        | Powering
  Workflow Building Agent, natural language interactions       |



Aetherium Philosophy:

Our goal is to reduce the burden of creating amazing entertainment, media, games. and immersive next generation entertainment.

---
## Current Implemented Features (MVP - Holodeck Focus)

This initial phase focuses on setting up the core application and a "Holodeck" viewer:

*   **Asset Management:**
    *   Upload 3D models (.glb, .gltf) and audio files (.mp3, .wav).
    *   View a library of uploaded assets.
    *   Delete assets.
*   **Holodeck Viewer:**
    *   A 3D canvas (using Three.js) where 3D models can be loaded and viewed.
    *   Place, rotate, and scale objects within the 3D scene. Transforms are saved.
    *   Basic camera controls (orbit, pan, zoom).
*   **Audio Integration:**
    *   Preview individual audio assets from the library.
    *   An "Audio Mixer" panel to play multiple audio tracks concurrently with individual volume controls.

---
## Getting Started (Development)

The application consists of a React frontend and a Python FastAPI backend.

### Backend Setup

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```
2.  **Create a virtual environment (recommended):**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```
3.  **Install dependencies:**
    The `requirements.txt` file lists all necessary Python packages.
    ```bash
    pip install -r requirements.txt
    ```
    *Note: If you encounter issues with `pip install` via automated tools, ensure you are in the correct directory and the virtual environment is active. Manual installation may be required in some sandboxed environments.*

4.  **Run the FastAPI server:**
    ```bash
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
    ```
    The backend server will typically be available at `http://localhost:8000`. It includes a `/health` endpoint for status checks and `/assets` endpoints for asset management. Uploaded files are stored in the `backend/uploads/` directory, and metadata is stored in a `aetherium.db` SQLite file created in the `backend` directory.

### Frontend Setup (Create React App)

The frontend is a standard Create React App.

1.  **Navigate to the project root directory (if not already there).**
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Start the development server:**
    ```bash
    npm start
    ```
    This runs the app in development mode. Open [http://localhost:3000](http://localhost:3000) to view it in your browser. The page will reload when you make changes.

    The frontend expects the backend to be running on `http://localhost:8000`. This can be configured via `REACT_APP_API_URL` environment variable if needed.

---
## Original Create React App Documentation (Below)

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
