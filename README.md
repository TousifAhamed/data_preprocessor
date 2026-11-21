# Data Preprocessor

A Python-based data preprocessing tool designed to clean, transform, and prepare datasets for analysis and machine learning tasks.

## Features

- Data cleaning and normalization
- Missing value handling
- Feature scaling and transformation
- Data format conversion
- Basic statistical analysis

## Installation

### Prerequisites
- Python 3.11+
- Node.js 18+

### Setup

```bash
# Clone the repository
git clone https://github.com/TousifAhamed/data_preprocessor.git
cd data_preprocessor

# Backend (FastAPI)
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Download the NLTK data once, ahead of time (see "Security notes" below)
python -m nltk.downloader punkt_tab stopwords wordnet

# Start the API on http://localhost:8000
python -m app.main
```

```bash
# Frontend (in a second terminal)
cd frontend
npm install
npm start                         # http://localhost:3000
```

## Security notes

### nltk: known advisories without a fix yet
`backend/requirements.txt` pins **nltk 3.10.4**, the newest release. It still has 4 published advisories with **no patched version available**:
- arbitrary file read through `nltk.util.filestring`;
- a path-traversal check gap;
- SSRF in `nltk.download()`;
- the downloader extracting packages before verifying them.

What to do:
1. **Pre-download the NLTK data** with the `python -m nltk.downloader ...` command above, on a trusted network. The app then finds the data locally and doesn't call `nltk.download()` while it runs.
2. **Don't pass user-supplied paths or URLs** to nltk loading functions (`nltk.data.load`, `filestring`, custom download URLs). This app only uses the built-in tokenizer, stopword and lemmatizer data, so it doesn't today.
3. **Upgrade as soon as a fix is released**, then re-check:
   ```bash
   pip install -U nltk
   pip install pip-audit && pip-audit -r requirements.txt
   ```
   Update the `nltk==` pin in `backend/requirements.txt` to the new version and commit it.

### If the backend fails to start with "NLTK package ... is missing"
nltk 3.10 added two safety checks that can block it from finding or downloading data:
- **It ignores data folders other users can write to.** If you see `NLTK will not read data from ... it is writable by ... another account`, make the folder private: `chmod -R go-w ~/nltk_data` (or whichever folder the warning names).
- **It refuses to download through a proxy.** On a corporate network, download the three packages somewhere without a proxy and copy the `nltk_data` folder over. Alternatively, if you trust your proxy, set `NLTK_ALLOW_PROXIED_URLOPEN=1` for the download command only.

### Never commit dependencies or build output
`node_modules/`, `__pycache__/`, `.env` and similar files are listed in `.gitignore`. Install them locally with the commands above.

## Usage

For a quick start, watch our [tutorial video](https://youtu.be/zgjkvP-pmxk) demonstrating how to use Data Preprocessor.


## Requirements

- Python 3.11+
- pandas
- numpy
- scikit-learn

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
