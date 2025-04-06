# SimpleEvents

A modern, AI-assisted timeline and event management application built with Python and Vue.js.

## 🤖 AI-Generated Project

This project was created using [Cursor.ai](https://cursor.sh/), an AI-powered development environment. The human author has basic frontend knowledge, and the entire application - from architecture to implementation - was developed with AI assistance. This includes the sophisticated frontend implementation using Vue.js and Tailwind CSS, which was created entirely through AI guidance.

Future iterations and improvements will continue to be AI-driven, demonstrating the capabilities of AI in full-stack development. The application combines Python's FastAPI backend with a Vue.js frontend to create a seamless timeline management experience.

## ⚠️ Important Note

This application is designed for **personal use only** and does not include authentication. While it's built with basic security considerations in mind, please use it with caution and avoid storing sensitive information. The application is not intended for production use or handling confidential data.

## ✨ Features

- Create and manage multiple timelines
- Add events with custom types and colors
- Responsive design for all devices
- Real-time updates
- Modern, clean UI with Tailwind CSS

## 🚀 Getting Started

### Prerequisites

- Python 3.10 or higher
- [uv](https://github.com/astral-sh/uv) package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/SimpleEvents.git
cd SimpleEvents
```

2. Install uv if you haven't already:
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

3. Create and activate a virtual environment:
```bash
uv venv .venv
source .venv/bin/activate  # On Windows, use: .venv\Scripts\activate
```

4. Install dependencies:
```bash
uv pip install -e .
```

### Running the Application

1. Start the development server:
```bash
python run.py
```

2. Open your browser and navigate to:
```
http://localhost:8000
```

## 🛠️ Development

The project structure is organized as follows:

```
.
├── data/                  # Directory for storing timeline JSON files
├── src/                   # Source code directory
│   └── simpleevent/      # Main package directory
│       ├── __init__.py   # Package initialization
│       ├── main.py       # Core application logic and FastAPI setup
│       ├── models.py     # Data models and type definitions
│       ├── routes.py     # API route handlers
│       └── storage.py    # File storage operations
├── static/               # Static web assets
│   ├── index.html       # Main HTML template
│   ├── css/            # Stylesheets
│   └── js/             # JavaScript files
├── pyproject.toml       # Project dependencies and metadata
├── run.py              # Application entry point
├── .gitignore          # Git ignore rules
├── LICENSE             # MIT License
└── README.md          # Project documentation
```

### Key Components

- `data/`: Stores your timeline data as JSON files
- `src/simpleevent/`: Core backend implementation
  - `main.py`: FastAPI application setup and core logic
  - `models.py`: Pydantic models for data validation
  - `routes.py`: API endpoint implementations
  - `storage.py`: File system operations for timeline data
- `static/`: Frontend assets
  - Pure HTML/CSS/JavaScript implementation
  - No build process required
  - Direct serving of static files
- Configuration:
  - `pyproject.toml`: Modern Python dependency management
  - `run.py`: Simple entry point script

## 🤝 Contributing

While this project was AI-generated, contributions are welcome! Feel free to submit issues and pull requests.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- This project was created with the assistance of AI to demonstrate modern web development practices
- Built with [FastAPI](https://fastapi.tiangolo.com/) and [Vue.js](https://vuejs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons provided by [Material Icons](https://fonts.google.com/icons) 