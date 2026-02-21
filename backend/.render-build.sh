#!/bin/bash
# Force Render to use pip instead of Poetry
export PIP_NO_INPUT=1
export PIP_DISABLE_PIP_VERSION_CHECK=1

# Install dependencies with pip
pip install --upgrade pip
pip install -r requirements.txt

# Verify installation
python -c "import flask, pymongo, pandas; print('✅ All imports successful')"