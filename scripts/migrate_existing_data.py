#!/usr/bin/env python3
"""
Migrates current SAMPLE_INITIATIVES into the SQLite database.
"""

import sys
import os
import json
import re

sys.path.insert(0, os.path.dirname(__file__))
from db_manager import init_db, save_initiative, get_connection

def extract_initiatives_from_ts(ts_path: str):
    with open(ts_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extract SAMPLE_INITIATIVES block
    match = re.search(r'export const SAMPLE_INITIATIVES: Initiative\[\] = (\[.*?\]);\n\nexport function', content, re.DOTALL)
    if not match:
        raise ValueError("Could not find SAMPLE_INITIATIVES array in file")

    json_like = match.group(1)

    # Replace JS function calls like build350Deputies(175, 170, 5)?.groupVotes with null
    json_clean = re.sub(r'build350Deputies\([^)]*\)\?\.groupVotes', 'null', json_like)
    json_clean = re.sub(r'build350Deputies\([^)]*\)\?\.deputies', 'null', json_clean)
    
    # Fix trailing commas
    json_clean = re.sub(r',\s*([\]}])', r'\1', json_clean)
    
    # Fix unquoted keys if any
    # Since keys like id, title, etc are unquoted in TS, let's parse with a custom regex or node
    return None

if __name__ == '__main__':
    init_db()
