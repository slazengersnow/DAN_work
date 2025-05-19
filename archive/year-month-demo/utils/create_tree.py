#!/usr/bin/env python3
import os
import sys

def create_tree(directory, prefix="", ignore_dirs={'.git', 'node_modules'}):
    """
    Create a tree structure of the directory
    """
    entries = sorted(os.listdir(directory))
    entries = [e for e in entries if not (os.path.isdir(os.path.join(directory, e)) and e in ignore_dirs)]
    
    dirs = []
    files = []
    
    for entry in entries:
        path = os.path.join(directory, entry)
        if os.path.isdir(path):
            dirs.append(entry)
        else:
            files.append(entry)
    
    # Sort directories first, then files
    entries = sorted(dirs) + sorted(files)
    
    for i, entry in enumerate(entries):
        is_last = i == len(entries) - 1
        path = os.path.join(directory, entry)
        
        if is_last:
            print(f"{prefix}└── {entry}")
            new_prefix = prefix + "    "
        else:
            print(f"{prefix}├── {entry}")
            new_prefix = prefix + "│   "
        
        if os.path.isdir(path) and entry not in ignore_dirs:
            create_tree(path, new_prefix, ignore_dirs)

if __name__ == "__main__":
    directory = sys.argv[1] if len(sys.argv) > 1 else "."
    print(os.path.basename(os.path.abspath(directory)))
    create_tree(directory)