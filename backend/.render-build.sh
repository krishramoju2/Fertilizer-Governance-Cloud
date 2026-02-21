#!/bin/bash
set -e
export PIP_NO_INPUT=1
export PIP_DISABLE_PIP_VERSION_CHECK=1
pip install --upgrade pip
pip install -r requirements.txt
python -c "import flask, pymongo; print('✅ Critical imports successful')"
