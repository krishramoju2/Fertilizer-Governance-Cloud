#!/bin/bash
set -e  # Exit on error

# Ensure we're using Python 3.11
export PYTHON_VERSION=3.11

# Upgrade pip first
python -m pip install --upgrade pip

# Install dependencies with verbose output for debugging
pip install --verbose -r requirements.txt

# Verify critical imports
python -c "
import sys
print(f'✅ Python version: {sys.version}')
import flask
import pymongo
import pandas
import numpy
print('✅ All critical imports successful')
print(f'✅ Flask: {flask.__version__}')
print(f'✅ Pandas: {pandas.__version__}')
print(f'✅ NumPy: {numpy.__version__}')
"