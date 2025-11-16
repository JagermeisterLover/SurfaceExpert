#!/usr/bin/env python3
"""
Script to refactor renderer.js into modular components
This script extracts components and functions into separate files
"""

import re
import os

# Read the original renderer.js
with open('src/renderer.js', 'r', encoding='utf-8') as f:
    content = f.read()
    lines = content.split('\n')

# Component extraction ranges (based on analysis)
extractions = {
    # UI Helper Components
    'src/components/ui/PropertySection.js': {
        'start': 2193,
        'end': 2207,
        'exports': ['PropertySection']
    },
    'src/components/ui/PropertyRow.js': {
        'start': 2209,
        'end': 2237,
        'exports': ['PropertyRow']
    },

    # View Components (need more complex extraction - skip for now, will do manually)
    # 'src/components/views/SummaryView.js': {
    #     'start': 1492,
    #     'end': 1752,
    #     'exports': ['SummaryView']
    # },
    # 'src/components/views/DataView.js': {
    #     'start': 1754,
    #     'end': 1843,
    #     'exports': ['DataView']
    # },
}

def extract_component(lines, start, end, exports):
    """Extract lines from start to end and wrap in module"""
    # Lines are 1-indexed in the file, but 0-indexed in the array
    component_lines = lines[start-1:end]

    header = "const { createElement: h } = React;\n\n"
    code = '\n'.join(component_lines)
    footer = f"\n\nexport {{ {', '.join(exports)} }};\n"

    return header + code + footer

# Create directories
os.makedirs('src/components/ui', exist_ok=True)
os.makedirs('src/components/views', exist_ok=True)
os.makedirs('src/components/dialogs', exist_ok=True)
os.makedirs('src/components/plots', exist_ok=True)

# Extract components
for filepath, config in extractions.items():
    content = extract_component(lines, config['start'], config['end'], config['exports'])

    # Create directory if needed
    os.makedirs(os.path.dirname(filepath), exist_ok=True)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"Created: {filepath}")

print("\nExtraction complete!")
print("\nNote: Large components (SummaryView, DataView, Dialogs, PropertiesPanel)")
print("need to be extracted manually due to their complexity.")
