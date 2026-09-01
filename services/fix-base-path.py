#!/usr/bin/env python3
"""
Fix BASE_PATH template variable replacement in n8n HTML files.
This script replaces all {{BASE_PATH}} placeholders with a configurable base path.
"""

import os
import sys
import argparse
from pathlib import Path


def fix_base_path(file_path, base_path="/n8n"):
    """
    Replace {{BASE_PATH}} with the actual base path in HTML files.
    
    Args:
        file_path: Path to the HTML file to fix
        base_path: The base path to use (default: /n8n)
    
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Count occurrences before replacement
        count_before = content.count('{{BASE_PATH}}')
        
        if count_before == 0:
            print(f"✓ No {{{{BASE_PATH}}}} found in {file_path}")
            return True
        
        # Replace all occurrences
        fixed_content = content.replace('{{BASE_PATH}}', base_path)
        
        # Verify replacement
        count_after = fixed_content.count('{{BASE_PATH}}')
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(fixed_content)
        
        print(f"✓ Fixed {file_path}")
        print(f"  Replaced {count_before} instances of {{{{BASE_PATH}}}} with '{base_path}'")
        return True
        
    except Exception as e:
        print(f"✗ Error processing {file_path}: {str(e)}", file=sys.stderr)
        return False


def main():
    parser = argparse.ArgumentParser(
        description='Fix BASE_PATH template variables in n8n HTML files'
    )
    parser.add_argument(
        '--base-path',
        default='/n8n',
        help='Base path to use (default: /n8n)'
    )
    parser.add_argument(
        '--file',
        help='Specific file to fix (optional)'
    )
    parser.add_argument(
        '--dir',
        default='services/n8n-patches',
        help='Directory to search for HTML files (default: services/n8n-patches)'
    )
    
    args = parser.parse_args()
    
    if args.file:
        # Fix specific file
        if not os.path.exists(args.file):
            print(f"✗ File not found: {args.file}", file=sys.stderr)
            sys.exit(1)
        success = fix_base_path(args.file, args.base_path)
        sys.exit(0 if success else 1)
    
    # Fix all HTML files in directory
    directory = Path(args.dir)
    if not directory.exists():
        print(f"✗ Directory not found: {args.dir}", file=sys.stderr)
        sys.exit(1)
    
    html_files = list(directory.glob('*.html'))
    if not html_files:
        print(f"✗ No HTML files found in {args.dir}", file=sys.stderr)
        sys.exit(1)
    
    print(f"Processing {len(html_files)} HTML file(s) in {args.dir}")
    print(f"Base path: {args.base_path}\n")
    
    all_success = True
    for html_file in sorted(html_files):
        if not fix_base_path(html_file, args.base_path):
            all_success = False
    
    if all_success:
        print(f"\n✓ All files processed successfully!")
        sys.exit(0)
    else:
        print(f"\n✗ Some files failed to process", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
